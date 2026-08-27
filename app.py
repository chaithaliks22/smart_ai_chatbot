"""
SmartChat AI — AI Chatbot Web Application
Backend Server (Flask)
"""

import os
import sys
import re
import json
import time
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session
import database

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SmartChatAI")

# Initialize Flask app with explicit folder paths
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "smartchat-ai-college-project-2026")
app.config["JSON_AS_ASCII"] = False

# System Prompt for SmartChat AI with Precision Guidelines
SYSTEM_PROMPT = r"""You are SmartChat AI, an elite, highly intelligent, and accurate AI assistant engineered for deep learning, problem-solving, engineering, mathematics, computer science, medicine, science, humanities, cinema, sports, and general knowledge.

Core Directives:
1. Supreme Accuracy & Factual Reliability:
   - Provide precise, verifiable, and logically sound answers.
   - Never hallucinate facts, dates, names, or code functions.
   - If grounding knowledge is provided in the prompt, treat it as ground truth.
2. Structure & Clarity:
   - Begin with a crisp definition / direct answer.
   - Organize complex topics into structured sections with clear Markdown headings (`###`, `####`), bold keywords, and bullet points.
   - Include comparison tables or summary matrices where applicable.
3. Code & Technical Precision:
   - Provide complete, production-ready, clean, and well-commented code snippets.
   - Always wrap code in appropriate Markdown fenced blocks (e.g. ```python, ```javascript, ```cpp, ```java, ```html, ```sql).
   - Detail Big-O time and space complexity ($\mathcal{O}(n)$, $\mathcal{O}(\log n)$) and explain edge cases.
4. Mathematics & Formulas:
   - Express mathematical equations cleanly using LaTeX syntax (e.g., $E = mc^2$, $\sum_{i=1}^n x_i$).
   - Show step-by-step analytical derivations and intermediate steps.
5. Tone: Articulate, respectful, authoritative, and empowering.
"""

from nlp_model import SmartChatNLPModel, get_live_grounding_context, fetch_live_knowledge_summary

# Initialize Local NLP Model with absolute paths
nlp_engine = SmartChatNLPModel(
    dataset_path=os.path.join(BASE_DIR, "dataset.json"),
    model_cache_path=os.path.join(BASE_DIR, "smartchat_model.pkl")
)

# Supported API Providers & Verified Active Models
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
GROQ_FALLBACK_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
    "qwen/qwen3.6-27b",
    "groq/compound-mini"
]

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free").strip()


def clean_llm_response(text):
    """Clean internal reasoning tags like <think>...</think> and excessive whitespace."""
    if not text:
        return ""
    # Strip thinking tags if present
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text).strip()
    return cleaned if cleaned else text.strip()


def get_active_provider():
    """Detect which AI API provider is configured, prioritizing high-speed Groq."""
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY).strip()
    if groq_key and not groq_key.startswith("your_"):
        return "Groq", os.getenv("GROQ_MODEL", GROQ_MODEL).strip()
    gemini_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY).strip()
    if gemini_key and not gemini_key.startswith("your_"):
        return "Gemini", os.getenv("GEMINI_MODEL", GEMINI_MODEL).strip()
    openai_key = os.getenv("OPENAI_API_KEY", OPENAI_API_KEY).strip()
    if openai_key and not openai_key.startswith("your_"):
        return "OpenAI", OPENAI_MODEL
    openrouter_key = os.getenv("OPENROUTER_API_KEY", OPENROUTER_API_KEY).strip()
    if openrouter_key and not openrouter_key.startswith("your_"):
        return "OpenRouter", OPENROUTER_MODEL
    return "SmartChat-NLP", "Local-Neural-Engine"



