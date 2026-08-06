from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from app.services.llm_service import generate_llm_response
from app.services.ml_service import calculate_match_scores
from app.services.db_service import BackendDatabaseService
from app.services.pdf_parser import extract_text_from_file
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

class UserProfileSaveRequest(BaseModel):
    profile: Dict[str, Any] = Field(..., description="Candidate user profile dictionary.")

class UserDataSaveRequest(BaseModel):
    payload: Any = Field(..., description="Data payload to store under data_type.")


# --- AI & ML API Routes ---

@router.post("/generate")
async def generate_content(request: GenerateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Generic secure proxy endpoint."""
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


@router.post("/resume/upload")
async def upload_and_parse_resume_endpoint(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("Software Engineer"),
    target_companies: Optional[str] = Form("Top Tech Companies"),
    experience_level: Optional[str] = Form("Intermediate"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    High-Speed Server-Side Resume Upload & Analysis Endpoint.
    Parses PDF/DOCX binary on the server using PyMuPDF and executes AI Micro-Agents in parallel.
    """
    try:
        file_bytes = await file.read()
        extracted_text = extract_text_from_file(file_bytes, file.filename)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from uploaded file.")

        context = {
            "resume_text": extracted_text,
            "target_role": target_role,
            "target_companies": target_companies,
            "experience_level": experience_level,
            "user_id": current_user.get("uid")
        }
        result = await resume_agent.process(context)
        result["extracted_text"] = extracted_text
        return result
    except Exception as e:
        logger.error(f"Resume upload endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/match")
async def match_resume_to_jobs(request: MatchRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Local ML Scikit-Learn Vector Similarity Engine."""
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


# --- Database Gateway API Routes ---

@router.get("/user/profile")
async def get_user_profile_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch Candidate Profile from Server DB."""
    uid = current_user.get("uid", "anonymous")
    profile = BackendDatabaseService.get_user_profile(uid)
    return {"success": True, "profile": profile}

@router.post("/user/profile")
async def save_user_profile_endpoint(request: UserProfileSaveRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Save Candidate Profile to Server DB."""
    uid = current_user.get("uid", "anonymous")
    success = BackendDatabaseService.save_user_profile(uid, request.profile)
    return {"success": success}

@router.get("/user/data/{data_type}")
async def get_user_data_endpoint(data_type: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch Candidate State Data (Analysis, Plan, Projects) from Server DB."""
    uid = current_user.get("uid", "anonymous")
    data = BackendDatabaseService.get_user_data(uid, data_type)
    return {"success": True, "data": data}

@router.post("/user/data/{data_type}")
async def save_user_data_endpoint(data_type: str, request: UserDataSaveRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Save Candidate State Data (Analysis, Plan, Projects) to Server DB."""
    uid = current_user.get("uid", "anonymous")
    success = BackendDatabaseService.save_user_data(uid, data_type, request.payload)
    return {"success": success}
