import json
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.services.llm_service import generate_llm_response, ai_client
from app.config import logger, GEMINI_MODEL

class BaseAgent(ABC):
    """
    Abstract Base Class for all specialized agents in CareerPilot.
    Provides standard execution lifecycle, JSON cleaning, and LLM access.
    """

    def __init__(self, name: str, description: str, default_model: str = GEMINI_MODEL):
        self.name = name
        self.description = description
        self.default_model = default_model

    @abstractmethod
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent logic given input context dictionary.
        Must return a structured dictionary result.
        """
        pass

    def clean_json_response(self, text: str) -> Dict[str, Any]:
        """
        Helper method to sanitize and parse markdown JSON codeblocks returned by LLM.
        """
        if not text:
            return {}
        
        cleaned = re.sub(r'```json\s*', '', text, flags=re.IGNORECASE)
        cleaned = re.sub(r'```\s*', '', cleaned)
        cleaned = cleaned.strip()

        first_brace = cleaned.find('{')
        first_bracket = cleaned.find('[')
        
        if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            last_brace = cleaned.rfind('}')
            if last_brace != -1:
                cleaned = cleaned[first_brace:last_brace + 1]
        elif first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
            last_bracket = cleaned.rfind(']')
            if last_bracket != -1:
                cleaned = cleaned[first_bracket:last_bracket + 1]

        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"[{self.name}] Failed to parse JSON: {e}. Raw text snippet: {cleaned[:100]}")
            return {"raw_text": text}

    async def call_llm(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        json_output: bool = True
    ) -> str:
        """
        Invokes LLM with system instruction and formatting configs.
        """
        target_model = model or self.default_model
        config_dict = {}
        if system_instruction:
            config_dict["systemInstruction"] = system_instruction
        if json_output:
            config_dict["responseMimeType"] = "application/json"

        try:
            return generate_llm_response(
                contents=prompt,
                model=target_model,
                config_dict=config_dict
            )
        except Exception as err:
            logger.error(f"[{self.name}] LLM invocation failed: {err}")
            raise err
