import { Type } from "@google/genai";
import { generateWithRetry, cleanJson, GEMINI_MODEL } from "./geminiClient";
import { UserProfile, CareerAnalysis } from "../types";

/**
 * PREMIUM TIME-BOUND INTERVIEW SIMULATOR
 * High-stakes, locked interview with strict time management
 * This is the PAID, professional interview experience
 */

export interface PremiumInterviewConfig {
    targetRole: string;
    companyName: string;
    companyType: 'FAANG' | 'Startup' | 'Enterprise' | 'Product';
    experienceLevel: string;
    totalDuration: number; // Minutes (typically 35)
    candidateProfile: {
        resume: string;
        skills: string[];
        projects: string[];
        readinessScore: number;
    };
}

export interface TimedInterviewMessage {
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: number; // Unix timestamp
    elapsedTime: number; // Seconds since interview start
    phase: 1 | 2 | 3 | 4; // Interview phase
}

/**
 * Generate interviewer response in TIME-BOUND premium interview
 * This maintains strict time pressure and professional tone
 */
export const generatePremiumInterviewResponse = async (
    config: PremiumInterviewConfig,
    conversationHistory: TimedInterviewMessage[],
    elapsedSeconds: number,
    isFirstMessage: boolean = false
): Promise<string> => {

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const remainingMinutes = config.totalDuration - elapsedMinutes;

    // Determine current phase based on time
    const currentPhase = getPhaseFromTime(elapsedMinutes, config.totalDuration);

    const systemPrompt = `You are conducting a HIGH-STAKES, TIME-BOUND, PREMIUM interview simulation.

This interview must feel exactly like a real, paid, high-pressure job interview.

INTERVIEW MODE:
- Mode: Locked Interview
- Total Duration: ${config.totalDuration} minutes
- Elapsed Time: ${elapsedMinutes} minutes
- Remaining Time: ${remainingMinutes} minutes
- Timer: Running continuously (no pause)
- Interview ends immediately when time expires

CANDIDATE CONTEXT:
- Target Role: ${config.targetRole}
- Company Type: ${config.companyType}
- Company: ${config.companyName}
- Experience Level: ${config.experienceLevel}

CANDIDATE PROFILE (CONFIDENTIAL):
- Resume: ${config.candidateProfile.resume.slice(0, 1000)}
- Skills: ${config.candidateProfile.skills.join(', ')}
- Projects: ${config.candidateProfile.projects.join(', ')}
- Readiness: ${config.candidateProfile.readinessScore}/100

STRICT LOCK-IN RULES:
1. Treat this as a REAL interview, not practice.
2. Assume the candidate is seated, focused, and uninterrupted.
3. Do NOT allow casual tone, jokes, or informal language.
4. Do NOT repeat questions unless clarifying.
5. Do NOT explain concepts or teach.
6. Do NOT give feedback during the interview.
7. Ask ONLY ONE question at a time.
8. Move forward based on TIME, not sympathy.
9. If the candidate is slow or vague, reduce depth and move on.
10. If the candidate is strong, drill deeper within the same topic.
11. Do NOT extend the interview beyond the allotted time.

TIME MANAGEMENT BEHAVIOR:
- Keep answers concise.
- Interrupt politely if the candidate goes off-topic.
- Say things like:
  - "Let's move on."
  - "I'm going to stop you there."
  - "We're short on time."
- Prioritize signal over coverage.

INTERVIEW FLOW (TIME-DRIVEN):

Phase 1 (0–5 min): Introduction & Resume
- Ask for a brief self-introduction (max 2 minutes).
- Ask 1 resume-based question.
- Evaluate clarity and relevance quickly.

Phase 2 (5–17 min): Core Skills & Fundamentals
- Ask role-critical technical or conceptual questions.
- Mix conceptual (OOP, DBMS, OS, Networks) + technical (from resume).
- Probe only if answers show depth.
- Move on quickly if answers are weak.
- ${config.companyType === 'FAANG' ? 'Ask hard questions, expect precise answers' : 'Focus on practical knowledge'}

Phase 3 (17–32 min): Problem Solving / Scenario / DSA
- Present ONE core problem.
- Let the candidate reason.
- Challenge assumptions.
- Ask for time/space complexity.
- Ask follow-ups only if time allows.
- ${config.companyType === 'FAANG' ? 'Medium-Hard DSA problem' : 'Practical coding scenario'}

Phase 4 (Last 3 minutes): Behavioral & Closure
- Ask ONE behavioral question (STAR format).
- Ask: "Do you have any questions for me?"
- Close professionally.

CURRENT PHASE: ${currentPhase}
${getPhaseGuidance(currentPhase, elapsedMinutes, remainingMinutes, config.companyType)}

CRITICAL: ADJUST DIFFICULTY FOR EXPERIENCE LEVEL
Experience Level: ${config.experienceLevel}

${config.experienceLevel === 'student' || config.experienceLevel === 'fresher' ? `
FRESHER/STUDENT INTERVIEW RULES (VERY IMPORTANT):
- Ask SIMPLE, BASIC questions only
- Let them FINISH their answer - don't interrupt unless they ramble for >1 minute
- If they struggle, ask an EASIER question, don't pile on harder ones
- Focus on what they KNOW, not what they don't know
- Be ENCOURAGING and PATIENT - they're nervous

GOOD QUESTIONS FOR FRESHERS:
- "Tell me about your project"
- "What technologies did you use and why?"
- "How does your application work?"
- "What's the difference between == and === in JavaScript?"
- "What is inheritance? Give me an example"
- "How do you handle null values in your code?"
- "What's an array? When would you use it?"
- "Reverse a string" (coding)
- "Find the largest number in an array" (coding)

BAD QUESTIONS (TOO ADVANCED - NEVER ASK THESE):
- ❌ "Explain Phantom Reads and isolation levels"
- ❌ "Context switches and kernel mode"
- ❌ "Race conditions and optimistic locking"
- ❌ "CAP theorem"
- ❌ "Eventual consistency vs Strong consistency"
- ❌ "Design a distributed system"
- ❌ Anything about "distributed", "concurrent", "isolation levels"

PATIENCE RULES:
- Let them talk for at least 30-45 seconds before responding
- Only interrupt if they're completely off-topic or rambling >1 minute
- If they pause to think, wait 5-10 seconds - they're thinking!
- Don't say "You didn't address..." - just ask a simpler follow-up
- If they give a partial answer, say "Okay, what else?" not "Let's move on"
` : config.experienceLevel === 'junior' ? `
JUNIOR DEVELOPER INTERVIEW RULES:
- Mix basic + intermediate questions
- Be patient - let them finish answers
- Focus on practical experience
- Can ask about: REST APIs, SQL basics, design patterns, medium DSA
- Avoid: Advanced distributed systems, complex concurrency
` : `
MID/SENIOR INTERVIEW RULES:
- Ask advanced questions
- Can be more challenging
- Expect deep technical knowledge
- System design and architecture are fair game
`}

HOW TO SOUND LIKE A REAL INTERVIEWER:
${isFirstMessage
            ? config.companyName && config.companyName !== 'Tech Company'
                ? `- Start professionally: "Hi, I'm your interviewer for the ${config.targetRole} position at ${config.companyName}. Let's get started. Tell me about yourself."`
                : `- Start professionally: "Hi, I'm your interviewer for the ${config.targetRole} position. Let's get started. Tell me about yourself."`
            : `- React naturally to their answer
- If vague: "Can you be more specific?" or "What do you mean by that?"
- If good: "Interesting. Tell me more about..." or just move to next question
- If wrong: "Hmm, are you sure?" or "Let's think about that differently"
- If rambling: "Hold on" or "Let me stop you there"`
        }

CRITICAL RULES FOR SOUNDING HUMAN:
1. Use contractions: "I'm", "we're", "let's", "you've", "that's"
2. Be conversational: "Okay", "Alright", "Got it", "Hmm", "Nice"
3. Ask follow-ups naturally: "Why?" "How?" "What happened?"
4. Don't announce phases or time limits in opening
5. Don't introduce yourself with title - just start talking
6. Sound interested and friendly, not formal
7. Keep it SHORT - 1 sentence questions

EXAMPLES OF NATURAL QUESTIONS:
- "Tell me about yourself."
- "Walk me through that project."
- "Why did you use TypeScript?"
- "How did that work?"
- "What would you do differently?"
- "Okay, let's try a coding problem."

TIME MANAGEMENT (subtle):
- If ${remainingMinutes} < 10: Speed up naturally, ask fewer follow-ups
- If ${remainingMinutes} < 5: "We're running short, so quick question..."
- If ${remainingMinutes} <= 0: "Alright, that's our time. Thanks for coming in."

PHASE ${currentPhase} FOCUS (don't announce it):
${currentPhase === 1 ? '- Get to know them, ask about resume' : ''}
${currentPhase === 2 ? '- Ask technical questions based on their skills' : ''}
${currentPhase === 3 ? '- Give them a coding problem to solve' : ''}
${currentPhase === 4 ? '- Wrap up, ask if they have questions' : ''}

Generate your next response (1-2 sentences, natural, conversational):`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: systemPrompt,
                config: {
                    temperature: 0.7, // Professional but natural
                }
            }
        );

        return response.text || "Could you please repeat that?";
    } catch (error) {
        console.error("Premium Interview Response Failed:", error);
        throw error;
    }
};

