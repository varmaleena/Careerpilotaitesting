import itertools
from typing import Any, Dict, Optional
from google import genai
from google.genai import types
from app.config import API_KEYS, GEMINI_MODEL, logger
from app.services.circuit_breaker import llm_circuit_breaker, CircuitBreakerOpenException

# Multi-Key Server-Side Load Balancer Clients
clients = []
if API_KEYS:
    for key in API_KEYS:
        try:
            clients.append(genai.Client(api_key=key))
        except Exception as e:
            logger.error(f"Failed to initialize client for API key: {e}")

# Global round-robin iterator
client_cycle = itertools.cycle(clients) if clients else None

def generate_llm_response(
    contents: Any,
    model: str = GEMINI_MODEL,
    config_dict: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generates content using Gen AI client with automatic key rotation, circuit breaker protection, and load balancing.
    """
    if not llm_circuit_breaker.can_execute():
        raise CircuitBreakerOpenException("Circuit Breaker is OPEN due to temporary external service outage. Please retry in 30s.")

    if not clients or not client_cycle:
        raise ValueError("Google GenAI client is not configured. Check your GEMINI_API_KEY environment variables.")

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

    last_err = None
    # Try each available client key in rotation
    for _ in range(len(clients)):
        target_client = next(client_cycle)
        try:
            response = target_client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(**gen_config) if gen_config else None
            )
            llm_circuit_breaker.record_success()
            return response.text or ""
        except Exception as err:
            last_err = err
            logger.warning(f"Key execution failed, attempting failover key... Error: {err}")
            continue

    llm_circuit_breaker.record_failure()
    logger.error(f"All GenAI API keys failed. Last Error: {last_err}")
    raise last_err or Exception("All Gemini API keys failed.")
