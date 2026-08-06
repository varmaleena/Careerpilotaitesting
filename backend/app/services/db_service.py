import os
import json
from typing import Dict, Any, Optional
from app.config import logger

# Check if Firebase Admin Firestore is available
firestore_db = None
try:
    import firebase_admin
    from firebase_admin import firestore
    if firebase_admin._apps:
        firestore_db = firestore.client()
        logger.info("✅ Server-side Firestore Database connected successfully.")
except Exception as e:
    logger.warning(f"Server-side Firestore initialization skipped (using local file DB fallback): {e}")

# Fallback File DB Storage Directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
FILE_DB_PATH = os.path.join(DATA_DIR, "server_user_db.json")

def _read_file_db() -> Dict[str, Any]:
    if not os.path.exists(FILE_DB_PATH):
        return {}
    try:
        with open(FILE_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _write_file_db(data: Dict[str, Any]):
    try:
        with open(FILE_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to write server file DB: {e}")

class BackendDatabaseService:
    """
    Production Server-Side Database Service.
    Uses Firebase Firestore Admin SDK when available, with clean fallback to server storage.
    """

    @staticmethod
    def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
        if not user_id:
            return None

        if firestore_db:
            try:
                doc_ref = firestore_db.collection("users").document(user_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Firestore get_user_profile error for {user_id}: {e}")

        # Fallback
        db_data = _read_file_db()
        user_node = db_data.get(user_id, {})
        return user_node.get("userProfile")

    @staticmethod
    def save_user_profile(user_id: str, profile_dict: Dict[str, Any]) -> bool:
        if not user_id:
            return False

        if firestore_db:
            try:
                doc_ref = firestore_db.collection("users").document(user_id)
                doc_ref.set(profile_dict, merge=True)
                return True
            except Exception as e:
                logger.error(f"Firestore save_user_profile error for {user_id}: {e}")

        # Fallback
        db_data = _read_file_db()
        if user_id not in db_data:
            db_data[user_id] = {}
        db_data[user_id]["userProfile"] = profile_dict
        _write_file_db(db_data)
        return True

    @staticmethod
    def get_user_data(user_id: str, data_type: str) -> Optional[Any]:
        if not user_id:
            return None

        if firestore_db:
            try:
                doc_ref = firestore_db.collection("users").document(user_id).collection("user_data").document(data_type)
                doc = doc_ref.get()
                if doc.exists:
                    res = doc.to_dict()
                    return res.get("data")
            except Exception as e:
                logger.error(f"Firestore get_user_data error ({data_type}): {e}")

        # Fallback
        db_data = _read_file_db()
        user_node = db_data.get(user_id, {})
        return user_node.get(data_type)

    @staticmethod
    def save_user_data(user_id: str, data_type: str, payload: Any) -> bool:
        if not user_id:
            return False

        if firestore_db:
            try:
                doc_ref = firestore_db.collection("users").document(user_id).collection("user_data").document(data_type)
                doc_ref.set({"data": payload, "updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
                return True
            except Exception as e:
                logger.error(f"Firestore save_user_data error ({data_type}): {e}")

        # Fallback
        db_data = _read_file_db()
        if user_id not in db_data:
            db_data[user_id] = {}
        db_data[user_id][data_type] = payload
        _write_file_db(db_data)
        return True
