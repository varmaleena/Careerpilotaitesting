import os
import logging
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("CareerPilot")

# Load all exposed Gemini API keys for Backend Load Balancer
def get_backend_api_keys():
    keys = []
    for var_name in ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4", "GEMINI_API_KEY_5", "GEMINI_API_KEY_6", "GEMINI_API_KEY_7"]:
        val = os.getenv(var_name)
        if val and val.strip():
            keys.append(val.strip())
    return keys

API_KEYS = get_backend_api_keys()
API_KEY = API_KEYS[0] if API_KEYS else None
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

# Models configuration
GEMINI_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "text-embedding-004"

if not API_KEYS:
    logger.warning("⚠️ No GEMINI_API_KEY environment variables defined.")
else:
    logger.info(f"✅ Loaded {len(API_KEYS)} Gemini API Key(s) for Multi-Key Backend Load Balancer.")
