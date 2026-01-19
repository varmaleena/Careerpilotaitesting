
import { Type } from "@google/genai";
import { ChatMessage, InterviewFeedback, UserProfile, CareerAnalysis } from "../types";
import { getAiInstance, cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";
import axios from "axios";

const INTERVIEW_API_URL = "https://api.example.com/interview";

/**
 * Custom Chat Wrapper that uses our load balancer
 * The native ai.chats.create() bypasses our queue, so we implement our own
 */
class LoadBalancedChat {
    private history: ChatMessage[] = [];
    private systemInstruction: string;

    constructor(systemInstruction: string) {
        this.systemInstruction = systemInstruction;
    }

    async sendMessage(params: { message: string }): Promise<{ text: string }> {
        // Add user message to history
        this.history.push({
            id: Date.now().toString(),
            role: 'user',
            text: params.message,
            timestamp: Date.now()
        });

        // Build the conversation context
        const conversationContext = `${this.systemInstruction}\n\nConversation History:\n${this.history.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n')
            }\n\nRespond as the Interviewer:`;

        // Use our load-balanced generateWithRetry
        const response = await generateWithRetry(GEMINI_MODEL, {
            contents: conversationContext,
            config: {}
        });

        const responseText = response.text || "I didn't catch that. Could you please repeat?";

        // Add model response to history
        this.history.push({
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now()
        });

        return { text: responseText };
    }
}

/**
 * Context-Aware Interview Question Generator
 * Generates personalized interview questions based on:
 * - User's resume and experience
 * - Target role and companies
 * - Experience level (student/fresher/mid/senior)
 * - Current readiness score
 */

export interface InterviewQuestion {
    id: string;
    type: 'behavioral' | 'technical' | 'dsa' | 'system-design' | 'project' | 'conceptual';
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    context?: string; // Why this question is relevant
    expectedKeyPoints?: string[]; // What interviewer wants to hear
    followUps?: string[]; // Potential follow-up questions
    topic?: string; // e.g., "OOP", "Databases", "Networking", "OS"
}

export interface InterviewRound {
    roundName: string;
    duration: string; // e.g., "15 minutes"
    questions: InterviewQuestion[];
    tips: string[];
}

/**
 * Generate a structured interview plan (InterviewRound[])
 * This uses the JSON-based generation approach.
 */
export const generatePersonalizedInterview = async (
    userProfile: UserProfile,
    analysis: CareerAnalysis,
    targetCompany?: string
): Promise<InterviewRound[]> => {

    const company = targetCompany || userProfile.targetCompanies?.split(',')[0]?.trim() || 'Top Tech Company';
    const experienceLevel = userProfile.experienceLevel || 'fresher';
    const targetRole = userProfile.targetRole;

    // Determine interview structure based on experience level
    const interviewStructure = getInterviewStructure(experienceLevel);

    const prompt = `You are a Senior Hiring Manager at ${company} conducting a ${targetRole} interview.

CANDIDATE PROFILE:
- Role: ${targetRole}
- Experience: ${experienceLevel}
- Graduation Year: ${userProfile.graduationYear || 'Recent'}
- Target Companies: ${userProfile.targetCompanies || company}
- Readiness Score: ${analysis.readinessScore}/100
- Key Skills: ${analysis.skills.filter(s => s.status === 'acquired').map(s => s.name).join(', ')}
- Resume Summary: ${userProfile.resumeText?.slice(0, 1000) || 'Entry-level candidate'}

INTERVIEW STRUCTURE:
${interviewStructure}

COMPANY CONTEXT (${company}):
${getCompanyContext(company)}

GENERATE A REALISTIC ${company.toUpperCase()} INTERVIEW:

RULES:
1. **Resume-Based Questions**: Ask about specific projects/experiences from their resume
2. **Company-Specific**: Use ${company}'s actual interview style and difficulty
3. **Progressive Difficulty**: Start easy, increase complexity
4. **Realistic Follow-ups**: Include natural follow-up questions
5. **Conceptual Questions**: CS fundamentals (OOP, DBMS, OS, Networks, DS)
6. **DSA Relevance**: For tech roles, ask DSA questions matching ${company}'s patterns
7. **System Design**: Only if experience level is mid/senior

OUTPUT JSON ARRAY OF ROUNDS:
[
  {
    "roundName": "Round 1: Behavioral & Introduction",
    "duration": "15 minutes",
    "questions": [
      {
        "id": "q1",
        "type": "behavioral",
        "difficulty": "easy",
        "question": "Tell me about yourself and why you want to join ${company}.",
        "context": "Standard opener - sets the tone",
        "expectedKeyPoints": ["Background", "Relevant experience", "Why ${company}", "Career goals"],
        "followUps": ["What specifically excites you about our products?"]
      }
    ],
    "tips": ["Be concise (2-3 minutes)", "Connect your story to ${company}'s mission"]
  }
]

QUESTION DISTRIBUTION:
- Round 1 (15 min): 3 behavioral questions (Tell me about yourself, Why ${company}, Past project)
- Round 2 (30 min): 2 conceptual + 2 technical questions
  * Conceptual: OOP (polymorphism, inheritance), DBMS (indexing, normalization), OS (threads, processes), Networks (TCP/IP, HTTP)
  * Technical: Based on resume skills and ${targetRole}
- Round 3 (45 min): 2 DSA problems (${company}-style, ${experienceLevel} difficulty)
${experienceLevel !== 'student' && experienceLevel !== 'fresher' ? '- Round 4 (30 min): 1 System Design question' : ''}

CONCEPTUAL TOPICS TO COVER (based on ${targetRole}):
- OOP: Classes, Inheritance, Polymorphism, Encapsulation, Abstraction
- DBMS: Normalization, Indexing, ACID, Transactions, SQL vs NoSQL
- OS: Processes, Threads, Deadlock, Memory Management, Scheduling
- Networks: OSI Model, TCP/IP, HTTP/HTTPS, REST APIs
- Data Structures: Arrays, LinkedList, Trees, Graphs, Hash Tables

Make it feel like a REAL ${company} interview. Use their actual question patterns.`;

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

        const rounds = JSON.parse(response.text || '[]');
        return rounds as InterviewRound[];
    } catch (error) {
        console.error("Interview Generation Failed:", error);
        throw error;
    }
};

