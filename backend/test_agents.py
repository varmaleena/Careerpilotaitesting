import asyncio
import sys
from app.agents.supervisor_agent import SupervisorAgent

async def test_multi_agent():
    print("Testing SupervisorAgent orchestrator...", flush=True)
    supervisor = SupervisorAgent()
    
    context = {
        "intent": "resume_check",
        "target_role": "Full Stack Engineer",
        "resume_text": "Experienced software engineer specializing in web application development, API design, and cloud deployments."
    }

    try:
        result = await supervisor.process(context)
        print("SUCCESS! Agent execution completed successfully.", flush=True)
        print(f"Result keys: {list(result.keys())}", flush=True)
    except Exception as e:
        print(f"ERROR executing agent test: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(test_multi_agent())
