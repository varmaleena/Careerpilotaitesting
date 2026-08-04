from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from app.services.llm_service import generate_llm_response
from app.services.ml_service import calculate_match_scores

router = APIRouter()

# --- Request Schemas ---

class GenerateRequest(BaseModel):
    model: str = Field(default="gemini-2.5-flash", description="The Gemini model identifier.")
    contents: Any = Field(..., description="The user prompt or conversation messages.")
    config: Optional[Dict[str, Any]] = Field(default=None, description="Optional configuration parameters.")


class MatchRequest(BaseModel):
    resume_text: str = Field(..., description="The full extracted plain text of the resume.")


# --- API Routes ---

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    """
    Generic secure proxy endpoint.
    Appends backend environment credentials and routes the call to Gemini.
    """
    try:
        text = generate_llm_response(
            contents=request.contents,
            model=request.model,
            config_dict=request.config
        )
        return {"text": text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini generation failed: {str(e)}"
        )


@router.post("/jobs/match")
async def match_resume_to_jobs(request: MatchRequest):
    """
    Local Machine Learning Matching Endpoint.
    Calculates TF-IDF vector weights and Cosine Similarity scores
    locally on the backend server with scikit-learn.
    """
    try:
        if not request.resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume content is empty.")
        
        matches = calculate_match_scores(request.resume_text)
        return {
            "success": True,
            "matches": matches
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Local ML Matcher encountered an error: {str(e)}"
        )