def call_gemini_api(user_message, history=None):
    """Call Google Gemini Generative AI API using official SDK."""
    from google import genai
    from google.genai import types

    current_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY).strip()
    current_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not current_key or current_key.startswith("your_"):
        raise Exception("GEMINI_API_KEY is not configured in .env")

    client = genai.Client(api_key=current_key)

    models_to_try = [current_model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    seen = set()
    models_to_try = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    # Fetch live grounding context if applicable
    grounding_info = get_live_grounding_context(user_message)
    sys_instruction = SYSTEM_PROMPT
    if grounding_info:
        sys_instruction += f"\n\nREAL-TIME VERIFIED FACTUAL CONTEXT:\n{grounding_info}"

    contents = []
    if history and isinstance(history, list):
        for msg in history[-8:]:
            role = "user" if msg.get("role") == "user" else "model"
            text = msg.get("content", "").strip()
            if text:
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    config = types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=0.7,
        max_output_tokens=2048,
        top_p=0.95
    )

    last_error = None
    for model_name in models_to_try:
        try:
            logger.info(f"Calling Google Gemini API with model: {model_name}")
            resp = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            if resp and resp.text:
                return clean_llm_response(resp.text)
        except Exception as e:
            err_str = str(e)
            logger.warning(f"Gemini model {model_name} failed: {err_str[:150]}")
            last_error = e

    raise last_error if last_error else Exception("Gemini generation failed: No models succeeded.")


