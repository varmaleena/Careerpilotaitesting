from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class InterviewAgent(BaseAgent):
    """
    Specialized Agent for Live Mock Interviews & STAR Evaluation.
    Supports real-time conversational exchange and comprehensive session evaluation.
    """

    def __init__(self):
        super().__init__(
            name="MockInterview_Agent",
            description="Generates adaptive interview questions and evaluates user answers using the STAR framework."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        mode = context.get("mode", "generate_response") # 'generate_response' or 'evaluate_session'
        target_role = context.get("target_role", "Software Engineer")
        experience_level = context.get("experience_level", "Intermediate")
        company_type = context.get("company_type", "Product")

        if mode == "generate_response":
            system_prompt = f"""
You are a Principal Engineering Manager at a top {company_type} company conducting a live technical mock interview for a "{target_role}" candidate ({experience_level} level).

Role & Style:
- Professional, sharp, engaging, and direct.
- Ask 1 relevant technical, system design, or behavioral question at a time.
- Keep your response brief (1-3 paragraphs max). Move the conversation forward naturally.
- DO NOT prefix your response with "Interviewer:". Just output the direct conversational response.
"""
            user_prompt = context.get("prompt", f"Start the mock interview for {target_role}.")
            try:
                raw_response = await self.call_llm(
                    prompt=user_prompt,
                    system_instruction=system_prompt,
                    json_output=False
                )
                return {"responseText": raw_response.replace("Interviewer:", "").strip()}
            except Exception as e:
                logger.error(f"[{self.name}] Error generating interview response: {e}")
                return {"responseText": "Could you please elaborate on your experience with building scalable systems?"}

        elif mode == "evaluate_session":
            transcript = context.get("transcript", "")
            system_prompt = f"""
You are an Executive Hiring Committee Leader evaluating a candidate's completed mock interview for "{target_role}".
Analyze the full transcript using the STAR framework (Situation, Task, Action, Result).

Return JSON strictly matching this schema:
{{
    "overallScore": <integer 0 to 100>,
    "verdict": "<Hire | Strong Hire | Weak Hire | No Hire>",
    "technicalRating": <integer 0 to 100>,
    "communicationRating": <integer 0 to 100>,
    "problemSolvingRating": <integer 0 to 100>,
    "detailedFeedback": "<Paragraph summary of candidate performance>",
    "keyStrengths": ["<Strength 1>", "<Strength 2>"],
    "blockingGaps": ["<Gap 1>", "<Gap 2>"],
    "starBreakdown": {{
        "situation": "<Assessment>",
        "task": "<Assessment>",
        "action": "<Assessment>",
        "result": "<Assessment>"
    }},
    "idealSampleAnswer": "<Example of an elite candidate answer for the primary question>"
}}
"""
            user_prompt = f"TARGET ROLE: {target_role}\nINTERVIEW TRANSCRIPT:\n{transcript}"
            try:
                raw = await self.call_llm(prompt=user_prompt, system_instruction=system_prompt, json_output=True)
                return self.clean_json_response(raw)
            except Exception as e:
                logger.error(f"[{self.name}] Error evaluating session: {e}")
                return {"error": str(e), "agent": self.name}
        else:
            return {"error": f"Unknown interview mode: {mode}"}
