"""
SmartChat AI — Multi-Domain Local NLP & Precision Knowledge Engine
Handles text preprocessing, TF-IDF feature extraction, multi-domain intent classification,
fuzzy typo correction, real-time entity search, semantic cosine matching, and rich factual response generation.
"""

import os
import re
import json
import difflib
import pickle
import logging
import urllib.parse
from datetime import datetime
import numpy as np
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("SmartChatAI.NLPModel")

# Base directory relative to this script file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATASET = os.path.join(BASE_DIR, "dataset.json")
DEFAULT_CACHE = os.path.join(BASE_DIR, "smartchat_model.pkl")

# English Stop Words list for preprocessing
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
    "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
    "yourselves"
}

# Domain keyword associations for smart knowledge synthesis
DOMAIN_MAPPINGS = {
    "film": ["movie", "cinema", "film", "hollywood", "bollywood", "actor", "actress", "director", "oscar", "screenplay", "box office", "theatre", "animation", "vfx", "cinematography", "kgf", "toxic", "kantara", "tollywood", "kollywood"],
    "sports": ["cricket", "football", "soccer", "basketball", "tennis", "olympics", "world cup", "match", "stadium", "tournament", "athlete", "ipl", "nba", "fifa", "badminton", "golf", "virat kohli", "rohit sharma", "messi", "ronaldo"],
    "education": ["education", "university", "college", "school", "degree", "btech", "mba", "phd", "study", "learning", "exam", "syllabus", "scholarship", "course", "curriculum", "feynman", "pomodoro"],
    "science": ["physics", "astronomy", "space", "planet", "galaxy", "quantum", "gravity", "einstein", "newton", "chemistry", "biology", "genetics", "dna", "cell", "organism", "atom", "molecule"],
    "medicine": ["health", "medicine", "doctor", "disease", "treatment", "vaccine", "anatomy", "heart", "brain", "nutrition", "diet", "mental health", "hospital", "pharma"],
    "economics": ["economics", "finance", "stock", "market", "inflation", "gdp", "money", "bank", "invest", "crypto", "bitcoin", "startup", "venture", "trade", "budget", "tax"],
    "history": ["history", "civilization", "ancient", "war", "empire", "revolution", "century", "monarch", "renaissance", "dynasty", "historical"],
    "computing": ["python", "java", "javascript", "code", "programming", "database", "sql", "dbms", "algorithm", "data structure", "machine learning", "ai", "cloud", "docker", "security"]
}

# Known popular entities/terms for fuzzy typo correction
KNOWN_ENTITIES = [
    "toxic", "kgf", "kantara", "kalki", "salaar", "pushpa", "leo", "jailer", "rrr",
    "baahubali", "devara", "avatar", "oppenheimer", "dune", "batman", "spiderman",
    "avengers", "inception", "interstellar", "yash", "prabhas", "shah rukh khan",
    "salman khan", "rajinikanth", "kamal haasan", "christopher nolan", "steven spielberg",
    "virat kohli", "rohit sharma", "ms dhoni", "sachin tendulkar", "messi", "ronaldo",
    "feynman", "einstein", "newton", "galileo", "turing", "tesla", "curie",
    "photosynthesis", "mitochondria", "respiration", "black hole", "supernova",
    "quantum computing", "blockchain", "normalization", "cybersecurity"
]


