from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
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

# Allowed CORS Origins
allowed_origins = [
    "https://www.careerpilotai.co.in",
    "https://careerpilotai.co.in",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Standard FastAPI CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.careerpilotai\.co\.in",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom HTTP Middleware: Guarantees CORS headers on EVERY response (even unhandled errors)
@app.middleware("http")
async def add_cors_headers_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # Handle preflight OPTIONS directly
    if request.method == "OPTIONS":
        response = JSONResponse(content={"status": "ok"}, status_code=200)
    else:
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Middleware caught unhandled exception on {request.url.path}: {e}")
            response = JSONResponse(
                status_code=500,
                content={"detail": f"Internal Server Error: {str(e)}"}
            )

    # Attach CORS headers to response
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, User-Agent, Cache-Control, Pragma, X-Requested-With"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
        
    return response

# Catch-all OPTIONS route handler for all subpaths
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    origin = request.headers.get("origin", "https://www.careerpilotai.co.in")
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, User-Agent, Cache-Control, Pragma, X-Requested-With",
        }
    )

# Global Exception Handlers that ensure CORS headers on 500 & 401 errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin", "https://www.careerpilotai.co.in")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, User-Agent, Cache-Control, Pragma, X-Requested-With",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url.path}: {exc}")
    origin = request.headers.get("origin", "https://www.careerpilotai.co.in")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, User-Agent, Cache-Control, Pragma, X-Requested-With",
        }
    )

# Register API Routers
app.include_router(api_router, prefix="/api", tags=["core"])
app.include_router(agent_router, prefix="/api/agents", tags=["multi-agent"])


@app.get("/")
def health_check():
    """Health status checker for server deployments."""
    return {
        "status": "active",
        "version": "2.5.0",
        "api_key_configured": bool(API_KEY)
    }

