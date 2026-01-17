import { Type } from "@google/genai";
import { ChatMessage, InterviewFeedback } from "../types";
import { getAiInstance, cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";

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

export const createInterviewSession = (targetRole: string, resumeText?: string) => {
    const context = resumeText
        ? `CANDIDATE RESUME CONTEXT:\n${resumeText.slice(0, 5000)}...`
        : "No resume provided. Ask general questions based on the role.";

    const systemInstruction = `
    Role: You are a "Bar Raiser" Interviewer for a Top Tech Company (e.g. Amazon/Google).
    Target data: Role = "${targetRole}".
    
    ${context}

    Your Goal: Assess the candidate's depth of understanding, not just trivia recall.
    
    INTERVIEW PHASES (Do not reveal these, just flow naturally):
    1. **The Hook**: "Tell me about yourself, but focus on why you're a fit for this specific role."
    2. **The Deep Dive**: Pick ONE project from their resume. Ask "Why did you choose X tech?" then "What would you change if you built it today?". (Looking for self-reflection).
    3. **Technical Pressure**: Ask a concept question. If they answer correct, ask "What if we scale it to 10M users?". (Push their limit).
    4. **Behavioral Check**: "Tell me about a time you failed." (Look for ownership).
    
    RULES:
    - **Socratic Method**: If they struggle, give a tiny hint, don't give the answer.
    - **One Question Only**: Never double-barrel questions.
    - **Tone**: Professional, slightly demanding, but fair.
    - **No "Good Job"**: Don't validate every answer. Just say "Understood" or "Interesting" and move on.
    - Keep responses concise and focused.
  `;

    // Return our custom load-balanced chat instead of native SDK chat
    return new LoadBalancedChat(systemInstruction);
};

export const generateInterviewFeedback = async (messages: ChatMessage[], targetRole: string): Promise<InterviewFeedback> => {
    const transcript = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n');
    const prompt = `
    Role: Interview Coach.
    Task: Evaluate transcript for "${targetRole}".
    Transcript: ${transcript}
    Provide Score (0-10), Feedback, Strengths, Improvements, Focus Area.
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            feedbackSummary: { type: Type.STRING },
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                            recommendedFocus: { type: Type.STRING }
                        }
                    }
                }
            }
        );
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (error) {
        console.error("Feedback Generation Failed:", error);
        throw error;
    }
};
