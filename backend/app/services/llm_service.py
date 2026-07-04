from typing import Any, Dict, Optional
from google import genai
from google.genai import types
from app.config import API_KEY, GEMINI_MODEL, logger

# Initialize Gemini Client on the server side
try:
    if API_KEY:
        ai_client = genai.Client(api_key=API_KEY)
    else:
        ai_client = None
except Exception as e:
    logger.error(f"Failed to initialize GenAI Client: {e}")
    ai_client = None


def generate_llm_response(
    contents: Any,
    model: str = GEMINI_MODEL,
    config_dict: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generates content using the Google Gen AI client.
    Safely maps key configuration dictionary values to SDK models.
    """
    if not ai_client:
        raise ValueError("Google GenAI client is not configured. Check your GEMINI_API_KEY environment variable.")

    # Prepare GenAI config object
    gen_config = {}
    if config_dict:
        if "systemInstruction" in config_dict:
            gen_config["system_instruction"] = config_dict["systemInstruction"]
        
        if "responseMimeType" in config_dict:
            gen_config["response_mime_type"] = config_dict["responseMimeType"]
        
        if "responseSchema" in config_dict:
            gen_config["response_schema"] = config_dict["responseSchema"]

        if "temperature" in config_dict:
            gen_config["temperature"] = config_dict["temperature"]

    try:
        response = ai_client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(**gen_config) if gen_config else None
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"LLM Generation Error: {e}")
        raise e