def call_openai_compatible_api(endpoint, api_key, model, user_message, history=None, persona="standard"):
    """Call OpenAI, Groq, or OpenRouter chat completion endpoint with persona prompt and model pool fallback."""
    import requests

    persona_prompt = SYSTEM_PROMPT
    if persona == "coder":
        persona_prompt += (
            "\n\nSPECIAL INSTRUCTION (Coding Specialist Persona): "
            "You are acting as an expert Software Engineer and Coding Mentor. "
            "Provide clean, well-commented, robust code in standard markdown code blocks. "
            "Include Big-O time and space complexity analysis, explain edge cases, and describe how the code works."
        )
    elif persona == "academic":
        persona_prompt += (
            "\n\nSPECIAL INSTRUCTION (Academic & Viva Prep Persona): "
            "You are acting as a Computer Science Professor and Viva Examiner. "
            "Provide rigorous, academic-level explanations with formal definitions, core architectural principles, "
            "step-by-step mathematical or algorithmic breakdowns, and highlight likely viva/exam questions on this topic."
        )
    elif persona == "concise":
        persona_prompt += (
            "\n\nSPECIAL INSTRUCTION (Quick & Concise Persona): "
            "You are acting as a Quick & Concise Assistant. "
            "Provide succinct, high-yield bulleted points with zero filler or introductory preamble."
        )

    # Attach verified real-time knowledge grounding if relevant
    grounding_info = get_live_grounding_context(user_message)
    if grounding_info:
        persona_prompt += f"\n\n[VERIFIED REAL-TIME FACTUAL CONTEXT (Use this to provide 100% accurate, up-to-date answers)]:\n{grounding_info}"

    messages = [{"role": "system", "content": persona_prompt}]

    if history and isinstance(history, list):
        for msg in history[-8:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            text = msg.get("content", "").strip()
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_message})

    # Prepare model candidate pool
    models_to_try = [model]
    if "groq.com" in endpoint:
        for fallback in GROQ_FALLBACK_MODELS:
            if fallback not in models_to_try:
                models_to_try.append(fallback)
    elif "openrouter.ai" in endpoint:
        fallbacks = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-exp:free", "qwen/qwen-2.5-72b-instruct"]
        for fallback in fallbacks:
            if fallback not in models_to_try:
                models_to_try.append(fallback)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    last_error = None
    for candidate_model in models_to_try:
        payload = {
            "model": candidate_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2048
        }
        try:
            logger.info(f"Dispatching completion to {endpoint} with model {candidate_model}")
            resp = requests.post(endpoint, json=payload, headers=headers, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    raw_content = choices[0].get("message", {}).get("content", "")
                    cleaned_content = clean_llm_response(raw_content)
                    if cleaned_content:
                        return cleaned_content
                return "No response generated. Please try again."
            elif resp.status_code == 429:
                logger.warning(f"Model {candidate_model} hit rate limit 429, trying next model...")
                last_error = Exception("Rate limit reached on model")
                continue
            elif resp.status_code == 404:
                logger.warning(f"Model {candidate_model} not found 404, trying next model in pool...")
                last_error = Exception(f"Model {candidate_model} not found")
                continue
            else:
                err_msg = resp.text
                try:
                    err_msg = resp.json().get("error", {}).get("message", resp.text)
                except Exception:
                    pass
                logger.error(f"API Error on model {candidate_model} ({resp.status_code}): {err_msg}")
                last_error = Exception(f"API Error {resp.status_code}: {err_msg}")
                continue
        except requests.exceptions.Timeout:
            last_error = Exception(f"Request timed out on model {candidate_model}")
            continue
        except requests.exceptions.RequestException as e:
            last_error = Exception(f"Network error on model {candidate_model}: {e}")
            continue

    if last_error:
        raise last_error
    raise Exception("Chat completion failed: No models in pool succeeded.")


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
            "# Function demonstrating clean Pythonic data processing\n"
            "def filter_even_squares(numbers: list[int]) -> list[int]:\n"
            "    \"\"\"Return squares of even numbers in a list.\"\"\"\n"
            "    return [n ** 2 for n in numbers if n % 2 == 0]\n\n"
            "data = [1, 2, 3, 4, 5, 6, 7, 8]\n"
            "print(filter_even_squares(data))  # Output: [4, 16, 36, 64]\n"
            "```\n\n"
            "**Need help with a specific concept?** Feel free to ask about Object-Oriented Programming (OOP), Data Science, or Web Development!"
        )

    elif any(q in msg_lower for q in ["machine learning", "ml", "ai", "neural", "deep learning", "nlp", "model"]):
        return tip + (
            "### Machine Learning (ML) & AI Fundamentals\n\n"
            "**Machine Learning** is a branch of Artificial Intelligence that enables computer systems to learn patterns directly from data rather than following explicitly hardcoded rules.\n\n"
            "#### Primary Machine Learning Paradigms:\n"
            "1. **Supervised Learning**: Model learns on labeled input-output pairs (e.g., Linear Regression, Decision Trees, Support Vector Machines).\n"
            "2. **Unsupervised Learning**: Uncovers hidden structure in unlabeled datasets (e.g., K-Means Clustering, PCA).\n"
            "3. **Reinforcement Learning**: Agent learns optimal decision-making strategies through reward signals in dynamic environments.\n\n"
            "#### Standard ML Pipeline:\n"
            "```text\n"
            "Data Collection ──> Preprocessing & TF-IDF Vectorization ──> Model Training ──> Evaluation (F1, Accuracy) ──> Deployment\n"
            "```\n\n"
            "*Ask me any follow-up question on algorithms, loss functions, or training pipelines!*"
        )

    elif any(q in msg_lower for q in ["hi", "hello", "hey", "who are you", "what can you do"]):
        return (
            "### Hello! I'm SmartChat AI 👋\n\n"
            "I'm an intelligent, full-stack AI assistant powered by **Groq Llama 3.3 70B** and local on-device NLP processing.\n\n"
            "#### What I can help you with:\n"
            "- **Coding & Engineering**: Python, JavaScript, C++, SQL, Algorithms, Debugging & Code reviews.\n"
            "- **Academic & Viva Prep**: Detailed breakdowns of concepts, CS curricula, and exam questions.\n"
            "- **Idea Generation & Writing**: Creative brainstorming, project architectures, and learning roadmaps.\n"
            "- **Voice Mode**: Speak into your microphone and hear responses read aloud in real-time.\n\n"
            "How can I help you today? Try one of the quick suggestions or type any question below!"
        )

    else:
        return tip + (
            f"### SmartChat AI Response\n\n"
            f"Thank you for your question regarding: **{user_message}**.\n\n"
            f"1. **Core Concept**: Processing your query with the active AI model.\n"
            f"2. **Real-Time Generation**: With Groq Llama 3.3 connected, SmartChat AI delivers instantaneous answers with complete code snippets, structured analysis, and actionable takeaways.\n\n"
            f"Feel free to ask questions about **Python, DBMS, Machine Learning, Data Structures, Web Development, or Project Ideas**!"
        )


