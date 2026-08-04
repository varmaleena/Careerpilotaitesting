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

# Application Configuration
API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

# Models configuration
GEMINI_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "text-embedding-004"

if not API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY environment variable is not defined.")
else:
    logger.info("✅ GEMINI_API_KEY environment variable successfully loaded.")