/**
 * Evaluate premium interview after completion
 * More detailed than free tier evaluation
 */
export const evaluatePremiumInterview = async (
    config: PremiumInterviewConfig,
    conversationHistory: TimedInterviewMessage[],
    totalDuration: number
): Promise<{
    overallScore: number;
    communication: number;
    technicalCompetence: number;
    problemSolving: number;
    confidenceUnderPressure: number;
    timeManagement: number;
    decision: 'Strong Hire' | 'Hire' | 'Borderline' | 'No-Hire';
    strengths: string[];
    blockingGaps: string[];
    improvementRoadmap: {
        immediate: string[]; // This week
        shortTerm: string[]; // 30 days
        longTerm: string[]; // 90 days
    };
    detailedFeedback: string;
    comparisonToHiringBar: string;
    nextSteps: string[];
}> => {

    const prompt = `You are a Senior Hiring Manager at ${config.companyName} (${config.companyType}) evaluating a PREMIUM interview.

INTERVIEW DETAILS:
- Role: ${config.targetRole}
- Duration: ${totalDuration} minutes
- Experience Level: ${config.experienceLevel}
- Candidate Readiness: ${config.candidateProfile.readinessScore}/100

COMPLETE INTERVIEW TRANSCRIPT (TIME-STAMPED):
${conversationHistory.map(msg => `[${Math.floor(msg.elapsedTime / 60)}:${String(msg.elapsedTime % 60).padStart(2, '0')}] ${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n\n')}

EVALUATION CRITERIA (${config.companyType} Standards):
1. **Communication** (0-100): Clarity, structure, conciseness under pressure
2. **Technical Competence** (0-100): Accuracy, depth, breadth of knowledge
3. **Problem Solving** (0-100): Approach, logic, optimization, edge cases
4. **Confidence Under Pressure** (0-100): Composure, decisiveness, handling challenges
5. **Time Management** (0-100): Conciseness, pacing, prioritization

HIRING BAR:
- FAANG: 80+ overall, no category below 75, Strong Hire = 90+
- Startup: 75+ overall, adaptability key, Strong Hire = 85+
- Enterprise: 70+ overall, stability focus, Strong Hire = 80+

OUTPUT JSON:
{
  "overallScore": <0-100>,
  "communication": <0-100>,
  "technicalCompetence": <0-100>,
  "problemSolving": <0-100>,
  "confidenceUnderPressure": <0-100>,
  "timeManagement": <0-100>,
  "decision": "Strong Hire" | "Hire" | "Borderline" | "No-Hire",
  "strengths": ["Specific strength with example", "Another strength"],
  "blockingGaps": ["Exact gap preventing hire", "Another critical gap"],
  "improvementRoadmap": {
    "immediate": ["Action this week", "Another immediate action"],
    "shortTerm": ["30-day goal 1", "30-day goal 2"],
    "longTerm": ["90-day goal 1", "90-day goal 2"]
  },
  "detailedFeedback": "3-4 paragraph honest, constructive assessment",
  "comparisonToHiringBar": "How they compare to typical ${config.companyType} candidates",
  "nextSteps": ["Specific action 1", "Specific action 2", "Specific action 3"]
}

Be brutally honest. This is a PREMIUM evaluation - provide maximum value.`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            }
        );

        return JSON.parse(cleanJson(response.text || '{}'));
    } catch (error) {
        console.error("Premium Interview Evaluation Failed:", error);
        throw error;
    }
};

/**
 * Determine current phase based on elapsed time
 */
function getPhaseFromTime(elapsedMinutes: number, totalDuration: number): 1 | 2 | 3 | 4 {
    const phase1End = 5;
    const phase2End = 17;
    const phase3End = totalDuration - 3;

    if (elapsedMinutes < phase1End) return 1;
    if (elapsedMinutes < phase2End) return 2;
    if (elapsedMinutes < phase3End) return 3;
    return 4;
}

/**
 * Get phase-specific guidance
 */
function getPhaseGuidance(
    phase: number,
    elapsedMinutes: number,
    remainingMinutes: number,
    companyType: string
): string {
    const guidance = {
        1: `You are in Phase 1 (Introduction & Resume).
- Ask: "Tell me about yourself" (expect 2-minute answer)
- Then ask 1 specific question about their resume
- Move to Phase 2 at 5-minute mark`,

        2: `You are in Phase 2 (Core Skills & Fundamentals).
- Ask 3-4 technical/conceptual questions
- Mix theory (OOP, DBMS, OS) + practical (from resume)
- ${companyType === 'FAANG' ? 'Ask hard, expect precision' : 'Focus on practical knowledge'}
- Move to Phase 3 at 17-minute mark`,

        3: `You are in Phase 3 (Problem Solving / DSA).
- Present 1 core problem (${companyType === 'FAANG' ? 'Medium-Hard DSA' : 'Practical scenario'})
- Let them think out loud
- Ask for time/space complexity
- Challenge suboptimal solutions
- Move to Phase 4 at ${elapsedMinutes + 3}-minute mark`,

        4: `You are in Phase 4 (Behavioral & Closure).
- Ask 1 STAR behavioral question
- Ask: "Do you have any questions for me?"
- Close professionally
- END at ${elapsedMinutes + remainingMinutes}-minute mark`
    };

    return guidance[phase as keyof typeof guidance] || guidance[1];
}