def generate_ai_response(user_message, history=None, requested_model=None, persona="standard"):
    """
    Route message to Groq Llama 3.3, active cloud provider,
    or the local NLP model engine.
    """
    active_provider, default_model = get_active_provider()

    req_lower = requested_model.lower().strip() if requested_model else ""

    # If client explicitly selected Local NLP, use local engine
    if req_lower in ("local-nlp", "smartchat-nlp", "local"):
        logger.info("Executing SmartChat Local NLP Model Engine...")
        reply = nlp_engine.generate_response(user_message)
        return reply, "SmartChat-NLP (Local)"

    # Determine provider
    provider_to_use = None
    if "groq" in req_lower:
        provider_to_use = "Groq"
    elif "gemini" in req_lower:
        provider_to_use = "Gemini"
    elif "openai" in req_lower:
        provider_to_use = "OpenAI"
    elif "openrouter" in req_lower:
        provider_to_use = "OpenRouter"
    else:
        # Default to configured active provider (Groq)
        provider_to_use = active_provider

    logger.info(f"Routing request to provider: {provider_to_use} (Persona: {persona})")

    if provider_to_use == "Groq":
        try:
            groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY).strip()
            groq_model = os.getenv("GROQ_MODEL", GROQ_MODEL).strip()
            return call_openai_compatible_api(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_key,
                groq_model,
                user_message,
                history,
                persona
            ), "Groq (GPT-OSS-120B / Cloud)"
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}. Trying Gemini / Local Knowledge Engine...")
            gemini_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY).strip()
            if gemini_key and not gemini_key.startswith("your_"):
                try:
                    return call_gemini_api(user_message, history), "Gemini (Fallback)"
                except Exception:
                    pass
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Knowledge Grounded)"

    elif provider_to_use == "Gemini":
        try:
            return call_gemini_api(user_message, history), "Gemini (Cloud)"
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to Groq / Local NLP engine.")
            groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY).strip()
            if groq_key and not groq_key.startswith("your_"):
                try:
                    return call_openai_compatible_api(
                        "https://api.groq.com/openai/v1/chat/completions",
                        groq_key,
                        GROQ_MODEL,
                        user_message,
                        history,
                        persona
                    ), "Groq (GPT-OSS-120B / Fallback)"
                except Exception:
                    pass
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Knowledge Grounded)"

    elif provider_to_use == "OpenAI":
        try:
            return call_openai_compatible_api(
                "https://api.openai.com/v1/chat/completions",
                OPENAI_API_KEY,
                OPENAI_MODEL,
                user_message,
                history,
                persona
            ), "OpenAI (Cloud)"
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Knowledge Grounded)"

    elif provider_to_use == "OpenRouter":
        try:
            return call_openai_compatible_api(
                "https://openrouter.ai/api/v1/chat/completions",
                OPENROUTER_API_KEY,
                OPENROUTER_MODEL,
                user_message,
                history,
                persona
            ), "OpenRouter (Cloud)"
        except Exception as e:
            logger.warning(f"OpenRouter API call failed: {e}. Falling back to Local NLP engine.")
            return nlp_engine.generate_response(user_message), "SmartChat-NLP (Knowledge Grounded)"

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
        "model": "groq" | "gemini" | "openai" | "local-nlp",
        "persona": "standard" | "coder" | "academic" | "concise"
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
    persona = data.get("persona", "standard")

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
        reply, used_provider = generate_ai_response(user_message, history, requested_model, persona)
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



