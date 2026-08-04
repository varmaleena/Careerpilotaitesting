from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import logger, API_KEY
from app.api.endpoints import router as api_router

# Initialize FastAPI App
app = FastAPI(
    title="CareerPilot AI - Advanced GenAI & ML Platform",
    description="Decoupled backend API gateway running FastAPI, scikit-learn, LangChain and Google GenAI APIs.",
    version="2.0.0"
)

# CORS middleware mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix="/api", tags=["core"])


@app.get("/")
def health_check():
    """Health status checker for server deployments."""
    return {
        "status": "active",
        "version": "2.0.0",
        "api_key_configured": bool(API_KEY)
    }