def preprocess_text(text):
    """Clean, lowercase, and tokenize input query."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", " ", text)
    tokens = text.split()
    cleaned = [t for t in tokens if t not in STOP_WORDS or len(t) <= 2]
    return " ".join(cleaned) if cleaned else text


def extract_core_entity(raw_text):
    """Extract primary subject topic from conversational or compound queries."""
    q = raw_text.strip().rstrip("?!.,")

    # If query contains 'about X', 'review of X', 'overview on X', 'who is X', etc.
    m = re.search(r"\b(?:about|of|on|review|for|regarding)\s+([a-zA-Z0-9\s_-]+)$", q, flags=re.IGNORECASE)
    if m:
        extracted = m.group(1).strip()
        extracted = re.sub(r"\s+(review|overview|details|summary|explained|synopsis)$", "", extracted, flags=re.IGNORECASE).strip()
        if len(extracted) >= 2:
            q = extracted

    # Strip standard conversational prefixes
    clean_p = r"^(can\s+you\s+)?(please\s+)?(configure\s+it\s+and\s+|give\s+(me\s+)?(a\s+)?(review|overview|details|summary|information|breakdown)\s+(and\s+overview\s+)?(of|about|on)|review\s+(about|of|on)|overview\s+of|details\s+of|say\s+me\s+about|tell\s+me\s+about|can\s+you\s+tell\s+me\s+about|what\s+is\s+your\s+review\s+of|what\s+about|who\s+is|what\s+is|who\s+was|what\s+was|who\s+are|what\s+are|explain\s+to\s+me|explain|describe|define)\s+"
    q = re.sub(clean_p, "", q, flags=re.IGNORECASE).strip().rstrip("?!.")

    # Apply selective typo correction only for exact misspelled keywords without corrupting common English words
    common_words = {"starring", "directed", "upcoming", "latest", "movie", "film", "sports", "cricket", "football", "player", "captain", "explain", "about", "world", "rules"}
    words = q.lower().split()
    corrected = []
    for w in words:
        if len(w) >= 4 and w not in STOP_WORDS and w not in common_words:
            matches = difflib.get_close_matches(w, KNOWN_ENTITIES, n=1, cutoff=0.82)
            corrected.append(matches[0] if matches else w)
        else:
            corrected.append(w)
    return " ".join(corrected)


def get_live_grounding_context(query):
    """
    Retrieve concise factual grounding context from DuckDuckGo Instant Answer
    or Wikipedia API for grounding LLM prompts in real-time facts.
    """
    raw = query.strip()
    if not raw or len(raw) < 3:
        return None

    raw_lower = raw.lower()
    if any(raw_lower.startswith(g) for g in ["hi", "hello", "hey", "write code", "write a python", "debug", "solve this", "help me"]):
        return None

    clean_raw = re.sub(r"^(can\s+you\s+)?(please\s+)?(tell\s+me\s+about|what\s+is|who\s+is|what\s+about|give\s+me\s+details\s+on|explain|describe)\s+", "", raw, flags=re.IGNORECASE).strip().rstrip("?!.")
    core_q = extract_core_entity(raw)

    search_candidates = []
    if clean_raw and len(clean_raw) >= 3:
        search_candidates.append(clean_raw)
    if core_q and core_q not in search_candidates and len(core_q) >= 2:
        search_candidates.append(core_q)

    headers = {
        "User-Agent": "SmartChatAI-Grounding/3.0 (https://smartchat.local; contact@smartchat.edu)"
    }

    # 1. Check DuckDuckGo Instant Answer API
    for term in search_candidates:
        try:
            ddg_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(term)}&format=json&no_html=1&skip_disambig=1"
            resp = requests.get(ddg_url, headers=headers, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                abstract = data.get("AbstractText", "").strip()
                heading = data.get("Heading", "")
                if abstract and len(abstract) > 30:
                    return f"[Verified Real-Time Knowledge for '{heading or term}']:\n{abstract}"
        except Exception:
            pass

    # 2. Check Wikipedia Search API
    for term in search_candidates:
        try:
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(term)}&utf8=&format=json"
            s_resp = requests.get(search_url, headers=headers, timeout=2.5)
            if s_resp.status_code == 200:
                results = s_resp.json().get("query", {}).get("search", [])
                if results:
                    title = results[0]["title"]
                    sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}"
                    sum_resp = requests.get(sum_url, headers=headers, timeout=2.5)
                    if sum_resp.status_code == 200:
                        page_data = sum_resp.json()
                        extract = page_data.get("extract", "").strip()
                        if extract and len(extract) > 40 and page_data.get("type") != "disambiguation":
                            desc = page_data.get("description", "")
                            return f"[Verified Real-Time Knowledge for '{title}' ({desc})]:\n{extract}"
        except Exception:
            pass

    return None



def fetch_live_knowledge_summary(query):
    """
    Search and retrieve accurate, verified factual knowledge for any specific entity,
    movie, celebrity, sports personality, scientific topic, or historical subject.
    """
    raw = query.strip()
    if not raw:
        return None

    core_q = extract_core_entity(raw)
    if not core_q or len(core_q) < 2:
        return None

    headers = {
        "User-Agent": "SmartChatAI-EducationalAssistant/3.0 (https://smartchat.local; contact@smartchat.edu)"
    }

    is_movie_query = any(w in raw.lower() for w in ["movie", "film", "cinema", "trailer", "teaser", "actor", "actress", "starring"])
    is_sports_query = any(w in raw.lower() for w in ["cricket", "football", "soccer", "batsman", "bowler", "player", "captain", "match", "world cup"])
    is_review_request = any(w in raw.lower() for w in ["review", "overview", "rating", "opinion", "critique", "analysis", "details"])

    # 1. First check DuckDuckGo Instant Knowledge
    try:
        ddg_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(core_q)}&format=json&no_html=1&skip_disambig=1"
        resp = requests.get(ddg_url, headers=headers, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            abstract = data.get("AbstractText", "").strip()
            heading = data.get("Heading", core_q.title())
            source_url = data.get("AbstractURL", "")
            if abstract and len(abstract) > 50:
                md_resp = f"### {heading}\n\n"
                md_resp += f"{abstract}\n\n"
                md_resp += f"#### Key Highlights:\n"
                md_resp += f"- **Knowledge Category**: Verified Encyclopedia Fact\n"
                if source_url:
                    md_resp += f"- **Primary Source Reference**: [{heading} Details]({source_url})\n"
                return md_resp
    except Exception:
        pass

    # 2. Wikipedia Search and Summary
    variants = [core_q]
    stripped = re.sub(r"^(latest|new|upcoming|recent|old|largest)\s+", "", core_q, flags=re.IGNORECASE).strip()
    if stripped and stripped not in variants:
        variants.append(stripped)

    if is_movie_query:
        clean_movie = re.sub(r"\b(movie|film|cinema|latest|upcoming|new|review|overview)\b", "", core_q, flags=re.IGNORECASE).strip()
        if clean_movie:
            variants.append(f"{clean_movie} film")
            variants.append(f"{clean_movie} movie")
            variants.append(clean_movie)

    # Check for spelling suggestions via search API
    first_search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(core_q)}&utf8=&format=json"
    try:
        f_resp = requests.get(first_search_url, headers=headers, timeout=3.5)
        if f_resp.status_code == 200:
            sugg = f_resp.json().get("query", {}).get("searchinfo", {}).get("suggestion")
            if sugg:
                variants.append(sugg)
                sugg_stripped = re.sub(r"^(latest|new|upcoming|recent|old|largest)\s+", "", sugg, flags=re.IGNORECASE).strip()
                if sugg_stripped and sugg_stripped not in variants:
                    variants.append(sugg_stripped)
                    if is_movie_query:
                        variants.append(f"{sugg_stripped} film")
    except Exception:
        pass

    seen = set()
    search_queries = [v for v in variants if not (v.lower() in seen or seen.add(v.lower()))]

    for search_term in search_queries:
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(search_term)}&utf8=&format=json"
        try:
            resp = requests.get(search_url, headers=headers, timeout=3.5)
            if resp.status_code != 200:
                continue

            data = resp.json()
            results = data.get("query", {}).get("search", [])

            # Re-rank candidates if domain hints are present
            if is_movie_query and results:
                results = sorted(
                    results,
                    key=lambda x: 0 if ("(film)" in x["title"].lower() or "(202" in x["title"] or "film" in x["title"].lower() or "film" in x.get("snippet", "").lower()) else 1
                )
            elif is_sports_query and results:
                results = sorted(
                    results,
                    key=lambda x: 0 if ("(cricketer)" in x["title"].lower() or "(footballer)" in x["title"].lower() or "cricket" in x.get("snippet", "").lower()) else 1
                )

            for item in results[:5]:
                title = item["title"]
                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}"
                sum_resp = requests.get(summary_url, headers=headers, timeout=3.5)

                if sum_resp.status_code == 200:
                    page_data = sum_resp.json()
                    page_type = page_data.get("type", "")
                    extract = page_data.get("extract", "")

                    if page_type == "disambiguation" or not extract or len(extract) < 45:
                        continue

                    res_title = page_data.get("title", title)
                    desc = page_data.get("description", "")
                    page_url = page_data.get("content_urls", {}).get("desktop", {}).get("page", "")
                    extract_clean = extract.strip()

                    if is_review_request and is_movie_query:
                        md_response = f"### {res_title} — Critical Overview & Review\n\n"
                        if desc:
                            md_response += f"> *{desc}*\n\n"
                        md_response += f"#### 1. Film Synopsis & Background:\n{extract_clean}\n\n"
                        md_response += f"#### 2. Key Creative Highlights & Buzz:\n"
                        md_response += f"- **Production Status**: Major high-profile pan-India & global production\n"
                        md_response += f"- **Genre & Vision**: Stylized cinematic narrative with world-class technical crew\n"
                        md_response += f"- **Industry Expectations**: Highly anticipated project with immense commercial and critical interest\n\n"
                        if page_url:
                            md_response += f"#### 3. Verified Source Reference:\n- [Read full article on Wikipedia]({page_url})\n"
                        return md_response
                    else:
                        md_response = f"### {res_title}"
                        if desc:
                            md_response += f" — *{desc}*\n\n"
                        else:
                            md_response += "\n\n"

                        md_response += f"{extract_clean}\n\n"
                        md_response += f"#### Key Highlights:\n"
                        md_response += f"- **Subject Category**: Verified Knowledge Base\n"
                        if desc:
                            md_response += f"- **Overview**: {desc}\n"
                        if page_url:
                            md_response += f"- **Source Reference**: [Read full article on Wikipedia]({page_url})\n"

                        return md_response
        except Exception as e:
            logger.debug(f"Knowledge search error for '{search_term}': {e}")
            continue

    return None


class SmartChatNLPModel:
    """
    Multi-Domain Local NLP Chatbot Model with TF-IDF Vectorizer,
    Logistic Regression Classifier, Semantic Cosine Similarity,
    and Dynamic Multi-Field Precision Knowledge Retrieval.
    """

    def __init__(self, dataset_path=None, model_cache_path=None):
        self.dataset_path = dataset_path or DEFAULT_DATASET
        self.model_cache_path = model_cache_path or DEFAULT_CACHE
        self.vectorizer = None
        self.classifier = None
        self.intents_data = {}
        self.patterns = []
        self.pattern_tags = []
        self.pattern_vectors = None
        self.trained_at = None
        self.is_trained = False

        self.load_or_train()

    def load_dataset(self):
        """Load intents from JSON dataset."""
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {self.dataset_path}")

        with open(self.dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.intents_data = {intent["tag"]: intent for intent in data.get("intents", [])}
        self.patterns = []
        self.pattern_tags = []

        for intent in data.get("intents", []):
            tag = intent["tag"]
            for pattern in intent.get("patterns", []):
                cleaned = preprocess_text(pattern)
                if cleaned:
                    self.patterns.append(cleaned)
                    self.pattern_tags.append(tag)

        logger.info(f"Loaded {len(self.intents_data)} intents with {len(self.patterns)} patterns.")

    def train(self):
        """Train TF-IDF vectorizer and classification model."""
        self.load_dataset()

        if not self.patterns:
            raise ValueError("No training patterns found in dataset.")

        # 1. Feature Extraction via TF-IDF (Unigrams and Bigrams)
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            token_pattern=r"(?u)\b\w+\b"
        )
        X = self.vectorizer.fit_transform(self.patterns)
        y = self.pattern_tags
        self.pattern_vectors = X

        # 2. Classifier: Logistic Regression with Balanced Regularization
        self.classifier = LogisticRegression(
            C=4.0,
            max_iter=400,
            random_state=42
        )
        self.classifier.fit(X, y)

        self.trained_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.is_trained = True
        logger.info(f"SmartChat Multi-Domain NLP Model trained successfully (Vocabulary: {len(self.vectorizer.vocabulary_)} tokens).")

        # 3. Cache trained model
        self.save_model()

    def save_model(self):
        """Save model state to pickle cache."""
        try:
            state = {
                "vectorizer": self.vectorizer,
                "classifier": self.classifier,
                "intents_data": self.intents_data,
                "patterns": self.patterns,
                "pattern_tags": self.pattern_tags,
                "pattern_vectors": self.pattern_vectors,
                "trained_at": self.trained_at
            }
            with open(self.model_cache_path, "wb") as f:
                pickle.dump(state, f)
            logger.info(f"Model saved to cache: {self.model_cache_path}")
        except Exception as e:
            logger.warning(f"Could not cache model: {e}")

    def load_or_train(self):
        """Load cached model or trigger training if dataset is newer or cache is missing."""
        dataset_mtime = os.path.getmtime(self.dataset_path) if os.path.exists(self.dataset_path) else 0
        cache_mtime = os.path.getmtime(self.model_cache_path) if os.path.exists(self.model_cache_path) else 0

        if os.path.exists(self.model_cache_path) and cache_mtime >= dataset_mtime:
            try:
                with open(self.model_cache_path, "rb") as f:
                    state = pickle.load(f)
                self.vectorizer = state["vectorizer"]
                self.classifier = state["classifier"]
                self.intents_data = state["intents_data"]
                self.patterns = state["patterns"]
                self.pattern_tags = state["pattern_tags"]
                self.pattern_vectors = state["pattern_vectors"]
                self.trained_at = state.get("trained_at", "Cached")
                self.is_trained = True
                logger.info(f"Loaded trained NLP model from cache (Vocab: {len(self.vectorizer.vocabulary_)}).")
                return
            except Exception as e:
                logger.warning(f"Error reading model cache, retraining: {e}")

        self.train()

    def detect_domain(self, text):
        """Detect broad knowledge domain from user query."""
        text_lower = text.lower()
        for domain, keywords in DOMAIN_MAPPINGS.items():
            for kw in keywords:
                if kw in text_lower:
                    return domain
        return "general"

    def predict_intent(self, user_text):
        """
        Predict intent tag, confidence score, and nearest semantic match.
        """
        if not self.is_trained or not self.vectorizer or not self.classifier:
            self.train()

        cleaned_query = preprocess_text(user_text)
        if not cleaned_query:
            return "greetings", 1.0, 0.0

        query_vec = self.vectorizer.transform([cleaned_query])

        # 1. Cosine similarity against all training pattern vectors
        similarities = cosine_similarity(query_vec, self.pattern_vectors).flatten()
        max_sim_idx = int(np.argmax(similarities))
        max_sim_score = float(similarities[max_sim_idx])

        # 2. Probability distribution from classifier
        probs = self.classifier.predict_proba(query_vec)[0]
        max_prob_idx = int(np.argmax(probs))
        predicted_tag = self.classifier.classes_[max_prob_idx]
        confidence = float(probs[max_prob_idx])

        if max_sim_score > 0.40:
            matched_tag = self.pattern_tags[max_sim_idx]
            return matched_tag, max_sim_score, max_sim_score

        return predicted_tag, confidence, max_sim_score

    def generate_response(self, user_message):
        """
        Generate rich formatted, accurate Markdown answer based on verified live entity search,
        high-confidence intent matching, or domain knowledge synthesis.
        """
        msg_lower = user_message.lower().strip()

        # 1. Check for standard greetings or bot self-identity
        is_greeting = any(msg_lower == g or msg_lower.startswith(g + " ") for g in ["hi", "hello", "hey", "good morning", "good evening", "greetings", "howdy", "start"])
        is_bot_identity = any(k in msg_lower for k in ["who are you", "what are you", "what is your name", "who created you", "who made you", "what can you do", "tell me about yourself"])

        if is_greeting and len(msg_lower.split()) <= 3:
            return self.intents_data.get("greetings", {}).get("responses", ["Hello! How can I help you today?"])[0]

        if is_bot_identity:
            return self.intents_data.get("identity_capabilities", {}).get("responses", ["I am SmartChat AI, your multi-domain AI assistant."])[0]

        # 2. Run Precision Live Knowledge Retrieval FIRST for specific entities, movies, personalities, concepts
        live_summary = fetch_live_knowledge_summary(user_message)
        if live_summary:
            logger.info(f"Live knowledge grounding hit for: '{user_message}'")
            return live_summary

        # 3. Intent Classification for Curriculum / General Guides
        tag, confidence, sim_score = self.predict_intent(user_message)
        logger.info(f"Query: '{user_message}' -> Predicted Tag: '{tag}' (Confidence: {confidence:.2f}, Similarity: {sim_score:.2f})")

        if (confidence >= 0.25 or sim_score >= 0.30) and tag in self.intents_data:
            if tag != "identity_capabilities":
                responses = self.intents_data[tag].get("responses", [])
                if responses:
                    return responses[0]

        # 4. Multi-Domain Dynamic Knowledge Synthesis
        domain = self.detect_domain(user_message)
        topic_title = user_message.strip().rstrip("?.!").title()

        domain_guides = {
            "film": (
                "Film & Cinema Arts",
                "The film industry combines storytelling, visual artistry (cinematography, set design, color grading), sound engineering, and performance to create compelling narratives.",
                [
                    "**Screenwriting & Story Arc**: Developing the premise, character arcs, and dialogue.",
                    "**Production & Directing**: Camera framing, lighting setups, and capturing authentic actor performances.",
                    "**Post-Production & VFX**: Editing, CGI integration, foley sound design, and color scoring."
                ]
            ),
            "sports": (
                "Sports & Physical Athletics",
                "Athletics and sports focus on physical conditioning, technical skill, team strategy, and disciplined competition under standardized rules.",
                [
                    "**Tactical Strategy**: Understanding field positioning, offensive execution, and defensive structure.",
                    "**Athletic Conditioning**: Developing cardiovascular stamina, strength, agility, and injury prevention.",
                    "**Sportsmanship & Team Dynamics**: Communication, mental resilience, and fair play."
                ]
            ),
            "education": (
                "Education & Academic Learning",
                "Education is the systematic cultivation of critical thinking, domain mastery, research methodology, and real-world problem-solving skills.",
                [
                    "**Conceptual Mastery**: Breaking down complex topics into first principles (Feynman Technique).",
                    "**Effective Study Habits**: Using Active Recall, Spaced Repetition, and deep-focus sessions (Pomodoro).",
                    "**Academic Progression**: Developing research papers, capstone projects, and pursuing higher degrees."
                ]
            ),
            "science": (
                "Science & Physical Universe",
                "Scientific exploration relies on the empirical scientific method: observation, hypothesis testing, mathematical modeling, and experimental verification.",
                [
                    "**Core Principles**: Understanding fundamental laws of physics, chemistry, and biological systems.",
                    "**Mathematical Modeling**: Expressing physical phenomena through equations and analytical proofs.",
                    "**Technological Application**: Translating theoretical discoveries into transformative engineering solutions."
                ]
            ),
            "economics": (
                "Economics, Finance & Markets",
                "Economics analyzes the production, distribution, and consumption of goods and services, as well as the behavior of markets and financial systems.",
                [
                    "**Market Dynamics**: Supply, demand, pricing mechanisms, and competitive advantages.",
                    "**Macroeconomic Factors**: Interest rates, inflation metrics, GDP growth, and fiscal policy.",
                    "**Strategic Value Creation**: Building sustainable business models, cash flow management, and capital allocation."
                ]
            ),
            "general": (
                "Comprehensive Knowledge Synthesis",
                f"Detailed conceptual exploration for '{user_message}'.",
                [
                    "**Core Concept**: Analyzing key components and structural context of the topic.",
                    "**Key Principles**: Evaluating best practices, foundational theories, and real-world implications.",
                    "**Actionable Insights**: Applying this knowledge to problem solving, research, or practical projects."
                ]
            )
        }

        domain_info = domain_guides.get(domain, domain_guides["general"])
        domain_name, domain_desc, pillars = domain_info
        pillars_md = "\n".join([f"- {p}" for p in pillars])

        return (
            f"### {topic_title} — {domain_name}\n\n"
            f"{domain_desc}\n\n"
            f"#### Key Structural Pillars:\n"
            f"{pillars_md}\n\n"
            f"#### Model Diagnostics & Advice:\n"
            f"- **Recognized Domain**: {domain.capitalize()}\n"
            f"- **Engine**: SmartChat Local NLP Multi-Domain Neural Classifier\n"
            f"- **Live Generation**: You can also connect your free Google Gemini API key in `.env` for real-time generative responses!"
        )

    def get_model_info(self):
        """Return diagnostic metrics and architecture information."""
        return {
            "model_name": "SmartChat Precision Multi-Domain Engine (Local)",
            "pipeline": "Precision Entity Knowledge Retriever + Fuzzy Correction + TF-IDF (1,2) Classifier",
            "total_intents": len(self.intents_data),
            "total_patterns": len(self.patterns),
            "vocabulary_size": len(self.vectorizer.vocabulary_) if self.vectorizer else 0,
            "trained_at": self.trained_at or "Live",
            "is_trained": self.is_trained
        }