@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    """Submit user feedback / rating for AI response improvement."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    prompt = data.get("prompt", "").strip()
    response_text = data.get("response", "").strip()
    rating = data.get("rating", "").strip() # 'helpful', 'unhelpful', or 'regenerated'
    user_id = session.get("user_id")

    if not rating:
        return jsonify({"status": "error", "error": "Rating is required."}), 400

    database.save_response_feedback(user_id, prompt, response_text, rating)
    return jsonify({
        "status": "success",
        "message": "Thank you! Your feedback helps improve SmartChat AI responses."
    }), 200


@app.route("/api/clear", methods=["POST"])
def clear_session():
    """Endpoint for clearing conversation state confirmation."""
    return jsonify({
        "status": "success",
        "message": "Chat session cleared successfully."
    }), 200


# ==========================================
# Authentication & User Management Routes
# ==========================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user with email and password."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not name:
        return jsonify({"status": "error", "error": "Please enter your full name."}), 400
    if not email or "@" not in email:
        return jsonify({"status": "error", "error": "Please enter a valid email address."}), 400
    if not password or len(password) < 6:
        return jsonify({"status": "error", "error": "Password must be at least 6 characters long."}), 400

    try:
        user = database.create_user(name=name, email=email, password=password, provider="email")
        session["user_id"] = user["id"]
        return jsonify({
            "status": "success",
            "message": "Account created successfully.",
            "user": user
        }), 201
    except ValueError as e:
        return jsonify({"status": "error", "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /api/auth/register: {e}")
        return jsonify({"status": "error", "error": "Failed to create account. Please try again."}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Sign in an existing user with email and password."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"status": "error", "error": "Please enter both email and password."}), 400

    user, error = database.verify_user_login(email, password)
    if error:
        return jsonify({"status": "error", "error": error}), 401

    session["user_id"] = user["id"]
    return jsonify({
        "status": "success",
        "message": f"Welcome back, {user['name']}!",
        "user": user
    }), 200


@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    """Sign in or register with Google credentials."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    email = data.get("email", "").strip()
    name = data.get("name", "").strip()
    avatar_url = data.get("avatar_url", "").strip()

    if not email or "@" not in email:
        return jsonify({"status": "error", "error": "Valid Google email is required."}), 400

    try:
        user = database.handle_google_user(email=email, name=name or "Google User", avatar_url=avatar_url)
        session["user_id"] = user["id"]
        return jsonify({
            "status": "success",
            "message": f"Signed in as {user['name']}",
            "user": user
        }), 200
    except Exception as e:
        logger.error(f"Error in /api/auth/google: {e}")
        return jsonify({"status": "error", "error": "Google sign-in failed. Please try again."}), 500


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Request a password reset code for an email."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    email = data.get("email", "").strip()

    if not email or "@" not in email:
        return jsonify({"status": "error", "error": "Please enter a valid email address."}), 400

    code, error = database.create_password_reset_code(email)
    if error:
        return jsonify({"status": "error", "error": error}), 404

    # In production this would send an email. For local/demo viva purposes, we return the reset code so testing is instant!
    logger.info(f"Password reset code for {email}: {code}")
    return jsonify({
        "status": "success",
        "message": f"Password reset verification code generated for {email}.",
        "reset_code": code,
        "expires_in_minutes": 15
    }), 200


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password using 6-digit verification code."""
    if not request.is_json:
        return jsonify({"status": "error", "error": "JSON payload expected."}), 400

    data = request.get_json()
    email = data.get("email", "").strip()
    code = data.get("code", "").strip()
    new_password = data.get("new_password", "").strip()

    if not email or not code or not new_password:
        return jsonify({"status": "error", "error": "Email, verification code, and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"status": "error", "error": "New password must be at least 6 characters long."}), 400

    success, error = database.reset_user_password(email, code, new_password)
    if not success:
        return jsonify({"status": "error", "error": error}), 400

    return jsonify({
        "status": "success",
        "message": "Password has been successfully reset! You can now log in with your new password."
    }), 200


@app.route("/api/auth/me", methods=["GET"])
def current_user():
    """Get profile of currently logged-in user."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "success", "authenticated": False, "user": None}), 200

    user = database.get_user_by_id(user_id)
    if not user:
        session.pop("user_id", None)
        return jsonify({"status": "success", "authenticated": False, "user": None}), 200

    return jsonify({
        "status": "success",
        "authenticated": True,
        "user": user
    }), 200


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Sign out current user and clear session."""
    session.pop("user_id", None)
    return jsonify({
        "status": "success",
        "message": "Logged out successfully."
    }), 200


@app.route("/api/auth/sync-history", methods=["GET", "POST"])
def sync_history():
    """Sync user chat sessions with cloud database."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "error", "error": "Authentication required."}), 401

    if request.method == "POST":
        data = request.get_json() or {}
        sessions_json = json.dumps(data.get("sessions", []))
        database.save_user_sessions(user_id, sessions_json)
        return jsonify({"status": "success", "message": "History synced successfully."}), 200
    else:
        history_str = database.get_user_sessions(user_id)
        sessions_data = json.loads(history_str) if history_str else []
        return jsonify({"status": "success", "sessions": sessions_data}), 200



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
