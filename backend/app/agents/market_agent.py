from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.services.ml_service import calculate_match_scores
from app.config import logger

class MarketAgent(BaseAgent):
    """
    Specialized Agent combining ML Cosine Vector Matching with LLM Job Market Intelligence.
    """

    def __init__(self):
        super().__init__(
            name="MarketIntelligence_Agent",
            description="Matches candidates against live job profiles using ML vector similarity & market trends."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        resume_text = context.get("resume_text", "")
        target_role = context.get("target_role", "Software Engineer")

        # 1. Run local ML Vector Cosine Similarity
        ml_matches: List[Dict[str, Any]] = []
        if resume_text:
            try:
                ml_matches = calculate_match_scores(resume_text)
            except Exception as ml_err:
                logger.warning(f"[{self.name}] Local ML Vector Matching warning: {ml_err}")

        # 2. Query Gemini LLM for market trends & demand insights
        system_prompt = f"""
You are a Senior Career Market Strategist analyzing the tech job market for "{target_role}".
Provide current high-demand skills, salary ranges (in USD and INR), and top hiring sectors.

Return JSON:
{{
    "targetRole": "{target_role}",
    "marketDemandRating": "Very High | High | Moderate",
    "salaryRange": {{
        "usd": "$110,000 - $165,000",
        "inr": "₹18,00,000 - ₹35,00,000"
    }},
    "topTrendingSkills": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "topHiringSectors": ["FinTech", "HealthTech", "AI Platforms"]
}}
"""
        user_prompt = f"Analyze job market demand and key skills for {target_role}."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            market_insights = self.clean_json_response(raw_response)

            return {
                "ml_job_matches": ml_matches,
                "market_insights": market_insights
            }
        except Exception as e:
            logger.error(f"[{self.name}] Market intelligence processing failed: {e}")
            return {
                "ml_job_matches": ml_matches,
                "error": str(e),
                "agent": self.name
            }
