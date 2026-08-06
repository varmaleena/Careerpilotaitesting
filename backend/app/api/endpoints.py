from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from app.services.llm_service import generate_llm_response
from app.services.ml_service import calculate_match_scores
from app.agents.resume_agent import ResumeAgent
from app.agents.roadmap_agent import RoadmapAgent
from app.agents.project_agent import ProjectAgent
from app.agents.interview_agent import InterviewAgent
from app.agents.market_agent import MarketAgent
from app.auth import get_current_user
from app.config import logger

router = APIRouter()

# Initialize Backend Specialized Agents
resume_agent = ResumeAgent()
roadmap_agent = RoadmapAgent()
project_agent = ProjectAgent()
interview_agent = InterviewAgent()
market_agent = MarketAgent()


# --- Request Schemas ---

class GenerateRequest(BaseModel):
    model: str = Field(default="gemini-2.5-flash", description="Gemini model identifier.")
    contents: Any = Field(..., description="Prompt payload or contents.")
    config: Optional[Dict[str, Any]] = Field(default=None, description="Generation configuration parameters.")

class MatchRequest(BaseModel):
    resume_text: str = Field(..., description="Extracted plain text of resume.")

class ResumeValidateRequest(BaseModel):
    resume_text: str = Field(..., description="Extracted resume text to validate.")

class ResumeAnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Candidate resume text.")
    target_role: Optional[str] = Field(default="Software Engineer")
    target_companies: Optional[str] = Field(default="Top Tech Companies")
    experience_level: Optional[str] = Field(default="Intermediate")

class RoadmapGenerateRequest(BaseModel):
    target_role: Optional[str] = Field(default="Software Engineer")
    experience_level: Optional[str] = Field(default="Intermediate")
    skills: Optional[List[str]] = Field(default=[])
    duration_weeks: Optional[int] = Field(default=6)

class ProjectGenerateRequest(BaseModel):
    target_role: Optional[str] = Field(default="Software Engineer")
    experience_level: Optional[str] = Field(default="Intermediate")
    difficulty: Optional[str] = Field(default="Intermediate")
    skills: Optional[List[str]] = Field(default=[])

class InterviewChatRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or candidate transcript line.")
    target_role: Optional[str] = Field(default="Software Engineer")
    experience_level: Optional[str] = Field(default="Intermediate")
    company_type: Optional[str] = Field(default="Product")

class InterviewEvaluateRequest(BaseModel):
    transcript: str = Field(..., description="Full mock interview transcript.")
    target_role: Optional[str] = Field(default="Software Engineer")

class MarketInsightsRequest(BaseModel):
    target_role: Optional[str] = Field(default="Software Engineer")
    resume_text: Optional[str] = Field(default="")


# --- API Routes ---

@router.post("/generate")
async def generate_content(request: GenerateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Generic secure proxy endpoint. Appends server environment API credentials safely.
    """
    try:
        text = generate_llm_response(
            contents=request.contents,
            model=request.model,
            config_dict=request.config
        )
        return {"text": text}
    except Exception as e:
        logger.error(f"Generation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini generation error: {str(e)}")


@router.post("/jobs/match")
async def match_resume_to_jobs(request: MatchRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Local ML Scikit-Learn Vector Similarity Engine.
    Calculates TF-IDF Cosine Similarity locally on the backend.
    """
    try:
        if not request.resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text is empty.")
        matches = calculate_match_scores(request.resume_text)
        return {"success": True, "matches": matches}
    except Exception as e:
        logger.error(f"ML Matcher endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Local ML Matcher error: {str(e)}")


@router.post("/resume/validate")
async def validate_resume_endpoint(request: ResumeValidateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Resume Document Classifier Endpoint."""
    try:
        result = await resume_agent.validate_resume(request.resume_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume/analyze")
async def analyze_resume_endpoint(request: ResumeAnalyzeRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Full ATS Score & Skills Gap Analysis Endpoint."""
    try:
        context = request.model_dump()
        context["user_id"] = current_user.get("uid")
        result = await resume_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roadmap/generate")
async def generate_roadmap_endpoint(request: RoadmapGenerateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Structured Learning Plan Endpoint."""
    try:
        context = request.model_dump()
        context["user_id"] = current_user.get("uid")
        result = await roadmap_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/generate")
async def generate_projects_endpoint(request: ProjectGenerateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Enterprise Portfolio Projects Blueprint Endpoint."""
    try:
        context = request.model_dump()
        context["user_id"] = current_user.get("uid")
        result = await project_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview/chat")
async def interview_chat_endpoint(request: InterviewChatRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Real-Time Adaptive Mock Interview Endpoint."""
    try:
        context = request.model_dump()
        context["mode"] = "generate_response"
        context["user_id"] = current_user.get("uid")
        result = await interview_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview/evaluate")
async def interview_evaluate_endpoint(request: InterviewEvaluateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """STAR Framework Interview Session Evaluation Endpoint."""
    try:
        context = request.model_dump()
        context["mode"] = "evaluate_session"
        context["user_id"] = current_user.get("uid")
        result = await interview_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/market/insights")
async def market_insights_endpoint(request: MarketInsightsRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Market Demand & Salary Intelligence Endpoint."""
    try:
        context = request.model_dump()
        context["user_id"] = current_user.get("uid")
        result = await market_agent.process(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
