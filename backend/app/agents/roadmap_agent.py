from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class RoadmapAgent(BaseAgent):
    """
    Specialized Agent for Career Trajectory & Structured Weekly Learning Roadmap Generation.
    Enforces strict deliverables, realistic hours, and outcome-based milestones.
    """

    def __init__(self):
        super().__init__(
            name="LearningRoadmap_Agent",
            description="Generates step-by-step weekly learning roadmaps, skills gap analysis, and deliverables."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_role = context.get("target_role", "Software Engineer")
        experience_level = context.get("experience_level", "Intermediate")
        current_skills = context.get("skills", [])
        duration_weeks = int(context.get("duration_weeks", 6))
        tasks_per_week = int(context.get("tasks_per_week", 3))

        system_prompt = f"""
You are a Principal Engineering Director crafting a personalized, outcome-focused {duration_weeks}-week curriculum for a candidate aiming for "{target_role}" ({experience_level} level).

Current Candidate Skills: {', '.join(current_skills) if current_skills else 'Beginner / General CS'}.

Strict Requirements:
1. Generate EXACTLY {duration_weeks} Weeks (weekNumber: 1 to {duration_weeks}).
2. NO generic or placeholder titles (e.g. NEVER use "Week 1", "Foundations", "Learning"). Use real tech titles like "Advanced Async Programming & Event Loop" or "Distributed Caching with Redis & System Design".
3. Each week MUST contain EXACTLY {tasks_per_week} actionable tasks.
4. Provide precise, specific YouTube search queries for tutorials (e.g. "React useReducer custom hook tutorial 2025").
5. Real estimated hours: Courses (3-8h), Projects (8-20h), Reading (1-4h).

Output JSON strictly matching this schema:
[
    {{
        "weekNumber": 1,
        "theme": "<Descriptive Tech Theme>",
        "tasks": [
            {{
                "id": "w1-t1",
                "title": "<Specific Task Title>",
                "description": "<Max 20 words outcome-focused description>",
                "type": "course",
                "estimatedHours": 5,
                "completed": false,
                "videoQuery": "<Exact YouTube search query>"
            }}
        ]
    }}
]
"""

        user_prompt = f"Generate a {duration_weeks}-week technical learning roadmap for {target_role} ({experience_level} level)."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            parsed = self.clean_json_response(raw_response)
            if isinstance(parsed, list):
                return {"weeklyPlan": parsed}
            return parsed
        except Exception as e:
            logger.error(f"[{self.name}] Error generating roadmap: {e}")
            return {"error": str(e), "agent": self.name}
