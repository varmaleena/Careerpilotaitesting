import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import logger

# Database of standard target career profiles for local matching
# In a full production system, these would be loaded from a database or a Vector DB.
JOB_PROFILES = [
    {
        "id": "frontend",
        "title": "Frontend Developer",
        "keywords": "React TypeScript CSS HTML Javascript Tailwind NextJS Redux Webpack responsive UI UX front-end components state-management",
        "description": "Building interactive, performant web interfaces and web applications using modern Javascript frameworks."
    },
    {
        "id": "backend",
        "title": "Backend Developer",
        "keywords": "Python FastAPI NodeJS Express PostgreSQL MongoDB Redis Docker AWS APIs REST database microservices SQL server back-end git",
        "description": "Designing secure, scalable server-side systems, databases, APIs, and cloud microservices configurations."
    },
    {
        "id": "fullstack",
        "title": "Full Stack Developer",
        "keywords": "React Python NodeJS Javascript TypeScript FastAPI REST HTML CSS SQL MongoDB AWS Docker components database web-app git",
        "description": "Engineering end-to-end web applications covering both client interface designs and server database logic."
    },
    {
        "id": "datascientist",
        "title": "Data Scientist / ML Engineer",
        "keywords": "Python Machine-Learning Scikit-Learn Pandas NumPy SQL TensorFlow PyTorch Data-Analysis statistics NLP regression classification",
        "description": "Analyzing complex data patterns, training ML models, and deploying predictive data science systems."
    },
    {
        "id": "devops",
        "title": "DevOps Cloud Engineer",
        "keywords": "AWS Docker Kubernetes Terraform CI-CD Linux bash scripting monitoring Prometheus Jenkins cloud infrastructure networking",
        "description": "Configuring robust CI/CD pipelines, container orchestration, cloud hosting services, and infrastructure scaling."
    }
]


def clean_text(text: str) -> str:
    """Preprocesses input text by removing special characters and lowering case."""
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def calculate_match_scores(resume_text: str) -> List[Dict[str, Any]]:
    """
    NLP Matching Pipeline:
    1. Preprocesses the resume and the target job profiles.
    2. Vectorizes text using TF-IDF (Term Frequency-Inverse Document Frequency).
    3. Computes the Cosine Similarity metric locally.
    4. Identifies overlapping matching keywords.
    """
    logger.info("Initializing TF-IDF local ML Matching Engine...")
    
    cleaned_resume = clean_text(resume_text)
    
    # Extract profile keywords list
    profiles_text = [profile["keywords"] for profile in JOB_PROFILES]
    
    # Initialize the TF-IDF Vectorizer
    # We include both single words and double-word phrases (bigrams)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    
    # Fit vectorizer on all profiles + the resume
    all_texts = [cleaned_resume] + profiles_text
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Extract the resume vector (index 0) and the profile vectors (index 1 onwards)
    resume_vector = tfidf_matrix[0]
    profile_vectors = tfidf_matrix[1:]
    
    # Calculate Cosine Similarity between the resume and each profile vector
    similarity_scores = cosine_similarity(resume_vector, profile_vectors)[0]
    
    # Compile matches list
    matches = []
    resume_words = set(cleaned_resume.split())
    
    for i, profile in enumerate(JOB_PROFILES):
        score = float(similarity_scores[i]) * 100  # Convert to percentage
        
        # Calculate matching keyword overlap
        profile_words = set(profile["keywords"].lower().split())
        matched_keywords = list(resume_words.intersection(profile_words))
        missing_keywords = list(profile_words.difference(resume_words))
        
        matches.append({
            "id": profile["id"],
            "title": profile["title"],
            "description": profile["description"],
            "match_score": round(score, 2),
            "matched_skills": [skill.title() for skill in matched_keywords[:8]],  # Top 8 matching keywords
            "missing_skills": [skill.title() for skill in missing_keywords[:8]]    # Top 8 missing keywords
        })
        
    # Sort matches by score descending
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches
