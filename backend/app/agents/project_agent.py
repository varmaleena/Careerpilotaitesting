from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class ProjectAgent(BaseAgent):
    """
    Specialized Agent for Designing Production-Grade Portfolio Projects.
    """

    def __init__(self):
        super().__init__(
            name="PortfolioArchitect_Agent",
            description="Designs real-world, enterprise-ready portfolio projects with architecture blueprints."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_role = context.get("target_role", "Full Stack Developer")
        experience_level = context.get("experience_level", "Intermediate")
        skills = context.get("skills", ["React", "Node.js", "Python"])

        system_prompt = f"""
You are a Principal Software Architect designing 3 distinct, resume-defining portfolio projects for a {experience_level} candidate aiming for a "{target_role}" position.

Current skills: {', '.join(skills)}.

Ensure the projects reflect real industry challenges (e.g. rate-limiting, microservices, vector search, streaming, high availability).

Output JSON matching this schema:
{{
    "projects": [
        {{
            "id": "<proj-1>",
            "title": "<Project Title>",
            "category": "<System Design | GenAI | Full Stack>",
            "difficulty": "Intermediate | Advanced",
            "summary": "<2-line summary>",
            "techStack": ["<Tech 1>", "<Tech 2>", "<Tech 3>"],
            "keyFeatures": ["<Feature 1>", "<Feature 2>", "<Feature 3>"],
            "architectureOverview": "<Explanation of backend/frontend architecture>",
            "resumeBulletSuggestion": "<Impactful bullet point for resume>"
        }}
    ]
}}
"""

        user_prompt = f"Design 3 standout production-grade portfolio projects for {target_role}."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            return self.clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"[{self.name}] Project generation failed: {e}")
            return {"error": str(e), "agent": self.name}
