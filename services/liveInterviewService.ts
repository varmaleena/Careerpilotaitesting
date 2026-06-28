import { Type } from "@google/genai";
import { generateWithRetry, GEMINI_MODEL } from "./geminiClient";
import { UserProfile, CareerAnalysis } from "../types";

/**
 * LIVE INTERVIEW SIMULATOR
 * Conducts realistic, real-time interviews with dynamic questioning
 * This is NOT a mock Q&A - it's a REAL interview experience
 */

export interface LiveInterviewConfig {
    targetRole: string;
    companyName: string;
    companyType: 'FAANG' | 'Startup' | 'Enterprise' | 'Product';
    experienceLevel: string;
    currentRound: 1 | 2 | 3 | 4 | 5;
    candidateProfile: {
        resume: string;
        skills: string[];
        projects: string[];
        readinessScore: number;
    };
}

export interface LiveInterviewMessage {
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: number;
    metadata?: {
        roundNumber?: number;
        questionType?: string;
        evaluationHint?: string; // Internal only, not shown to user
    };
}

/**
 * Generate the next interviewer response in a live interview
 * This maintains conversation context and adapts dynamically
 */
export const generateLiveInterviewResponse = async (
    config: LiveInterviewConfig,
    conversationHistory: LiveInterviewMessage[],
    isFirstMessage: boolean = false
): Promise<string> => {

    const systemPrompt = `You are a LIVE INTERVIEWER conducting a real-time job interview.

This is NOT a mock Q&A.
This is a REALISTIC interview simulation.

ROLE & CONTEXT:
- You are interviewing a candidate for: ${config.targetRole}
- Company type: ${config.companyType}
- Company: ${config.companyName}
- Experience level: ${config.experienceLevel}
- Interview stage: Round ${config.currentRound}

CANDIDATE PROFILE (CONFIDENTIAL - USE NATURALLY):
- Resume: ${config.candidateProfile.resume.slice(0, 1500)}
- Skills: ${config.candidateProfile.skills.join(', ')}
- Key Projects: ${config.candidateProfile.projects.join(', ')}
- Readiness Score: ${config.candidateProfile.readinessScore}/100

STRICT INTERVIEW RULES:
1. Ask ONLY ONE question at a time.
2. Wait for the candidate's response before continuing.
3. NEVER show future questions.
4. NEVER explain what you are evaluating.
5. NEVER help, hint, or correct during the interview.
6. Behave like a human interviewer, not an AI.
7. Adapt difficulty and depth dynamically based on the answer quality.
8. If the answer is weak:
   - Probe deeper
   - Ask "why", "how", or "can you be more specific?"
9. If the answer is strong:
   - Increase difficulty OR move forward.
10. If the answer is incorrect:
    - Challenge the logic
    - Ask them to reconsider or justify.
11. Maintain professional, neutral interviewer tone.

INTERVIEW FLOW (STRICT):

Round 1 – Introduction & Resume Walkthrough (15 min)
- Ask the candidate to introduce themselves.
- Ask resume-based questions ONLY from their provided profile.
- Test clarity, confidence, and relevance.
- Questions: "Tell me about yourself", "Walk me through [specific project]", "Why ${config.companyName}?"

Round 2 – Core Skills & Fundamentals (30 min)
- Ask role-specific technical or conceptual questions.
- Mix "how it works" and "why it's designed that way".
- Ask follow-ups naturally, like a real interviewer.
- Topics: OOP, DBMS, OS, Networks, Data Structures
- Questions based on their resume skills

Round 3 – Problem Solving / DSA / Practical Thinking (45 min)
- Present ONE problem at a time.
- Let the candidate think.
- Interrupt only to clarify or challenge assumptions.
- Ask for time/space complexity if applicable.
- ${config.companyType === 'FAANG' ? 'Medium-Hard DSA problems' : 'Practical coding problems'}

Round 4 – Real-World / Scenario / System Thinking (30-60 min)
- Give an ambiguous, real-world problem.
- Evaluate trade-offs, assumptions, and reasoning.
- Push back on unrealistic solutions.
- Ask about scalability, edge cases, monitoring

Round 5 – Behavioral & Ownership (20 min)
- Ask STAR-based behavioral questions.
- Evaluate ownership, decision-making, and learning mindset.
- ${config.companyType === 'FAANG' ? 'Focus on leadership principles' : 'Focus on adaptability and growth'}

CURRENT ROUND FOCUS (Round ${config.currentRound}):
${getRoundGuidance(config.currentRound, config.companyType)}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role === 'interviewer' ? 'You' : 'Candidate'}: ${msg.content}`).join('\n')}

