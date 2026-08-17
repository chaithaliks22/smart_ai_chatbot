"""
SmartChat AI — Database & User Authentication Module
Handles SQLite user persistence, password hashing, password reset tokens,
Google OAuth profile handling, and user session storage.
"""

import os
import sqlite3
import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")


def get_db_connection():
    """Create and return a database connection with dict-like row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize SQLite database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            avatar_url TEXT,
            provider TEXT DEFAULT 'email',
            reset_token TEXT,
            reset_token_expiry TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sessions_data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            prompt TEXT NOT NULL,
            response TEXT NOT NULL,
            rating TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def create_user(name, email, password=None, provider="email", avatar_url=None):
    """Create a new user with hashed password or provider info."""
    clean_email = email.strip().lower()
    clean_name = name.strip()

    if not clean_email or not clean_name:
        raise ValueError("Name and email are required.")

    password_hash = generate_password_hash(password) if password else None

    # Generate initials avatar if not provided
    if not avatar_url:
        avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={clean_name}&backgroundColor=2563eb,3b82f6,1d4ed8"

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, provider, avatar_url)
            VALUES (?, ?, ?, ?, ?)
            """,
            (clean_name, clean_email, password_hash, provider, avatar_url)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        raise ValueError("An account with this email address already exists.")
    finally:
        conn.close()


def get_user_by_email(email):
    """Fetch user record by email address."""
    clean_email = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def get_user_by_id(user_id):
    """Fetch user record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, avatar_url, provider, created_at FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def verify_user_login(email, password):
    """Verify email and password credentials."""
    user = get_user_by_email(email)
    if not user:
        return None, "No account found with this email address."

    if user["provider"] == "google" and not user["password_hash"]:
        return None, "This account is registered via Google Sign-In. Please click 'Continue with Google'."

    if not user["password_hash"] or not check_password_hash(user["password_hash"], password):
        return None, "Invalid email or password. Please try again."

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "avatar_url": user["avatar_url"],
        "provider": user["provider"],
        "created_at": user["created_at"]
    }, None


def handle_google_user(email, name, avatar_url=None):
    """Sign in or register a user authenticating via Google."""
    clean_email = email.strip().lower()
    clean_name = name.strip() or "Google User"

    existing_user = get_user_by_email(clean_email)
    if existing_user:
        # Update avatar/name if provided
        if avatar_url and existing_user["avatar_url"] != avatar_url:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (avatar_url, existing_user["id"]))
            conn.commit()
            conn.close()
        return get_user_by_id(existing_user["id"])

    # Create new Google user
    return create_user(
        name=clean_name,
        email=clean_email,
        password=None,
        provider="google",
        avatar_url=avatar_url
    )


def create_password_reset_code(email):
    """Generate a 6-digit reset code with 15-minute expiration."""
    clean_email = email.strip().lower()
    user = get_user_by_email(clean_email)
    if not user:
        return None, "No account found with this email address."

    # Generate 6-digit code
    code = f"{secrets.randbelow(900000) + 100000}"
    expiry = datetime.now() + timedelta(minutes=15)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
        (code, expiry.isoformat(), user["id"])
    )
    conn.commit()
    conn.close()

    return code, None


def reset_user_password(email, code, new_password):
    """Verify reset code and update password."""
    clean_email = email.strip().lower()
    user = get_user_by_email(clean_email)
    if not user:
        return False, "No account found with this email address."

    if not user["reset_token"] or user["reset_token"] != code.strip():
        return False, "Invalid reset code. Please check and try again."

    if user["reset_token_expiry"]:
        try:
            expiry = datetime.fromisoformat(user["reset_token_expiry"])
            if datetime.now() > expiry:
                return False, "Reset code has expired. Please request a new code."
        except Exception:
            pass

    # Update password and clear token
    new_hash = generate_password_hash(new_password)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
        (new_hash, user["id"])
    )
    conn.commit()
    conn.close()

    return True, None


def save_user_sessions(user_id, sessions_json):
    """Save user chat history to database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM user_chat_history WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()

    if row:
        cursor.execute(
            "UPDATE user_chat_history SET sessions_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            (sessions_json, user_id)
        )
    else:
        cursor.execute(
            "INSERT INTO user_chat_history (user_id, sessions_data) VALUES (?, ?)",
            (user_id, sessions_json)
        )

    conn.commit()
    conn.close()


def get_user_sessions(user_id):
    """Retrieve user chat history from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT sessions_data FROM user_chat_history WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row["sessions_data"] if row else None


def save_response_feedback(user_id, prompt, response, rating):
    """Save user rating/feedback for an AI response."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO ai_feedback (user_id, prompt, response, rating) VALUES (?, ?, ?, ?)",
        (user_id, prompt, response, rating)
    )
    conn.commit()
    conn.close()
    return True


def get_feedback_stats():
    """Retrieve summary stats of user feedback."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT rating, COUNT(*) as count FROM ai_feedback GROUP BY rating")
    rows = cursor.fetchall()
    conn.close()
    return {row["rating"]: row["count"] for row in rows}


# Auto-initialize database on import
init_db()

