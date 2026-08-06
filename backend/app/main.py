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
allowed_origins = [
    "https://www.careerpilotai.co.in",
    "https://careerpilotai.co.in",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.careerpilotai\.co\.in",
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
