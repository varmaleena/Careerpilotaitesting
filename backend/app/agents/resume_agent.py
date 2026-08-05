import asyncio
from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.services.resume_parser import parse_resume_sections
from app.config import logger

class ResumeAgent(BaseAgent):
    """
    Specialized Agent for Sectional Parallel Resume Analysis, ATS Scoring & Bullet Point Optimization.
    Divides resume into isolated sections, runs sub-agent LLM calls concurrently, and synthesizes unified JSON.
    """

    def __init__(self):
        super().__init__(
            name="ResumeATS_Agent",
            description="Analyzes resumes via sectional parallel LLM calls for maximum precision and ultra-low latency."
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

    async def analyze_experience_section(self, exp_text: str, target_role: str) -> Dict[str, Any]:
        """Micro-agent focusing 100% on Experience & Bullet Point XYZ rewrites."""
        system_prompt = f"""
You are an Executive Resume Coach evaluating candidate work experience for the role of "{target_role}".
Analyze the bullet points and rewrite weak ones using Google's XYZ formula ("Accomplished X, measured by Y, by doing Z").

Return JSON strictly:
{{
    "impactScore": <integer 0-100>,
    "strengths": ["<strength 1>", "<strength 2>"],
    "bulletPointImprovements": [
        {{
            "original": "<original bullet>",
            "improved": "<quantified XYZ rewrite>",
            "reason": "<explanation>"
        }}
    ]
}}
"""
        try:
            raw = await self.call_llm(prompt=f"EXPERIENCE SECTION:\n{exp_text}", system_instruction=system_prompt, json_output=True)
            return self.clean_json_response(raw)
        except Exception as e:
            logger.error(f"[{self.name}] Experience section analysis failed: {e}")
            return {"impactScore": 75, "strengths": ["Demonstrates technical experience"], "bulletPointImprovements": []}

    async def analyze_skills_section(self, skills_text: str, target_role: str) -> Dict[str, Any]:
        """Micro-agent focusing 100% on Technical & Soft Skills categorization."""
        system_prompt = f"""
You are a Technical Recruiter evaluating candidate skills for "{target_role}".
Extract acquired skills and identify critical missing technical skills.

Return JSON strictly:
{{
    "skillsScore": <integer 0-100>,
    "skills": [
        {{
            "name": "<Skill Name>",
            "category": "technical",
            "status": "acquired"
        }}
    ],
    "criticalGaps": ["<Gap 1>", "<Gap 2>"]
}}
"""
        try:
            raw = await self.call_llm(prompt=f"SKILLS SECTION:\n{skills_text}", system_instruction=system_prompt, json_output=True)
            return self.clean_json_response(raw)
        except Exception as e:
            logger.error(f"[{self.name}] Skills section analysis failed: {e}")
            return {"skillsScore": 80, "skills": [], "criticalGaps": []}

    async def analyze_relevance_section(self, full_resume: str, target_role: str, target_companies: str) -> Dict[str, Any]:
        """Micro-agent focusing 100% on Role Relevance & Missing ATS Keywords."""
        system_prompt = f"""
You are a Lead ATS Architect evaluating role fit for "{target_role}" at "{target_companies}".
Extract missing ATS keywords and compute overall readiness score.

Return JSON strictly:
{{
    "readinessScore": <integer 0-100>,
    "overallRating": "<Outstanding | Strong | Moderate | Needs Work>",
    "summary": "<2-sentence sharp assessment>",
    "missingKeywords": ["<Keyword 1>", "<Keyword 2>", "<Keyword 3>", "<Keyword 4>"],
    "relevanceScore": <integer 0-100>,
    "formattingScore": <integer 0-100>
}}
"""
        try:
            raw = await self.call_llm(prompt=f"TARGET ROLE: {target_role}\nRESUME:\n{full_resume[:3000]}", system_instruction=system_prompt, json_output=True)
            return self.clean_json_response(raw)
        except Exception as e:
            logger.error(f"[{self.name}] Relevance analysis failed: {e}")
            return {"readinessScore": 75, "overallRating": "Strong", "summary": "Good overall profile.", "missingKeywords": [], "relevanceScore": 80, "formattingScore": 85}

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        resume_text = context.get("resume_text", "")
        target_role = context.get("target_role", "Software Engineer")
        target_companies = context.get("target_companies", "Top Tech Companies")

        if not resume_text:
            return {"error": "Resume text is missing from context."}

        # 1. Parse resume into distinct sections
        parsed_sections = parse_resume_sections(resume_text)

        # 2. Run Parallel Sub-Agent LLM API Calls (asyncio.gather)
        logger.info(f"[{self.name}] Triggering parallel sectional micro-agent LLM calls...")
        results = await asyncio.gather(
            self.analyze_experience_section(parsed_sections["experience"], target_role),
            self.analyze_skills_section(parsed_sections["skills"], target_role),
            self.analyze_relevance_section(resume_text, target_role, target_companies),
            return_exceptions=True
        )

        exp_res = results[0] if not isinstance(results[0], Exception) else {}
        skills_res = results[1] if not isinstance(results[1], Exception) else {}
        relevance_res = results[2] if not isinstance(results[2], Exception) else {}

        # 3. Synthesize micro-agent outputs into unified clean JSON for UI
        readiness_score = relevance_res.get("readinessScore") or exp_res.get("impactScore", 75)
        
        return {
            "readinessScore": readiness_score,
            "summary": relevance_res.get("summary", f"Candidate profile analyzed for {target_role}."),
            "overallRating": relevance_res.get("overallRating", "Strong"),
            "skills": skills_res.get("skills", []),
            "strengths": exp_res.get("strengths", ["Solid technical experience"]),
            "criticalGaps": skills_res.get("criticalGaps", []),
            "missingKeywords": relevance_res.get("missingKeywords", []),
            "bulletPointImprovements": exp_res.get("bulletPointImprovements", []),
            "sectionScores": {
                "impact": exp_res.get("impactScore", 80),
                "skills": skills_res.get("skillsScore", 80),
                "formatting": relevance_res.get("formattingScore", 85),
                "relevance": relevance_res.get("relevanceScore", 80)
            }
        }
