# SmartChat AI — End-to-End AI Chatbot Web Application

An intelligent, modern, and responsive full-stack AI Chatbot Web Application designed for engineering students, computer science learning, programming assistance, problem solving, and viva demonstrations.

Built with **Python (Flask)**, **scikit-learn**, **HTML5**, **Modern Vanilla CSS**, and **JavaScript**, featuring a custom **End-to-End Local NLP Machine Learning Pipeline** and multi-model cloud integrations (**Google Gemini**, **Groq**, **OpenAI**).

---

## 🌟 Overview

**SmartChat AI** provides a clean, conversational user interface modeled after cutting-edge AI assistants. Whether you need an explanation of Machine Learning algorithms, debugging tips for Python code, DBMS normalization breakdowns, or final-year project ideas, SmartChat AI delivers structured, accurate, and syntax-highlighted answers.

---

## 🚀 Key Features

### 1. End-to-End Machine Learning & Local NLP Engine
- **Custom NLP Pipeline**: Vectorizes text using TF-IDF N-grams `(1, 2)` and classifies user intent via a Multi-Class Logistic Regression & Cosine Similarity matcher.
- **100% Offline Capability**: Runs instantly without requiring any paid third-party API keys or internet connection.
- **Standalone Training CLI (`train_model.py`)**: Train the model, inspect accuracy, evaluate cross-validation scores, and serialize weights to `smartchat_model.pkl`.
- **Live Diagnostics Modal**: View active pipeline architecture, vocabulary size (314+ tokens), intent classes, and training metadata directly in the web UI.

### 2. Multi-Model Support & Dynamic Switching
- Switch seamlessly between:
  - 🧠 **SmartChat Local NLP Engine** (On-device, instant, zero latency)
  - ⚡ **Google Gemini 2.5 Flash** (Live Cloud Generative AI)
  - 🚀 **Groq Llama 3.3** (High-speed Cloud LLM)
  - 🌐 **OpenAI GPT-4o-mini** (Cloud LLM)

### 3. Intuitive Chat Interface
- **Distinct Message Bubbles**: Clean visual separation between user inquiries and AI responses.
- **Dynamic Markdown Rendering**: Supports headings, bold/italic formatting, bulleted/numbered lists, quotes, and markdown tables.
- **Code Block Highlighting & One-Click Copy**: Code snippets are displayed with language badges and instant copy buttons.
- **Typing Indicator**: Smooth, animated loading dots indicating active AI reasoning.
- **Auto-Expanding Input Area**: Auto-resizing textarea with `Enter` to send and `Shift + Enter` for new lines.

### 4. Conversation & Session Management
- **Persistent Chat History**: Stores past conversations in `localStorage` across browser refreshes.
- **New Chat & Clear Options**: Start a new chat session or clear history anytime with modal confirmation.
- **Session Switching & Deletion**: Switch between previous conversations in the sidebar or delete individual chats.

### 5. Modern Design System & Themes
- **Dark & Light Mode**: Complete, instant dual-theme toggling using custom CSS variables, persisted across visits.
- **Fully Responsive**: Flawlessly adapts to Desktop (1920px+), Laptops (1024px), Tablets (768px), and Mobile devices (360px–480px).
- **Collapsible Drawer Navigation**: Smooth mobile sidebar drawer with backdrop overlay.

### 6. Bonus Feature: Voice Input
- **Speech-to-Text**: Built-in voice input using the Web Speech API with real-time audio recording pulse animation.

---

## 🛠️ Technologies Used

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.10+ / Flask 3.x |
| **Machine Learning & NLP** | `scikit-learn`, `numpy`, TF-IDF Vectorizer, Multi-Class Classifier |
| **Environment Management** | `python-dotenv` |
| **HTTP Client** | `requests` |
| **Frontend Structure** | Semantic HTML5 |
| **Frontend Styling** | Vanilla CSS3 (CSS Variables, Flexbox, Grid, Media Queries) |
| **Client Scripting** | Vanilla JavaScript (ES6+, Fetch API, LocalStorage, Web Speech API) |
| **Typography** | Google Fonts (*Plus Jakarta Sans*, *JetBrains Mono*) |

