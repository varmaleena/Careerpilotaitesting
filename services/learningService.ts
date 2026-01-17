import { Type } from "@google/genai";
import { WeeklyPlan, ProjectIdea } from "../types";
import { cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";

/**
 * Generates a personalized learning plan.
 */
export const generateLearningPlan = async (targetRole: string, missingSkills: string[]): Promise<WeeklyPlan[]> => {
    const focusSkills = missingSkills.length > 0
        ? missingSkills.slice(0, 5).join(', ')
        : `core modern competencies for ${targetRole}`;

    const prompt = `
    Role: Senior Engineering Mentor (Specialist in guiding students/juniors).
    Task: Design a structured 4-Week "Zero-to-Hero" Career Roadmap for a "${targetRole}".
    Target Gaps/Focus: ${focusSkills}.
    
    Philosophy for Students:
    - "Guidance over Content": Don't just say "Learn React". Say "Master React Hooks to manage state effectively."
    - "Pacing": 
       * Week 1: Core Foundations (The Theory & "Why").
       * Week 2: Applied Skills (Small exercises).
       * Week 3: The Build (One major portfolio project).
       * Week 4: Market Readiness (Interview prep & Polish).
    - "Outcome-Based": Every task must have a clear "Definition of Done".
    
    Requirements:
    - Generate exactly 4 Weeks.
    - Each week must have 3-5 high-impact tasks.
    - Resources: strictly free and high-quality (YouTube/Docs).
    - **Video Query**: Must be very specific (e.g., "React Hooks useReducer tutorial for beginners", "System Design centralized logging architecture").
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                weekNumber: { type: Type.INTEGER },
                                theme: { type: Type.STRING },
                                tasks: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            title: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                            type: { type: Type.STRING, enum: ['course', 'project', 'reading'] },
                                            estimatedHours: { type: Type.NUMBER },
                                            completed: { type: Type.BOOLEAN },
                                            videoQuery: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );

        return JSON.parse(cleanJson(response.text || "[]")) as WeeklyPlan[];
    } catch (error) {
        console.error("Plan Generation Failed:", error);
        throw error;
    }
};

export const generateProjectIdeas = async (targetRole: string): Promise<ProjectIdea[]> => {
    const prompt = `
    Role: CTO of a Y-Combinator Startup.
    Task: Suggest 3 Portfolio Projects that would actually get a candidate hired for "${targetRole}".
    
    Criteria:
    - NO "To-Do Lists" or "Weather Apps" (Too generic).
    - Projects must solve a real problem or demonstrate a complex skill (e.g. Real-time data, Auth, AI integration).
    - Levels: 
      1. **The "Proof of Concept"** (Beginner but unique).
      2. **The "Full Stack"** (Intermediate, real users).
      3. **The "Moonshot"** (Advanced, complex architecture).
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                title: { type: Type.STRING },
                                difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                                description: { type: Type.STRING },
                                techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                                keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                                resumeValue: { type: Type.STRING },
                                implementationResources: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: { name: { type: Type.STRING }, url: { type: Type.STRING } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (error) {
        console.error("Project Generation Failed:", error);
        throw error;
    }
};