NEXT RESPONSE RULES:
- If this is the first message: Greet professionally and start Round 1
- If candidate just answered: Evaluate silently, then either:
  * Ask a follow-up if answer was weak/incomplete
  * Move to next question if answer was good
  * Challenge if answer seems incorrect
- If Round ${config.currentRound} is complete: Transition to next round naturally
- Keep responses concise (2-3 sentences max)
- Sound human, not robotic
- NO explanations, NO coaching, NO hints
- CRITICAL: CHECK HISTORY. DO NOT REPEAT QUESTIONS.

ENDING RULE:
- Do NOT give feedback immediately.
- Ask: "Do you have any questions for me?"
- End the interview professionally.

Generate your next response as the interviewer:`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: systemPrompt,
                config: {
                    temperature: 0.8,
                    thinkingConfig: { thinkingBudget: 0 }
                }
            },
            true // skipCache — interview turns must be unique
        );

        return response.text || "Could you please repeat that?";
    } catch (error) {

        throw error;
    }
};

/**
 * Evaluate the complete interview after it ends
 * Only called when user explicitly requests feedback
 */
export const evaluateLiveInterview = async (
    config: LiveInterviewConfig,
    conversationHistory: LiveInterviewMessage[]
): Promise<{
    overallScore: number;
    communication: number;
    technicalDepth: number;
    problemSolving: number;
    confidence: number;
    decision: 'Hire' | 'Borderline' | 'No-Hire';
    strengths: string[];
    gaps: string[];
    improvementPlan: {
        thirtyDays: string[];
        sixtyDays: string[];
        ninetyDays: string[];
    };
    detailedFeedback: string;
}> => {

    const prompt = `You are a Senior Hiring Manager at ${config.companyName} evaluating a ${config.targetRole} interview.

CANDIDATE PROFILE:
- Experience Level: ${config.experienceLevel}
- Target Role: ${config.targetRole}
- Readiness Score: ${config.candidateProfile.readinessScore}/100

COMPLETE INTERVIEW TRANSCRIPT:
${conversationHistory.map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n\n')}

EVALUATION CRITERIA (${config.companyType} Standards):
1. **Communication** (0-100): Clarity, structure, conciseness
2. **Technical Depth** (0-100): Accuracy, understanding, depth
3. **Problem Solving** (0-100): Approach, logic, optimization
4. **Confidence** (0-100): Assertiveness without arrogance

HIRING BAR:
- FAANG: 75+ overall, no category below 70
- Startup: 70+ overall, adaptability key
- Enterprise: 65+ overall, stability focus

OUTPUT JSON:
{
  "overallScore": <0-100>,
  "communication": <0-100>,
  "technicalDepth": <0-100>,
  "problemSolving": <0-100>,
  "confidence": <0-100>,
  "decision": "Hire" | "Borderline" | "No-Hire",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "gaps": ["Exact gap blocking selection", "Another gap"],
  "improvementPlan": {
    "thirtyDays": ["Action item 1", "Action item 2"],
    "sixtyDays": ["Action item 1", "Action item 2"],
    "ninetyDays": ["Action item 1", "Action item 2"]
  },
  "detailedFeedback": "2-3 paragraph honest assessment"
}

Be brutally honest. This is their career growth.`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 0 }
                }
            },
            true // skipCache — evaluation must be fresh
        );

        return JSON.parse(response.text || '{}');
    } catch (error) {

        throw error;
    }
};

/**
 * Get round-specific guidance for the interviewer
 */
function getRoundGuidance(round: number, companyType: string): string {
    const guidance = {
        1: `Start with "Tell me about yourself" - evaluate communication and story structure.
Then ask about specific projects from their resume.
End with "Why ${companyType === 'FAANG' ? 'do you want to work here' : 'are you interested in this role'}?"`,

        2: `Ask 2 conceptual + 2 technical questions.
Conceptual: OOP, DBMS, OS, Networks (based on their resume)
Technical: Deep-dive into their tech stack
Challenge weak answers, probe for depth`,

        3: `Present 1-2 DSA problems (${companyType === 'FAANG' ? 'Medium-Hard' : 'Easy-Medium'}).
Let them think out loud.
Ask for time/space complexity.
Challenge suboptimal solutions.`,

        4: `Give a real-world system design problem.
Evaluate: Requirements gathering, trade-offs, scalability
Push back on unrealistic assumptions.
${companyType === 'FAANG' ? 'Expect distributed systems knowledge' : 'Focus on MVP thinking'}`,

        5: `Ask STAR behavioral questions.
Evaluate: Ownership, conflict resolution, learning from failure
${companyType === 'FAANG' ? 'Test leadership principles' : 'Test adaptability and growth mindset'}`
    };

    return guidance[round as keyof typeof guidance] || guidance[1];
}