---

## 📁 Project Structure

```text
smartchat-ai/
│
├── app.py                     # Flask application server & AI routing logic
├── nlp_model.py               # Local NLP pipeline class (TF-IDF & Classifier)
├── train_model.py             # Standalone model training & evaluation script
├── dataset.json               # Structured domain dataset & intent definitions
├── smartchat_model.pkl        # Serialized trained model cache
├── requirements.txt           # Python package dependencies
├── .env                       # Local environment variables (API keys & secret key)
├── .env.example               # Template for environment variables
├── .gitignore                 # Files excluded from version control
├── README.md                  # Complete project documentation
│
├── templates/
│   └── index.html             # Main semantic HTML5 interface template
│
└── static/
    ├── css/
    │   └── style.css          # Design system, CSS variables & responsive layout
    ├── js/
    │   └── script.js          # Chat state, markdown parser, history & voice input
    └── images/
        └── favicon.svg        # Modern vector SVG favicon
```

---

## 📦 Installation & Setup

### 1. Prerequisites
- Python 3.9 or higher installed on your computer.

### 2. Navigate to the Project Directory
```bash
cd "smartchat-ai"
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
*(On Windows systems: `py -m pip install -r requirements.txt`)*

---

## 🧠 Training the Local NLP Model (Optional)

You can train and evaluate the local NLP model anytime using the training CLI:
```bash
py train_model.py
```
**Sample Output:**
```text
=======================================================
  🧠 SMARTCHAT AI — NLP MODEL TRAINING PIPELINE
=======================================================
1. Loading dataset from 'dataset.json'...
   ✓ Loaded 14 Intent Categories
   ✓ Loaded 105 Training Patterns
2. Extracting Features using TF-IDF (Unigrams + Bigrams)...
   ✓ Vocabulary Size: 314 unique n-gram features
3. Training Multi-Class Intent Classifier...
   ✓ Training Accuracy: 100.00%
   ✓ Stratified CV Score (3-Fold): 55.24% (+/- 7.50%)
4. Serializing Model Weights...
   ✓ Model serialized to 'smartchat_model.pkl' in 1.25s
```

---

## 🔑 Environment Variables Configuration

Copy the sample environment file to create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` in any text editor and optionally add a cloud AI key:

```env
# Flask Settings
FLASK_APP=app.py
FLASK_DEBUG=1
SECRET_KEY=smartchat-ai-super-secret-key-2026

# Google Gemini API (Optional - Free key available at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Groq API (Optional): https://console.groq.com/
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# OpenAI API (Optional): https://platform.openai.com/
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

---

## 🖥️ How to Run the Application

Start the Flask server:
```bash
py app.py
```
*(or `python app.py`)*

Once started, open your web browser and navigate to:
👉 **`http://127.0.0.1:5000`** or **`http://localhost:5000`**

---

## 🧪 Testing and Verification

- **Homepage & Welcome**: Visit `http://127.0.0.1:5000` to view the welcome hero and suggestion cards.
- **Model Selector**: Switch between Local NLP, Gemini, Groq, and OpenAI from the header dropdown.
- **Model Diagnostics**: Click the Info `(i)` button in the header to view model architecture and vocabulary metrics.
- **Chat Interaction**: Click any suggestion card (e.g. *"Explain Machine Learning"*) or type a question.
- **Theme Toggle**: Click the Sun/Moon icon in the top header to switch between Dark and Light themes.
- **Voice Input**: Click the microphone icon in the input area and speak your prompt.
- **New Chat**: Click `+ New Chat` in the sidebar or top header to start a fresh conversation.

---

## 🎓 College Project Information

- **Project Title**: SmartChat AI — AI Chatbot Web Application
- **Domain**: Machine Learning / Natural Language Processing / Full-Stack Web Development
- **Status**: Production Ready & Fully Evaluated
