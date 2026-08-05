from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class RoadmapAgent(BaseAgent):
    """
    Specialized Agent for Career Trajectory & Structured Learning Roadmap Generation.
    """

    def __init__(self):
        super().__init__(
            name="LearningRoadmap_Agent",
            description="Generates step-by-step weekly learning roadmaps, skills gap analysis, and milestones."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_role = context.get("target_role", "Software Engineer")
        experience_level = context.get("experience_level", "Intermediate")
        current_skills = context.get("skills", [])
        duration_weeks = context.get("duration_weeks", 6)

        system_prompt = f"""
You are a Principal Technical Lead and Career Mentor crafting a personalized, hyper-realistic {duration_weeks}-week Learning Plan for a candidate targeting the role of "{target_role}" ({experience_level} level).

Current candidate skills: {', '.join(current_skills) if current_skills else 'Not specified'}.

Generate a week-by-week structured curriculum. Output strictly valid JSON matching this schema:
{{
    "targetRole": "{target_role}",
    "estimatedTimeWeeks": {duration_weeks},
    "readinessScore": <number 0-100>,
    "skillGapAnalysis": {{
        "mastered": ["<skill>"],
        "toLearn": ["<skill>"],
        "criticalFocus": ["<skill>"]
    }},
    "weeklyPlan": [
        {{
            "week": 1,
            "title": "<Week 1 Title>",
            "focusArea": "<Core focus>",
            "keyObjectives": ["<obj 1>", "<obj 2>"],
            "recommendedResources": [
                {{"name": "<Resource Name>", "type": "Documentation | Course | Book", "link": "<URL or search term>"}}
            ],
            "handsOnProject": "<Milestone project for the week>"
        }}
    ]
}}
"""

        user_prompt = f"Create a comprehensive {duration_weeks}-week technical roadmap for {target_role} level {experience_level}."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            return self.clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"[{self.name}] Error generating roadmap: {e}")
            return {"error": str(e), "agent": self.name}
