import os
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import logger

# Optional Firebase Admin SDK Initialization
firebase_admin_initialized = False
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials

    if not firebase_admin._apps:
        # Check for service account json or default init
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            firebase_admin_initialized = True
            logger.info("✅ Firebase Admin SDK initialized with service account.")
        else:
            # Initialize with default project config if project id exists
            project_id = os.getenv("VITE_FIREBASE_PROJECT_ID", "careerpilot-7de59")
            firebase_admin.initialize_app(options={"projectId": project_id})
            firebase_admin_initialized = True
            logger.info(f"✅ Firebase Admin SDK initialized for project '{project_id}'.")
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped (will use flexible bearer auth fallback): {e}")

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials_obj: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """
    FastAPI Security Dependency.
    Verifies incoming Firebase Bearer ID Tokens in the HTTP Authorization header.
    In local dev / fallback mode, allows unauthenticated requests gracefully.
    """
    token = credentials_obj.credentials if credentials_obj else None

    if token and firebase_admin_initialized:
        try:
            import firebase_admin.auth as firebase_auth
            decoded_token = firebase_auth.verify_id_token(token)
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", "User"),
                "authenticated": True,
                "token": token
            }
        except Exception as e:
            logger.warning(f"Firebase Bearer Token verification failed: {e}")
            raise HTTPException(
                status_code=401,
                detail=f"Invalid or expired authentication token: {str(e)}"
            )

    # If no token provided or dev fallback mode
    return {
        "uid": "anonymous_dev_user",
        "email": "dev@careerpilot.ai",
        "name": "Developer",
        "authenticated": False,
        "token": None
    }
