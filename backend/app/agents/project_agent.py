from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class ProjectAgent(BaseAgent):
    """
    Specialized Agent for Designing Enterprise Portfolio Projects with Full Blueprints.
    """

    def __init__(self):
        super().__init__(
            name="PortfolioArchitect_Agent",
            description="Designs real-world, enterprise-ready portfolio projects with architecture blueprints."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_role = context.get("target_role", "Software Engineer")
        experience_level = context.get("experience_level", "Intermediate")
        difficulty = context.get("difficulty", "Intermediate")
        skills = context.get("skills", ["React", "TypeScript", "Node.js", "Python"])

        system_prompt = f"""
You are a Principal Software Architect designing 3 high-impact, resume-defining portfolio projects for a {experience_level} candidate targeting "{target_role}" position.
Difficulty Level: {difficulty}
Current Candidate Skills: {', '.join(skills)}

Strict Guidelines:
- Projects MUST reflect real enterprise engineering problems (e.g., distributed caching, rate-limiting algorithms, vector RAG search, microservices, websockets, asynchronous queues).
- Provide action-oriented user stories and key implementation steps.
- Explain why recruiters at top tech companies will be impressed by this project.

Return JSON strictly matching this schema:
[
    {{
        "title": "<Project Title (Max 5 words)>",
        "difficulty": "{difficulty}",
        "description": "<2 concise sentences highlighting architectural complexity>",
        "techStack": ["<Tech 1>", "<Tech 2>", "<Tech 3>", "<Tech 4>"],
        "userStories": ["<User Story 1>", "<User Story 2>"],
        "keyFeatures": ["<Feature 1>", "<Feature 2>", "<Feature 3>"],
        "resumeValue": "<1 punchy sentence explaining why this impresses tech recruiters>",
        "implementationFlow": ["<Step 1>", "<Step 2>", "<Step 3>", "<Step 4>"],
        "learningOutcomes": ["<Outcome 1>", "<Outcome 2>"],
        "referenceGithubUrl": "https://github.com/search?q=..."
    }}
]
"""

        user_prompt = f"Design 3 production-grade portfolio project blueprints for {target_role} ({difficulty} level)."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            parsed = self.clean_json_response(raw_response)
            if isinstance(parsed, list):
                return {"projects": parsed}
            return parsed
        except Exception as e:
            logger.error(f"[{self.name}] Project generation failed: {e}")
            return {"error": str(e), "agent": self.name}
