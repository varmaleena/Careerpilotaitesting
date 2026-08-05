from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class ResumeAgent(BaseAgent):
    """
    Specialized Agent for Resume Validation, ATS Scoring & Bullet Point Optimization.
    Enforces FAANG-level executive resume benchmarks.
    """

    def __init__(self):
        super().__init__(
            name="ResumeATS_Agent",
            description="Analyzes resumes for ATS compatibility, calculates scores, validates documents, and optimizes bullet points."
        )

    async def validate_resume(self, text: str) -> Dict[str, Any]:
        """
        Validates if the provided text is a genuine candidate resume.
        """
        if not text or len(text.strip()) < 30:
            return {"isValid": False, "confidence": 0.0, "reason": "Text is too short or empty."}

        system_prompt = """
You are a Document Classification Specialist for career platforms.
Analyze the input text and determine if it represents a professional resume/CV, LinkedIn profile, or work experience summary.

Return JSON strictly matching:
{
    "isResume": <boolean>,
    "confidence": <number 0.0 to 1.0>,
    "reason": "<One clear sentence explanation>"
}
"""
        try:
            raw = await self.call_llm(prompt=f"DOCUMENT TEXT:\n{text[:2000]}", system_instruction=system_prompt, json_output=True)
            res = self.clean_json_response(raw)
            return {
                "isValid": bool(res.get("isResume", True)),
                "confidence": float(res.get("confidence", 0.9)),
                "reason": res.get("reason", "Document analysis complete.")
            }
        except Exception as e:
            logger.error(f"[{self.name}] Validation error: {e}")
            return {"isValid": True, "confidence": 0.8, "reason": "Passed basic structural check."}

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        resume_text = context.get("resume_text", "")
        target_role = context.get("target_role", "Software Engineer")
        target_companies = context.get("target_companies", "Top Tech Companies")
        experience_level = context.get("experience_level", "Intermediate")

        if not resume_text:
            return {"error": "Resume text is missing from context."}

        system_prompt = f"""
You are a Principal Executive Resume Reviewer and Senior ATS Parser for top-tier tech companies ({target_companies}).
Analyze the candidate's resume strictly against the target role: "{target_role}" ({experience_level} Level).

Evaluation Criteria:
1. ATS Keyword Density (30%): Must contain core frameworks, tools, and technical terms expected for {target_role}.
2. Quantified Metrics & Impact (30%): Bullet points must use Google's XYZ formula ("Accomplished X, measured by Y, by doing Z").
3. Technical Relevance (20%): Match candidate's technologies against current industry standards.
4. Structure & Brevity (20%): No fluff, concise, clean formatting.

Output JSON strictly matching this structure:
{{
    "readinessScore": <integer 0 to 100>,
    "summary": "<2-sentence sharp assessment of candidate readiness>",
    "overallRating": "<Outstanding | Strong | Moderate | Needs Work>",
    "skills": [
        {{
            "name": "<Skill Name>",
            "category": "technical",
            "status": "acquired"
        }}
    ],
    "strengths": ["<Specific strength 1>", "<Specific strength 2>", "<Specific strength 3>"],
    "criticalGaps": ["<Actionable gap 1>", "<Actionable gap 2>"],
    "missingKeywords": ["<Keyword 1>", "<Keyword 2>", "<Keyword 3>", "<Keyword 4>"],
    "bulletPointImprovements": [
        {{
            "original": "<Original bullet from candidate's resume>",
            "improved": "<Quantified, impact-driven rewrite using XYZ format>",
            "reason": "<Clear architectural/metric justification>"
        }}
    ],
    "sectionScores": {{
        "impact": <integer 0-100>,
        "skills": <integer 0-100>,
        "formatting": <integer 0-100>,
        "relevance": <integer 0-100>
    }}
}}
"""

        user_prompt = f"TARGET ROLE: {target_role}\nEXPERIENCE LEVEL: {experience_level}\nTARGET COMPANIES: {target_companies}\n\nRESUME CONTENT:\n{resume_text}"

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
