import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from sse_starlette.sse import EventSourceResponse

from app.agents.supervisor_agent import SupervisorAgent
from app.config import logger

router = APIRouter()
supervisor = SupervisorAgent()

class OrchestrationRequest(BaseModel):
    intent: str = Field(default="full_career_analysis", description="The request intent e.g. full_career_analysis, resume_check, generate_plan, generate_projects, mock_interview, job_match")
    target_role: Optional[str] = Field(default="Software Engineer", description="Candidate target role")
    target_companies: Optional[str] = Field(default="Top Tech Enterprises", description="Target companies")
    experience_level: Optional[str] = Field(default="Intermediate", description="Experience level")
    resume_text: Optional[str] = Field(default="", description="Extracted resume text")
    skills: Optional[List[str]] = Field(default=[], description="List of user skills")
    duration_weeks: Optional[int] = Field(default=6, description="Duration in weeks for roadmap")
    extra_context: Optional[Dict[str, Any]] = Field(default={}, description="Additional parameters")

@router.post("/orchestrate")
async def orchestrate_multi_agent(request: OrchestrationRequest):
    """
    Primary REST endpoint for Python Multi-Agent Orchestration.
    Delegates task execution to SupervisorAgent.
    """
    try:
        context = request.model_dump()
        if request.extra_context:
            context.update(request.extra_context)

        logger.info(f"Received Orchestration request for intent: '{request.intent}'")
        result = await supervisor.process(context)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Multi-Agent Orchestration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Orchestration Error: {str(e)}")

@router.get("/stream")
async def stream_multi_agent(intent: str = "full_career_analysis", target_role: str = "Software Engineer"):
    """
    Server-Sent Events (SSE) streaming endpoint for live agent status updates.
    """
    async def event_generator():
        yield {
            "event": "agent_start",
            "data": json.dumps({"agent": "Supervisor_Coordinator", "status": "Decomposing task intent...", "intent": intent})
        }
        await asyncio.sleep(0.5)

        yield {
            "event": "agent_progress",
            "data": json.dumps({"agent": "ResumeATS_Agent", "status": "Calculating ATS compatibility score..."})
        }
        await asyncio.sleep(0.8)

        yield {
            "event": "agent_progress",
            "data": json.dumps({"agent": "LearningRoadmap_Agent", "status": "Building structured weekly roadmap..."})
        }
        await asyncio.sleep(0.8)

        yield {
            "event": "agent_progress",
            "data": json.dumps({"agent": "MarketIntelligence_Agent", "status": "Running TF-IDF ML vector matcher..."})
        }
        await asyncio.sleep(0.8)

        # Execute final orchestration
        context = {"intent": intent, "target_role": target_role}
        final_data = await supervisor.process(context)

        yield {
            "event": "agent_complete",
            "data": json.dumps({"agent": "Supervisor_Coordinator", "status": "Execution complete", "result": final_data})
        }

    return EventSourceResponse(event_generator())
