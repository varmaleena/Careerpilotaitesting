from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import logger, API_KEY
from app.api.endpoints import router as api_router
from app.api.agent_routes import router as agent_router

# Initialize FastAPI App
app = FastAPI(
    title="CareerPilot AI - Advanced Multi-Agent GenAI & ML Platform",
    description="Decoupled backend gateway running Python Multi-Agent Orchestration, scikit-learn ML vector matching, and Google GenAI APIs.",
    version="2.5.0"
)

# CORS middleware mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(api_router, prefix="/api", tags=["core"])
app.include_router(agent_router, prefix="/api/agents", tags=["multi-agent"])


@app.get("/")
def health_check():
    """Health status checker for server deployments."""
    return {
        "status": "active",
        "version": "2.0.0",
        "api_key_configured": bool(API_KEY)
    }
