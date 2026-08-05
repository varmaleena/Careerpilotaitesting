from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.config import logger

class InterviewAgent(BaseAgent):
    """
    Specialized Agent for Conducting AI Mock Interviews & Scoring Candidate Responses.
    """

    def __init__(self):
        super().__init__(
            name="MockInterview_Agent",
            description="Generates adaptive interview questions and evaluates user answers using the STAR method."
        )

    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_role = context.get("target_role", "Software Engineer")
        company = context.get("company", "Tech Enterprise")
        mode = context.get("mode", "generate_questions") # 'generate_questions' or 'evaluate_answer'

        if mode == "evaluate_answer":
            question = context.get("question", "")
            user_answer = context.get("user_answer", "")

            system_prompt = """
You are a Lead Hiring Manager evaluating a candidate's answer using the STAR (Situation, Task, Action, Result) Framework.
Provide constructive scoring (0-100), key strengths, missed opportunity points, and an improved sample response.

Return JSON:
{
    "score": <number 0-100>,
    "starEvaluation": {
        "situation": "<Assessment>",
        "task": "<Assessment>",
        "action": "<Assessment>",
        "result": "<Assessment>"
    },
    "feedback": "<General constructive feedback>",
    "improvedResponse": "<Example of an elite answer>"
}
"""
            user_prompt = f"QUESTION: {question}\nCANDIDATE ANSWER: {user_answer}"
        else:
            system_prompt = f"""
You are a Principal Engineering Manager at {company} preparing a targeted mock interview for a "{target_role}" role.
Generate 5 diverse questions (2 System Design/Architecture, 2 Behavioral, 1 Technical Deep-Dive).

Return JSON:
{{
    "interviewId": "<uuid>",
    "targetRole": "{target_role}",
    "company": "{company}",
    "questions": [
        {{
            "id": 1,
            "category": "System Design | Technical | Behavioral",
            "question": "<Question Text>",
            "keyPointsToLookFor": ["<Point 1>", "<Point 2>"]
        }}
    ]
}}
"""
            user_prompt = f"Generate 5 mock interview questions for {target_role} at {company}."

        try:
            raw_response = await self.call_llm(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_output=True
            )
            return self.clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"[{self.name}] Interview process error: {e}")
            return {"error": str(e), "agent": self.name}
