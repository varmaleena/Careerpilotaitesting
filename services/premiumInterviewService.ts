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
- **ACKNOWLEDGE** every answer briefly before proceeding
- **PROBE DEEPER** on interesting points they mention (ask 1-2 follow-ups)
- **REFERENCE** specific details from their answer to show you're listening
- If answer is weak, ask a clarifying question before moving on
- NEVER say just "Alright, let's move on" without context
- Instead say things like:
  - "Interesting approach with [specific detail]. How did you handle [related challenge]?"
  - "You mentioned [X]. Can you elaborate on why you chose that over [Y]?"
  - "That makes sense. Let me dig deeper into [specific aspect]..."
  - "Got it. Now, building on that, [follow-up question]"
- Only after 2-3 exchanges on a topic, transition with:
  - "Great. Let's shift gears and talk about [new topic]."
  - "Thanks for that. I'd like to explore [different area] now."

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
- Ask SIMPLE, BASIC questions only, BUT include modern basics.
- MANDATORY TOPICS: Basics of Git, Cloud (AWS/Azure concepts), and CI/CD (GitHub Actions concepts). 
- Let them FINISH their answer - don't interrupt unless they ramble for >1 minute.
- If they struggle, ask an EASIER question, don't pile on harder ones.
- Focus on what they KNOW, not what they don't know.
- Be ENCOURAGING and PATIENT - they're nervous.

GOOD QUESTIONS FOR FRESHERS:
- "Tell me about your project"
- "What technologies did you use and why?"
- "What is Git? Why do we use it?"

SERVICE-BASED SPECIFIC (TCS, Infosys, Wipro, etc.):
- Ask DEFINITIONAL questions: "What is Cloud Computing?", "What is an LLM/AI?", "What is Big Data?", "What is SDLC?".
- Focus on textbook definitions and general awareness.

CODING PROBLEM SELECTION (CRITICAL):
- IF Service-Based Company (TCS, Infosys, Wipro, etc.): Ask EASY LeetCode (e.g., Reverse String, Palindrome, Fibonacci, Array Max).
- IF Product-Based/FAANG (Google, Amazon, Startup, etc.): Ask MEDIUM DSA (e.g., Trees, Graphs, HashMaps, Sliding Window).

BAD QUESTIONS (TOO ADVANCED - NEVER ASK THESE):
- ❌ "Explain Phantom Reads and isolation levels"
- ❌ "Context switches and kernel mode"
- ❌ "Race conditions and optimistic locking"
- ❌ "Designing a Scalable Distributed System"
- ❌ "CAP theorem deep dive"

PATIENCE RULES:
- Let them talk for at least 30-45 seconds before responding
- Only interrupt if they're completely off-topic or rambling >1 minute
- If they pause to think, wait 5-10 seconds - they're thinking!
` : config.experienceLevel === 'junior' ? `
JUNIOR DEVELOPER INTERVIEW RULES:
- Mix basic + intermediate questions.
- MUST ASK: Git workflows, Cloud basics (S3, EC2 concepts), API design (REST).
- Coding: Medium LeetCode (Arrays, Strings, HashMaps).
- Be patient - let them finish answers.
- Focus on practical experience and project depth.
` : `
MID/SENIOR INTERVIEW RULES:
- Ask ADVANCED questions.
- MUST ASK: System Design, Scalability, Database Internal, Cloud Architecture.
- Coding: Hard LeetCode or System Design scenario.
- Expect deep technical knowledge and trade-off discussions.
- System design and architecture are fair game.
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

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n')}

INSTRUCTION:
Review the conversation history above. 
1. identifying what has ALREADY been asked.
2. Formulate a NEW question or response.
3. NEVER repeat a question that has been asked before.
4. If the candidate ignored a previous question, you may re-ask it ONCE, then move on.

Generate your next response (Keep it professional, concise, and moving forward):`;

    try {
        // skipCache=true: interview responses must be unique per turn, never reuse cached output
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: systemPrompt,
                config: {
                    temperature: 0.7,
                }
            },
            true // skipCache
        );

        // Strip "Interviewer:" prefix if AI adds it (prevents duplication in UI)
        let responseText = response.text || "Could you please repeat that?";
        responseText = responseText.replace(/^(Interviewer:\s*|Interviewer\s*:\s*)/i, '').trim();

        return responseText;
    } catch (error) {

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

    const prompt = `You are a Senior Interview Coach helping a candidate improve their interview skills for ${config.companyName} (${config.companyType}).

Your goal is to provide ACTIONABLE, SPECIFIC, and ENCOURAGING feedback that helps them grow, not to judge them.

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

READINESS LEVELS (NOT HIRE/NO-HIRE):
- Strong Hire (90+): Ready to ace interviews at this level
- Hire (75-89): Solid foundation, minor improvements needed
- Borderline (60-74): Needs focused practice in key areas
- No-Hire (<60): Significant skill gaps, needs structured preparation

OUTPUT JSON (CANDIDATE-FOCUSED COACHING TONE):
{
  "overallScore": <0-100>,
  "communication": <0-100>,
  "technicalCompetence": <0-100>,
  "problemSolving": <0-100>,
  "confidenceUnderPressure": <0-100>,
  "timeManagement": <0-100>,
  "decision": "Strong Hire" | "Hire" | "Borderline" | "No-Hire",
  "strengths": ["What you did really well (with specific example)", "Another strength"],
  "blockingGaps": ["Skill gap holding you back (with why it matters)", "Another critical gap"],
  "improvementRoadmap": {
    "immediate": ["Concrete action you can take this week", "Another quick win"],
    "shortTerm": ["30-day practice goal with resources", "Another 30-day goal"],
    "longTerm": ["90-day mastery goal", "Another long-term goal"]
  },
  "detailedFeedback": "3-4 paragraphs of COACHING feedback. Start with what they did well, then areas for growth, then encouragement. Use 'you' language. Be specific with examples from the transcript. Sound like a mentor, not a judge.",
  "comparisonToHiringBar": "Where you stand compared to typical ${config.companyType} candidates at your level, and what you need to bridge the gap",
  "nextSteps": ["Specific resource or practice action", "Another actionable step", "One more concrete next step"]
}

STUDENT/FRESHER EVALUATION CONTEXT:
- If Experience Level is 'Student' or 'Fresher', evaluate based on POTENTIAL and FOUNDATIONS.
- Do NOT penalize for lack of advanced industry experience (System Design, CI/CD).
- Focus on: Logic, CS Fundamentals (DSA, OOP), Communication, and Learning Attitude.
- Tone: Be constructive and educational. Explain WHY a gap is important and HOW to fix it.
- In 'blockingGaps', focus on foundational holes (e.g., "Need stronger grasp of recursion - practice 10 easy problems on LeetCode") rather than experience gaps.

IF DATA IS LIMITED/INTERVIEW CUT SHORT:
- If the transcript is very short (e.g., only 1-2 exchanges), explicitly state that "We didn't get to see your full technical abilities in this session" in the detailedFeedback.
- Assign scores based ONLY on what was observed (e.g., if only intro was done, score Communication/Confidence, but mark Technical/Problem Solving as lower with note "Not enough data").
- In 'blockingGaps', list "Interview ended early - couldn't assess [X]" rather than assuming weakness.
- Do NOT hallucinate technical skills if none were shown.

Be constructively honest to maximize learning. Frame everything as growth opportunities, not failures.`;

    try {
        // skipCache=true: evaluation must reflect the actual conversation, not a cached result
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            },
            true // skipCache
        );

        return JSON.parse(cleanJson(response.text || '{}'));
    } catch (error) {

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
