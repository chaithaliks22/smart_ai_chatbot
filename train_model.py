"""
SmartChat AI — Standalone Model Training & Evaluation Pipeline
Run this script to train the local NLP model, evaluate accuracy,
and serialize weights for multi-domain deployment.
"""

import os
import sys
import json
import time
import numpy as np

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure correct base path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from nlp_model import SmartChatNLPModel, preprocess_text, DEFAULT_DATASET, DEFAULT_CACHE
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score


def run_training_pipeline():
    print("\n=======================================================")
    print("  🧠 SMARTCHAT AI — MULTI-DOMAIN NLP TRAINING PIPELINE")
    print("=======================================================\n")

    start_time = time.time()

    dataset_file = DEFAULT_DATASET
    if not os.path.exists(dataset_file):
        print(f"Error: {dataset_file} not found!")
        sys.exit(1)

    print(f"1. Loading dataset from '{dataset_file}'...")
    with open(dataset_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    intents = data.get("intents", [])
    patterns = []
    labels = []

    for intent in intents:
        tag = intent["tag"]
        for p in intent.get("patterns", []):
            clean_p = preprocess_text(p)
            if clean_p:
                patterns.append(clean_p)
                labels.append(tag)

    total_intents = len(intents)
    total_samples = len(patterns)
    print(f"   ✓ Loaded {total_intents} Intent Categories")
    print(f"   ✓ Loaded {total_samples} Training Patterns across multiple domains (Film, Sports, Education, Science, History, Tech)\n")

    print("2. Extracting Features using TF-IDF (Unigrams + Bigrams)...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        token_pattern=r"(?u)\b\w+\b"
    )
    X = vectorizer.fit_transform(patterns)
    y = np.array(labels)
    vocab_size = len(vectorizer.vocabulary_)
    print(f"   ✓ Vocabulary Size: {vocab_size} unique n-gram features\n")

    print("3. Training Multi-Class Intent Classifier...")
    model = LogisticRegression(C=4.0, max_iter=400, random_state=42)
    model.fit(X, y)

    # 4. Stratified Cross-Validation Evaluation
    min_samples_per_class = min([labels.count(tag) for tag in set(labels)])
    cv_splits = min(3, min_samples_per_class) if min_samples_per_class >= 2 else 2

    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")

    # In-sample training accuracy
    y_pred = model.predict(X)
    train_acc = accuracy_score(y, y_pred) * 100

    print(f"   ✓ Training Accuracy: {train_acc:.2f}%")
    print(f"   ✓ Stratified CV Score ({cv_splits}-Fold): {scores.mean() * 100:.2f}% (+/- {scores.std() * 100:.2f}%)\n")

    print("4. Serializing Model Weights...")
    nlp_engine = SmartChatNLPModel(dataset_path=dataset_file, model_cache_path=DEFAULT_CACHE)
    nlp_engine.train()

    elapsed = time.time() - start_time
    print(f"   ✓ Model serialized to '{DEFAULT_CACHE}' in {elapsed:.3f}s\n")

    print("=======================================================")
    print("  🎉 TRAINING COMPLETE — MODEL READY FOR INFERENCE!")
    print("=======================================================\n")

    # Interactive test loop across different fields
    sample_queries = [
        "Tell me about the film industry and cinema",
        "What are the rules and formats of cricket?",
        "How is football soccer played in world cup?",
        "Explain higher education degrees and research",
        "What is the best way to study effectively using Feynman technique?",
        "What is machine learning and deep learning?",
        "Tell me about physics and astronomy",
        "Explain DBMS normalization 1NF 2NF 3NF"
    ]

    print("Sample Multi-Domain Inferences:")
    for query in sample_queries:
        tag, conf, sim = nlp_engine.predict_intent(query)
        print(f" - Query: '{query}'")
        print(f"   -> Predicted Tag: [{tag}] (Confidence: {conf * 100:.1f}%, Similarity: {sim * 100:.1f}%)")

    print("\n")


if __name__ == "__main__":
    run_training_pipeline()