/**
 * Evaluate user's answer to an interview question
 */
export const evaluateAnswer = async (
    question: InterviewQuestion,
    userAnswer: string,
    userProfile: UserProfile,
    targetCompany: string
): Promise<{
    score: number; // 0-10
    feedback: string;
    strengths: string[];
    improvements: string[];
    idealAnswer: string;
}> => {

    const prompt = `You are a ${targetCompany} Senior Interviewer evaluating a ${userProfile.targetRole} candidate.

QUESTION (${question.type}):
"${question.question}"

CANDIDATE'S ANSWER:
"${userAnswer}"

EXPECTED KEY POINTS:
${question.expectedKeyPoints?.join('\n- ') || 'N/A'}

EVALUATION CRITERIA:
1. **Relevance** (30%): Did they answer the question?
2. **Depth** (25%): Technical accuracy and detail
3. **Structure** (20%): Clear communication (STAR for behavioral)
4. **Company Fit** (15%): Alignment with ${targetCompany} values
5. **Confidence** (10%): Assertiveness without arrogance

OUTPUT JSON:
{
  "score": <0-10>,
  "feedback": "2-3 sentence overall assessment",
  "strengths": ["What they did well", "Another strength"],
  "improvements": ["What to improve", "Another area"],
  "idealAnswer": "Example of a strong answer (2-3 sentences)"
}

Be constructive but honest. This is practice, so help them improve.`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL, // Switched to GEMINI_MODEL constant for consistency
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            }
        );

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Answer Evaluation Failed:", error);
        throw error;
    }
};

/**
 * Get interview structure based on experience level
 */
function getInterviewStructure(level: string): string {
    const structures = {
        student: `
      - Round 1: Behavioral (15 min) - Basics, motivation, projects
      - Round 2: Technical Fundamentals (30 min) - Core CS concepts
      - Round 3: Easy DSA (45 min) - Arrays, strings, basic algorithms
    `,
        fresher: `
      - Round 1: Behavioral (15 min) - Tell me about yourself, why this company
      - Round 2: Technical (30 min) - Resume deep-dive, tech stack questions
      - Round 3: DSA (45 min) - 2 medium problems (arrays, trees, graphs)
    `,
        junior: `
      - Round 1: Behavioral (15 min) - Past experiences, conflict resolution
      - Round 2: Technical (30 min) - Architecture, best practices
      - Round 3: DSA (45 min) - 1 medium + 1 hard problem
      - Round 4: System Design (30 min) - Design a simple system (URL shortener)
    `,
        mid: `
      - Round 1: Behavioral (15 min) - Leadership, impact stories
      - Round 2: Technical (30 min) - Advanced concepts, trade-offs
      - Round 3: DSA (45 min) - 2 hard problems with optimization
      - Round 4: System Design (45 min) - Design scalable system (Twitter, Netflix)
    `,
        senior: `
      - Round 1: Behavioral (20 min) - Leadership at scale, strategic thinking
      - Round 2: Technical (30 min) - Architecture decisions, tech debt
      - Round 3: DSA (30 min) - 1 hard problem (focus on optimization)
      - Round 4: System Design (60 min) - Complex distributed system
      - Round 5: Bar Raiser (30 min) - Culture fit, long-term thinking
    `
    };

    return structures[level as keyof typeof structures] || structures.fresher;
}

/**
 * Get company-specific interview context
 */
function getCompanyContext(company: string): string {
    const companyLower = company.toLowerCase();

    if (companyLower.includes('google')) {
        return `Google interviews focus on:
- Googleyness & Leadership
- DSA: Medium-Hard problems, optimal solutions required
- System Design: Scalability, distributed systems
- Behavioral: Impact stories, collaboration`;
    }

    if (companyLower.includes('amazon')) {
        return `Amazon interviews focus on:
- Leadership Principles (14 principles)
- DSA: Practical problems, working code
- System Design: AWS services, cost optimization
- Behavioral: STAR method mandatory, customer obsession`;
    }

    if (companyLower.includes('microsoft')) {
        return `Microsoft interviews focus on:
- Growth mindset, collaboration
- DSA: Balanced difficulty, clean code
- System Design: Azure integration, enterprise scale
- Behavioral: Teamwork, learning from failure`;
    }

    if (companyLower.includes('meta') || companyLower.includes('facebook')) {
        return `Meta interviews focus on:
- Move fast, impact
- DSA: Hard problems, multiple solutions
- System Design: High scale (billions of users)
- Behavioral: Ownership, bold decisions`;
    }

    // Default for startups/other companies
    return `${company} interviews focus on:
- Cultural fit, passion for product
- DSA: Practical problem-solving
- System Design: MVP thinking, trade-offs
- Behavioral: Adaptability, ownership`;
}

export const fetchInterviewQuestions = async (role: string) => {
    try {
        const response = await axios.get(`${INTERVIEW_API_URL}/${role}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
