import os
import json
import base64
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import logger

def decode_unverified_token(token: str) -> Dict[str, Any]:
    """Decodes JWT payload without signature verification for flexible fallback mode."""
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(payload_bytes)
    except Exception as e:
        logger.warning(f"Could not parse unverified JWT payload: {e}")
    return {}

# Optional Firebase Admin SDK Initialization
firebase_admin_initialized = False
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials

    if not firebase_admin._apps:
        # Check for service account json string, file path, or default init
        cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY") or os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        project_id = os.getenv("FIREBASE_PROJECT_ID") or os.getenv("VITE_FIREBASE_PROJECT_ID", "careerpilot-7de59")

        if cred_json:
            try:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                firebase_admin_initialized = True
                logger.info("✅ Firebase Admin SDK initialized with service account JSON env var.")
            except Exception as json_err:
                logger.warning(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var: {json_err}")

        if not firebase_admin_initialized and cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            firebase_admin_initialized = True
            logger.info("✅ Firebase Admin SDK initialized with service account file.")

        if not firebase_admin_initialized:
            # Initialize with default project config if project id exists
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
            # Pass clock_skew_seconds=60 to account for server/client clock drift
            decoded_token = firebase_auth.verify_id_token(token, clock_skew_seconds=60)
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", "User"),
                "authenticated": True,
                "token": token
            }
        except Exception as e:
            logger.warning(f"Firebase Bearer Token verification failed: {e}")
            require_strict_auth = os.getenv("REQUIRE_STRICT_AUTH", "false").lower() in ("true", "1", "yes")
            if require_strict_auth:
                raise HTTPException(
                    status_code=401,
                    detail=f"Invalid or expired authentication token: {str(e)}"
                )
            
            # Flexible fallback: decode token claims without failing request
            claims = decode_unverified_token(token)
            return {
                "uid": claims.get("user_id") or claims.get("sub") or "fallback_user",
                "email": claims.get("email") or "fallback@careerpilot.ai",
                "name": claims.get("name") or "User",
                "authenticated": False,
                "token": token,
                "auth_error": str(e)
            }

    # If no token provided or dev fallback mode
    return {
        "uid": "anonymous_dev_user",
        "email": "dev@careerpilot.ai",
        "name": "Developer",
        "authenticated": False,
        "token": None
    }


