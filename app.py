"""
SmartChat AI — AI Chatbot Web Application
Backend Server (Flask)
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Load environment variables from .env file
load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SmartChatAI")

# Initialize Flask app
app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "smartchat-ai-college-project-2026")
app.config["JSON_AS_ASCII"] = False

# System Prompt for SmartChat AI
SYSTEM_PROMPT = """You are SmartChat AI, a highly capable, intelligent, and friendly AI assistant designed for learning, problem-solving, coding, engineering, and everyday questions.

Core Guidelines:
1. Accuracy & Reliability: Provide factual, precise, and well-reasoned answers. Distinguish facts from opinions. If you do not know an answer or lack verified information (such as private real-time data or unknown trivia), explicitly state uncertainty rather than hallucinating.
2. Engineering & Educational Focus: For computer science, engineering, mathematics, science, and academic topics, explain concepts clearly with intuitive explanations, step-by-step derivations, and real-world analogies suitable for engineering students.
3. Code & Programming:
   - Provide clean, robust, and commented code examples.
   - Always wrap code in standard Markdown code blocks with appropriate language identifiers (e.g., ```python, ```javascript, ```java, ```cpp, ```html, ```sql).
   - Explain why the code works and highlight edge cases or performance considerations.
4. Formatting & Readability:
   - Structure responses logically using Markdown headers (###), bold text, bullet lists, and numbered steps.
   - Keep answers concise for simple questions, and thorough/structured for complex problems.
5. Entertainment, Culture & General Knowledge:
   - For film, history, literature, and general knowledge, provide verified facts without inventing movie titles, cast lists, release years, or awards.
6. Tone: Professional, encouraging, respectful, and articulate.
"""

from nlp_model import SmartChatNLPModel

# Initialize Local NLP Model
nlp_engine = SmartChatNLPModel(dataset_path="dataset.json", model_cache_path="smartchat_model.pkl")

# Supported API Providers
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free").strip()


def get_active_provider():
    """Detect which AI API provider is configured."""
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
        return "Gemini", GEMINI_MODEL
    if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"):
        return "Groq", GROQ_MODEL
    if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("your_"):
        return "OpenAI", OPENAI_MODEL
    if OPENROUTER_API_KEY and not OPENROUTER_API_KEY.startswith("your_"):
        return "OpenRouter", OPENROUTER_MODEL
    return "SmartChat-NLP", "Local-Neural-Engine"



def call_gemini_api(user_message, history=None):
    """Call Google Gemini REST API."""
    import requests

    raw_contents = []

    # Include system instruction via system_instruction field or prepend to first message
    if history and isinstance(history, list):
        for msg in history[-8:]:  # keep last 8 messages for context
            role = "user" if msg.get("role") == "user" else "model"
            text = msg.get("content", "").strip()
            if text:
                raw_contents.append({"role": role, "parts": [{"text": text}]})

    # Add current user message
    raw_contents.append({"role": "user", "parts": [{"text": user_message}]})

    # Ensure alternating turns (Gemini API requirement)
    contents = []
    for item in raw_contents:
        if contents and contents[-1]["role"] == item["role"]:
            contents[-1]["parts"].extend(item["parts"])
        else:
            contents.append(item)

    # Models to try in order
    models_to_try = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
                "topP": 0.95
            }
        }

        try:
            logger.info(f"Calling Gemini API with model: {model_name}")
            resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=25)
            
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return "I received your message, but no response text was generated. Please try rephrasing."
            elif resp.status_code == 404:
                # Try next model if 404
                logger.warning(f"Model {model_name} returned 404, trying alternate model...")
                last_error = f"Model {model_name} not found"
                continue
            elif resp.status_code == 429:
                return "The AI rate limit was reached. Please wait a few seconds and try again."
            else:
                err_data = resp.json().get("error", {}) if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_msg = err_data.get("message", resp.text)
                logger.error(f"Gemini API error ({resp.status_code}): {err_msg}")
                last_error = f"Gemini API returned error {resp.status_code}: {err_msg}"
                break
        except requests.exceptions.Timeout:
            logger.error("Gemini API request timed out.")
            last_error = "The AI service timed out while generating a response. Please try again."
            break
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error calling Gemini API: {e}")
            last_error = f"Network connection error: {e}"
            break

    raise Exception(last_error or "Unable to generate response from Gemini API.")


def call_openai_compatible_api(endpoint, api_key, model, user_message, history=None):
    """Call OpenAI, Groq, or OpenRouter chat completion endpoint."""
    import requests

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history and isinstance(history, list):
        for msg in history[-8:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            text = msg.get("content", "").strip()
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=25)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            return "No response generated. Please try again."
        elif resp.status_code == 429:
            return "Rate limit reached. Please wait a moment and try again."
        else:
            err_msg = resp.text
            try:
                err_msg = resp.json().get("error", {}).get("message", resp.text)
            except Exception:
                pass
            logger.error(f"API Error ({resp.status_code}): {err_msg}")
            raise Exception(f"API Error {resp.status_code}: {err_msg}")
    except requests.exceptions.Timeout:
        raise Exception("Request timed out while waiting for AI response.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network communication error: {e}")


def offline_educational_engine(user_message):
    """
    Intelligent built-in fallback knowledge assistant.
    Provides rich, accurate, and structured answers for college subjects,
    CS topics, coding, and general inquiries if no API key has been added yet.
    """
    msg = user_message.lower().strip()

    # Tip reminder prefix
    tip = (
        "> **Note**: Running in *SmartChat Offline Mode*. To connect live Gemini AI, "
        "add your free `GEMINI_API_KEY` in the `.env` file.\n\n"
    )

    if "machine learning" in msg or "ml" in msg and ("what is" in msg or "explain" in msg):
        return tip + (
            "### What is Machine Learning?\n\n"
            "**Machine Learning (ML)** is a branch of Artificial Intelligence (AI) focused on building applications that learn from data and improve their accuracy over time without being explicitly programmed.\n\n"
            "#### Core Categories of Machine Learning:\n"
            "1. **Supervised Learning**:\n"
            "   - Trained on labeled datasets (Inputs paired with correct outputs).\n"
            "   - *Examples*: Classification (Spam Detection, Image Recognition), Regression (House Price Prediction).\n"
            "   - *Popular Algorithms*: Linear Regression, Logistic Regression, Random Forest, Support Vector Machines (SVM).\n\n"
            "2. **Unsupervised Learning**:\n"
            "   - Trained on unlabeled data to discover hidden patterns or groupings.\n"
            "   - *Examples*: Clustering (Customer Segmentation), Dimensionality Reduction (PCA).\n"
            "   - *Popular Algorithms*: K-Means, Hierarchical Clustering, DBSCAN.\n\n"
            "3. **Reinforcement Learning (RL)**:\n"
            "   - Agents learn optimal actions through trial, error, rewards, and penalties.\n"
            "   - *Examples*: Robotics, Self-driving vehicles, Game AI (AlphaGo).\n\n"
            "#### Standard ML Workflow:\n"
            "```text\n"
            "Data Collection -> Data Preprocessing -> Feature Engineering -> Model Training -> Evaluation -> Deployment\n"
            "```"
        )

    elif "debug" in msg or ("python" in msg and "error" in msg) or "help me debug" in msg:
        return tip + (
            "### Python Debugging Best Practices & Common Fixes\n\n"
            "Here is a systematic approach to debugging Python code:\n\n"
            "#### 1. Understand Common Python Exceptions:\n"
            "- **`IndexError`**: Attempting to access an index outside list bounds.\n"
            "- **`KeyError`**: Trying to access a non-existent dictionary key (Use `.get(key, default)`).\n"
            "- **`TypeError`**: Operating on incompatible types (e.g., adding `int` and `str`).\n"
            "- **`AttributeError`**: Accessing a property or method that doesn't exist on the object.\n\n"
            "#### 2. Debugging Tools in Python:\n"
            "```python\n"
            "# 1. Built-in Interactive Debugger (breakpoint)\n"
            "def calculate_average(grades):\n"
            "    if not grades:\n"
            "        return 0.0\n"
            "    # Pauses execution and opens Python debugger (PDB)\n"
            "    # breakpoint()\n"
            "    return sum(grades) / len(grades)\n\n"
            "# 2. Safe Exception Handling\n"
            "try:\n"
            "    result = calculate_average([85, 90, 78])\n"
            "    print(f'Average grade: {result:.2f}')\n"
            "except ZeroDivisionError as e:\n"
            "    print(f'Error: Division by zero - {e}')\n"
            "```\n\n"
            "**Pro Tip**: Paste the exact error traceback and your code snippet here, and I will pinpoint the exact line and fix it!"
        )

    elif "dbms" in msg or "normalization" in msg:
        return tip + (
            "### DBMS Normalization Explained\n\n"
            "**Normalization** is the process of organizing database relations (tables) to minimize **data redundancy** (duplication) and eliminate **anomalies** (Insertion, Update, and Deletion anomalies).\n\n"
            "#### Normal Forms Overview:\n\n"
            "1. **First Normal Form (1NF)**:\n"
            "   - Every column must contain **atomic (indivisible)** values.\n"
            "   - No repeating groups or arrays in a single column.\n"
            "   - Each table must have a primary key.\n\n"
            "2. **Second Normal Form (2NF)**:\n"
            "   - Must satisfy 1NF.\n"
            "   - **No Partial Dependency**: All non-key attributes must depend fully on the complete primary key (relevant for composite keys).\n\n"
            "3. **Third Normal Form (3NF)**:\n"
            "   - Must satisfy 2NF.\n"
            "   - **No Transitive Dependency**: Non-key attributes must not depend on other non-key attributes ($X \\to Y \\to Z$).\n\n"
            "4. **Boyce-Codd Normal Form (BCNF)**:\n"
            "   - A stricter version of 3NF. For every functional dependency $X \\to Y$, $X$ must be a **Super Key**.\n\n"
            "#### Summary Table:\n\n"
            "| Normal Form | Requirement to Satisfy |\n"
            "| :--- | :--- |\n"
            "| **1NF** | Atomic values, unique records |\n"
            "| **2NF** | 1NF + No partial functional dependency |\n"
            "| **3NF** | 2NF + No transitive dependency |\n"
            "| **BCNF** | 3NF + For every $X \\to Y$, $X$ is a super key |"
        )

    elif "project" in msg and ("idea" in msg or "college" in msg or "final year" in msg):
        return tip + (
            "### College Capstone & Mini-Project Ideas\n\n"
            "Here are top project ideas categorized by domain for college evaluations:\n\n"
            "#### 1. AI & Machine Learning:\n"
            "- **SmartChat AI Assistant**: Multi-modal chat assistant with document analysis (RAG) and local vector embeddings.\n"
            "- **Automated Resume Screening System**: NLP-driven resume parser with job-description matching and scoring.\n"
            "- **Medical Image Anomaly Detection**: Convolutional Neural Network (CNN) for X-ray / skin lesion classification.\n\n"
            "#### 2. Web & Full-Stack Development:\n"
            "- **Student Learning Management & Collaboration Portal**: Real-time study rooms, code snippets, notes, and task tracker (Flask/React).\n"
            "- **Campus Lost & Found Platform**: Image verification, geolocation tagging, and automated notification alerts.\n\n"
            "#### 3. Cybersecurity & Systems:\n"
            "- **Network Intrusion Detection System (NIDS)**: Packet sniffer with anomaly-based detection using Python Scapy and Random Forest.\n"
            "- **Secure Decentralized Credential Verifier**: Tamper-proof certificate issuing and cryptographic verification.\n\n"
            "Which area interests you the most? I can provide the full tech stack, database schema, and architecture!"
        )

    elif "hello" in msg or "hi" in msg or "hey" in msg:
        return (
            "### Hello! Welcome to SmartChat AI\n\n"
            "I am your intelligent AI assistant, ready to assist you with:\n\n"
            "- **Programming & Debugging**: Python, Java, C++, JavaScript, SQL, HTML/CSS.\n"
            "- **Computer Science & Engineering**: DBMS, Data Structures, Algorithms, OS, Networks, AI/ML.\n"
            "- **Project Development**: System architecture, API design, idea brainstorming.\n"
            "- **General Knowledge & Learning**: Math, science, clear technical breakdowns.\n\n"
            "How can I help you today? Feel free to ask any question or try one of the prompt suggestions!"
        )

    else:
        # General response
        return tip + (
            f"### SmartChat AI Response\n\n"
            f"Thank you for asking about: **{user_message}**.\n\n"
            f"Here is a structured overview:\n\n"
            f"1. **Core Concept**: Analyzing the key elements of your question.\n"
            f"2. **Detailed Solution**: When connected to the live AI API, SmartChat AI generates full real-time answers with code examples and customized answers.\n\n"
            f"To enable live, unlimited real-time generation powered by Google Gemini, simply add your API key to `.env`:\n\n"
            f"```bash\n"
            f"# In your .env file:\n"
            f"GEMINI_API_KEY=AIzaSy...\n"
            f"```\n\n"
            f"Feel free to ask questions about **Python, DBMS, Machine Learning, Data Structures, Web Development, or Project Ideas**!"
        )


def generate_ai_response(user_message, history=None, requested_model=None):
    """
    Route message to requested AI provider, active cloud provider,
    or the local NLP model engine.
    """
    active_provider, default_model = get_active_provider()
    
    # If client explicitly selected Local NLP, use local engine
    if not requested_model or requested_model in ("local-nlp", "SmartChat-NLP"):
        logger.info("Executing SmartChat Local NLP Model Engine...")
        reply = nlp_engine.generate_response(user_message)
        return reply, "SmartChat-NLP (Local)"

    req_lower = requested_model.lower() if requested_model else ""
    provider_to_use = None

    if "gemini" in req_lower:
        if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
            provider_to_use = "Gemini"
        else:
            logger.info("Gemini requested but no API key configured. Using Local NLP with notice.")
            local_reply = nlp_engine.generate_response(user_message)
            notice = "> ℹ️ **Notice**: Google Gemini API key is not configured in `.env`. Responding using the built-in **SmartChat Local NLP Engine**.\n\n"
            return notice + local_reply, "SmartChat-NLP (Local)"

    elif "groq" in req_lower:
        if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"):
            provider_to_use = "Groq"
        else:
            logger.info("Groq requested but no API key configured. Using Local NLP with notice.")
            local_reply = nlp_engine.generate_response(user_message)
            notice = "> ℹ️ **Notice**: Groq API key is not configured in `.env`. Responding using the built-in **SmartChat Local NLP Engine**.\n\n"
            return notice + local_reply, "SmartChat-NLP (Local)"

    elif "openai" in req_lower:
        if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("your_"):
            provider_to_use = "OpenAI"
        else:
            logger.info("OpenAI requested but no API key configured. Using Local NLP with notice.")
            local_reply = nlp_engine.generate_response(user_message)
            notice = "> ℹ️ **Notice**: OpenAI API key is not configured in `.env`. Responding using the built-in **SmartChat Local NLP Engine**.\n\n"
            return notice + local_reply, "SmartChat-NLP (Local)"

    else:
        provider_to_use = active_provider

    logger.info(f"Routing request to provider: {provider_to_use}")

    if provider_to_use == "Gemini":
        try:
            return call_gemini_api(user_message, history), "Gemini (Cloud)"
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Fallback)"

    elif provider_to_use == "Groq":
        try:
            return call_openai_compatible_api(
                "https://api.groq.com/openai/v1/chat/completions",
                GROQ_API_KEY,
                GROQ_MODEL,
                user_message,
                history
            ), "Groq (Cloud)"
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Fallback)"

    elif provider_to_use == "OpenAI":
        try:
            return call_openai_compatible_api(
                "https://api.openai.com/v1/chat/completions",
                OPENAI_API_KEY,
                OPENAI_MODEL,
                user_message,
                history
            ), "OpenAI (Cloud)"
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Fallback)"

    elif provider_to_use == "OpenRouter":
        try:
            return call_openai_compatible_api(
                "https://openrouter.ai/api/v1/chat/completions",
                OPENROUTER_API_KEY,
                OPENROUTER_MODEL,
                user_message,
                history
            ), "OpenRouter (Cloud)"
        except Exception as e:
            logger.warning(f"OpenRouter API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Fallback)"

    else:
        # Standalone Local NLP Engine
        return nlp_engine.generate_response(user_message), "SmartChat-NLP (Local)"


# ==========================================
# Application Routes
# ==========================================

@app.route("/")
def index():
    """Render the main SmartChat AI application page."""
    provider, model = get_active_provider()
    model_info = nlp_engine.get_model_info()
    return render_template("index.html", provider=provider, model=model, model_info=model_info)


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat API Endpoint.
    Accepts JSON:
    {
        "message": "User question string",
        "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
        "model": "local-nlp" | "gemini" | "groq" | "openai"
    }
    """
    if not request.is_json:
        return jsonify({
            "status": "error",
            "error": "Invalid request format. JSON payload expected."
        }), 400

    data = request.get_json()
    user_message = data.get("message", "").strip()
    history = data.get("history", [])
    requested_model = data.get("model", "")

    if not user_message:
        return jsonify({
            "status": "error",
            "error": "Message cannot be empty."
        }), 400

    if len(user_message) > 4000:
        return jsonify({
            "status": "error",
            "error": "Message is too long. Please limit your query to 4000 characters."
        }), 400

    try:
        start_time = time.time()
        reply, used_provider = generate_ai_response(user_message, history, requested_model)
        elapsed = round(time.time() - start_time, 2)

        return jsonify({
            "status": "success",
            "reply": reply,
            "provider": used_provider,
            "latency": elapsed,
            "timestamp": datetime.now().strftime("%I:%M %p")
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error in /api/chat: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": "Sorry, I couldn't process that request right now. Please try again in a moment.",
            "details": str(e) if app.debug else None
        }), 500


@app.route("/api/model-info", methods=["GET"])
def get_model_diagnostics():
    """Returns local NLP model diagnostics and active pipeline specs."""
    info = nlp_engine.get_model_info()
    provider, active_model = get_active_provider()
    info["active_cloud_provider"] = provider
    info["active_cloud_model"] = active_model
    info["has_gemini_key"] = bool(GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"))
    info["has_groq_key"] = bool(GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"))
    info["has_openai_key"] = bool(OPENAI_API_KEY and not OPENAI_API_KEY.startswith("your_"))
    return jsonify({"status": "success", "model_info": info}), 200


@app.route("/api/health", methods=["GET"])
def health():
    """Check API health and active provider configuration."""
    provider, model = get_active_provider()
    return jsonify({
        "status": "online",
        "app_name": "SmartChat AI",
        "provider": provider,
        "model": model,
        "local_nlp_ready": nlp_engine.is_trained,
        "live_api_configured": provider not in ("SmartChat-NLP", "Offline-Engine", "Offline-Fallback"),
        "timestamp": datetime.now().isoformat()
    }), 200



@app.route("/api/clear", methods=["POST"])
def clear_session():
    """Endpoint for clearing conversation state confirmation."""
    return jsonify({
        "status": "success",
        "message": "Chat session cleared successfully."
    }), 200


# Error Handlers
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"status": "error", "error": "API route not found"}), 404
    return render_template("index.html"), 404


@app.errorhandler(500)
def server_error(e):
    logger.error(f"Internal Server Error: {e}")
    if request.path.startswith("/api/"):
        return jsonify({"status": "error", "error": "Internal server error"}), 500
    return render_template("index.html"), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "127.0.0.1")
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    
    print(f"\n=======================================================")
    print(f"  🚀 SmartChat AI Web Application Running")
    print(f"  📍 Local URL: http://{host}:{port}")
    print(f"  ⚙️  Active AI Provider: {get_active_provider()[0]}")
    print(f"=======================================================\n")
    
    app.run(host=host, port=port, debug=debug_mode)
