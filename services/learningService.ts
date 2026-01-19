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
    - Each week must have **EXACTLY 3** high-impact tasks (no more, no less).
    - **Description**: MAX 15 WORDS. Concise and actionable.
    - Resources: strictly free and high-quality (YouTube/Docs).
    - **Video Query**: Must be very specific (e.g., "React Hooks useReducer tutorial for beginners", "System Design centralized logging architecture").
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
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

export const generateProjectIdeas = async (
    targetRole: string,
    focusTopics: string[] = [],
    targetCompany: string = "Tech Company",
    experienceLevel: string = "Intermediate",
    previousTitles: string[] = []
): Promise<ProjectIdea[]> => {
    const context = focusTopics.length > 0
        ? `Focus: ${focusTopics.slice(0, 3).join(", ")}`
        : "";

    const avoidInstruction = previousTitles.length > 0
        ? `CRITICAL: ALREADY GENERATED: ${previousTitles.join(", ")}. DO NOT REPEAT THESE themes or titles. Generate completely NEW ideas.`
        : "";

    // 1. STRICT Prompt to prevent runaway text
    const prompt = `
    Role: Hiring Manager at ${targetCompany}.
    Task: Suggest 3 "Hiring-Signal" Portfolio Projects for a "${experienceLevel}" "${targetRole}" candidate.
    ${context}
    
    GOAL: These projects must GUARANTEE an interview call by solving a REAL problem relevant to ${targetCompany}.
    - Relevance: If the company is distinct (e.g. FinTech), the project MUST be domain-specific (e.g. Ledger/Fraud Detection).
    - Complexity: NO To-Do Lists. NO simple CRUD. Must deal with Scale, Security, or Optimization.
    ${avoidInstruction}
    
    OUTPUT RULES:
    - Return ONLY a valid JSON Array.
    - NO Markdown, NO Explanations.
    - Total character count must be under 2000.
    
    JSON Structure:
    [
      {
        "title": "Project Name (Max 5 words)",
        "difficulty": "Beginner/Intermediate/Advanced",
        "description": "2 sentences max. Highlight technical complexity.",
        "techStack": ["Tool1", "Tool2", "Tool3"],
        "resumeValue": "1 punchy sentence explaining why this impresses a recruiter.",
        "implementationFlow": ["Step 1", "Step 2", "Step 3"],
        "learningOutcomes": ["Skill 1", "Skill 2"]
      }
    ]
    `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 1024, // FORCE stop before 36k chars
                    temperature: 0.8 // Slightly higher creativity to avoid repetition
                }
            }
        );

        let text = response.text || "[]";

        // 2. REPAIR Truncated JSON
        // If the AI stops in the middle, we cut it off at the last closing brace '}' and add ']'
        if (!text.trim().endsWith(']')) {
            const lastBrace = text.lastIndexOf('}');
            if (lastBrace !== -1) {
                text = text.substring(0, lastBrace + 1) + ']';
                console.warn("⚠️ Repaired truncated JSON response");
            }
        }

        const cleaned = cleanJson(text);
        const parsed = JSON.parse(cleaned);

        // Validate array
        if (!Array.isArray(parsed)) throw new Error("Output is not an array");

        return parsed.slice(0, 3).map((p: any) => ({
            ...p,
            id: p.id || Math.random().toString(36).substr(2, 9),
            // Ensure fields exist for UI safety
            title: p.title || "Project Idea",
            description: p.description || "A technical project relevant to the role.",
            techStack: p.techStack || ["React", "Node.js"],
            difficulty: p.difficulty || "Intermediate",
            resumeValue: p.resumeValue || "Demonstrates core competencies.",
            implementationFlow: p.implementationFlow || ["Design", "Build", "Test"],
            learningOutcomes: p.learningOutcomes || ["Full Stack Dev"],
            keyFeatures: p.keyFeatures || []
        }));

    } catch (error) {
        console.error("❌ Project Generation Failed, using Fallback:", error);

        // 3. EMERGENCY FALLBACK WITH VARIATIONS
        // Use random offset to cycle through fallbacks if API fails repeatedly
        const fallbackOffset = previousTitles.length % 2;

        const fallbackSetA = [
            {
                id: "fb-1",
                title: `${targetRole || 'Full Stack'} Analytics Engine`,
                difficulty: "Intermediate" as const,
                description: `High-performance analytics engine for ${targetRole}s processing large data streams in real-time.`,
                techStack: ["Node.js", "Redis", "Kafka", "React"],
                resumeValue: "Proves ability to handle high-throughput data processing.",
                implementationFlow: ["Ingest Stream", "Process Buffer", "Visualize"],
                learningOutcomes: ["Stream Processing", "Caching", "System Design"],
                keyFeatures: ["Real-time ingestion", "Data aggregation"]
            },
            {
                id: "fb-2",
                title: "Distributed Task Scheduler",
                difficulty: "Advanced" as const,
                description: "A fault-tolerant distributed system that schedules and executes jobs across multiple nodes.",
                techStack: ["Go", "gRPC", "PostgreSQL", "Docker"],
                resumeValue: "Demonstrates understanding of distributed systems and fault tolerance.",
                implementationFlow: ["Leader Election", "Job Queue", "Worker Nodes"],
                learningOutcomes: ["Distributed Consensus", "RPC", "Container Orchestration"],
                keyFeatures: ["Fault tolerance", "Load distribution"]
            },
            {
                id: "fb-3",
                title: "Secure API Gateway",
                difficulty: "Beginner" as const,
                description: "Custom API Gateway implementing rate limiting, authentication, and request routing.",
                techStack: ["Node.js", "Redis", "JWT", "Express"],
                resumeValue: "Shows grasp of backend security and infrastructure patterns.",
                implementationFlow: ["Auth Middleware", "Rate Limiter", "Proxy Logic"],
                learningOutcomes: ["Security Patterns", "Reverse Proxy", "Middleware"],
                keyFeatures: ["Rate limiting", "JWT Auth"]
            }
        ];

        return fallbackSetA; // Simply return Set A for now to ensure type safety, could expand logic later
    }
};
