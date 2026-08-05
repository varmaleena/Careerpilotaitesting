from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class ResumeAgent(BaseAgent):
    """
    Specialized Agent for Resume Parsing, ATS Optimization & Impact Bullet Scoring.
    """

    def __init__(self):
        super().__init__(
            name="ResumeATS_Agent",
            description="Analyzes resumes for ATS compatibility, calculates scores, and optimizes bullet points."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        resume_text = context.get("resume_text", "")
        target_role = context.get("target_role", "Software Engineer")
        target_companies = context.get("target_companies", "Top Tech Companies")

        if not resume_text:
            return {"error": "Resume text is missing from context."}

        system_prompt = f"""
You are an expert Executive Resume Writer and ATS Algorithm Specialist for {target_companies}.
Analyze the provided resume with extreme precision for the target role: "{target_role}".

Calculate a strict ATS score (0-100) based on:
1. Keyword Density & Role Relevance (30%)
2. Quantified Achievements & Action Verbs (30%)
3. Formatting & Section Structure (20%)
4. Technical Skills & Tools Alignment (20%)

Return JSON strictly matching this schema:
{{
    "atsScore": <number 0-100>,
    "overallRating": "<Outstanding | Strong | Needs Improvement>",
    "summary": "<2 sentence overview>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "criticalGaps": ["<gap 1>", "<gap 2>"],
    "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
    "bulletPointImprovements": [
        {{
            "original": "<weak bullet from resume>",
            "improved": "<quantified, impact-driven rewrite>",
            "reason": "<explanation of enhancement>"
        }}
    ],
    "sectionScores": {{
        "impact": <number 0-100>,
        "skills": <number 0-100>,
        "formatting": <number 0-100>,
        "relevance": <number 0-100>
    }}
}}
"""

        user_prompt = f"TARGET ROLE: {target_role}\nTARGET COMPANIES: {target_companies}\n\nRESUME CONTENT:\n{resume_text}"

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            return self.clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"[{self.name}] Error during processing: {e}")
            return {"error": str(e), "agent": self.name}
