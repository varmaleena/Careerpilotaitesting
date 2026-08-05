import asyncio
from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.agents.resume_agent import ResumeAgent
from app.agents.roadmap_agent import RoadmapAgent
from app.agents.project_agent import ProjectAgent
from app.agents.interview_agent import InterviewAgent
from app.agents.market_agent import MarketAgent
from app.config import logger

class SupervisorAgent(BaseAgent):
    """
    Supervisor / Coordinator Agent.
    Decomposes incoming requests, delegates tasks to sub-agents,
    synthesizes outputs, and enforces quality contracts.
    """

    def __init__(self):
        super().__init__(
            name="Supervisor_Coordinator",
            description="Central orchestrator for routing, multi-agent delegation, and output aggregation."
        )
        self.resume_agent = ResumeAgent()
        self.roadmap_agent = RoadmapAgent()
        self.project_agent = ProjectAgent()
        self.interview_agent = InterviewAgent()
        self.market_agent = MarketAgent()

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        intent = context.get("intent", "full_career_analysis")
        logger.info(f"[{self.name}] Processing intent: '{intent}'")

        if intent == "resume_check":
            return await self.resume_agent.process(context)
        elif intent == "generate_plan":
            return await self.roadmap_agent.process(context)
        elif intent == "generate_projects":
            return await self.project_agent.process(context)
        elif intent == "mock_interview":
            return await self.interview_agent.process(context)
        elif intent == "job_match":
            return await self.market_agent.process(context)
        elif intent == "full_career_analysis":
            # Multi-Agent Parallel Orchestration
            logger.info(f"[{self.name}] Triggering multi-agent parallel graph (Resume + Roadmap + Projects + Market)")
            results = await asyncio.gather(
                self.resume_agent.process(context),
                self.roadmap_agent.process(context),
                self.project_agent.process(context),
                self.market_agent.process(context),
                return_exceptions=True
            )

            resume_res = results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])}
            roadmap_res = results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])}
            project_res = results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])}
            market_res = results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])}

            return {
                "orchestration_type": "multi_agent_parallel",
                "target_role": context.get("target_role", "Software Engineer"),
                "resume_analysis": resume_res,
                "learning_roadmap": roadmap_res,
                "portfolio_projects": project_res,
                "market_intelligence": market_res
            }
        else:
            return {"error": f"Unknown intent '{intent}' passed to SupervisorAgent."}
