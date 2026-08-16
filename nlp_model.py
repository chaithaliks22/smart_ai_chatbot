"""
SmartChat AI — End-to-End Local NLP & Machine Learning Engine
Handles text preprocessing, TF-IDF feature extraction, intent classification,
semantic cosine matching, and response generation.
"""

import os
import re
import json
import pickle
import logging
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("SmartChatAI.NLPModel")

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


def preprocess_text(text):
    """Clean, lowercase, and tokenize input query."""
    if not text:
        return ""
    text = text.lower().strip()
    # Remove punctuation except hyphens/underscores in terms
    text = re.sub(r"[^\w\s-]", " ", text)
    tokens = text.split()
    # Keep key query words (even short acronyms like ml, db, ai, os)
    cleaned = [t for t in tokens if t not in STOP_WORDS or len(t) <= 2]
    return " ".join(cleaned) if cleaned else text


class SmartChatNLPModel:
    """
    End-to-End Local NLP Chatbot Model with TF-IDF Vectorizer
    and Logistic Regression / Cosine Similarity classification.
    """

    def __init__(self, dataset_path="dataset.json", model_cache_path="smartchat_model.pkl"):
        self.dataset_path = dataset_path
        self.model_cache_path = model_cache_path
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

        # 2. Classifier: Logistic Regression with Cross-Entropy Loss
        self.classifier = LogisticRegression(
            C=5.0,
            max_iter=300,
            random_state=42
        )
        self.classifier.fit(X, y)

        self.trained_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.is_trained = True
        logger.info(f"SmartChat NLP Model trained successfully (Vocabulary: {len(self.vectorizer.vocabulary_)} tokens).")

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

        # If similarity is high, trust semantic match
        if max_sim_score > 0.45:
            matched_tag = self.pattern_tags[max_sim_idx]
            return matched_tag, max_sim_score, max_sim_score

        return predicted_tag, confidence, max_sim_score

    def generate_response(self, user_message):
        """
        Generate rich formatted Markdown answer based on predicted intent
        and semantic pattern match.
        """
        tag, confidence, sim_score = self.predict_intent(user_message)
        logger.info(f"Query: '{user_message}' -> Predicted Tag: '{tag}' (Confidence: {confidence:.2f}, Similarity: {sim_score:.2f})")

        # Direct intent match
        if (confidence >= 0.20 or sim_score >= 0.25) and tag in self.intents_data:
            responses = self.intents_data[tag].get("responses", [])
            if responses:
                return responses[0]

        # Dynamic synthesis fallback
        return (
            f"### SmartChat NLP Model Response\n\n"
            f"Thank you for asking about: **{user_message}**.\n\n"
            f"Here is a structured breakdown from the SmartChat Local NLP Engine:\n\n"
            f"- **Domain Analysis**: Your question pertains to technical / computing concepts.\n"
            f"- **Confidence Score**: {confidence * 100:.1f}%\n"
            f"- **Recommended Next Steps**: You can explore topics such as **Machine Learning, Python Debugging, DBMS Normalization, Data Structures, or Final-Year Project Ideas**.\n\n"
            f"> **Tip**: To get unlimited real-time generation powered by Google Gemini, add your free `GEMINI_API_KEY` in the `.env` file!"
        )

    def get_model_info(self):
        """Return diagnostic metrics and architecture information."""
        return {
            "model_name": "SmartChat Neural NLP Engine (Local)",
            "pipeline": "TF-IDF N-gram (1,2) + Logistic Regression Classifier + Cosine Similarity Matcher",
            "total_intents": len(self.intents_data),
            "total_patterns": len(self.patterns),
            "vocabulary_size": len(self.vectorizer.vocabulary_) if self.vectorizer else 0,
            "trained_at": self.trained_at or "Live",
            "is_trained": self.is_trained
        }
