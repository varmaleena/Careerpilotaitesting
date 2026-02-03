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

    // Determine plan duration based on skill gaps
    const skillGapCount = missingSkills.length;
    const weekCount = skillGapCount <= 3 ? 4 : skillGapCount <= 6 ? 6 : 8;
    const tasksPerWeek = 4; // Increased from 3 to 4 for better coverage

    const prompt = `
    Role: Senior Engineering Mentor & Career Coach (Specialist in guiding students/juniors to job-readiness).
    Task: Design a structured ${weekCount}-Week "Zero-to-Hero" Career Roadmap for a "${targetRole}".
    Target Gaps/Focus: ${focusSkills}.
    
    Philosophy for Students:
    - "Guidance over Content": Don't just say "Learn React". Say "Master React Hooks (useState, useEffect, useContext) to manage state effectively."
    - "Progressive Difficulty": Start with fundamentals, build to advanced concepts, end with interview-ready skills.
    - "Pacing & Progression": 
       * Week 1-2: Core Foundations & Mental Models (Why before How).
       * Week 3-${Math.ceil(weekCount / 2)}: Applied Skills (Implementation patterns, Mini-projects, Hands-on practice).
       * Week ${Math.ceil(weekCount / 2) + 1}-${weekCount - 1}: The Build (One complex portfolio-ready project).
       * Week ${weekCount}: Market Readiness (Interview prep, System design, Performance optimization, Resume polish).
    - "Variety & Specificity": EACH week MUST HAVE A UNIQUE THEME AND UNIQUE TASKS. 
    - "No Placeholder Names": Do NOT use themes like "Week 1", "Foundations", "Learning", or "Untitled". 
      Use descriptive titles like "Advanced State Management with Redux" or "Scalable Microservices Architecture".
    - "Strict Deliverables": EVERY week MUST contain EXACTLY ${tasksPerWeek} high-impact tasks. DO NOT leave any week empty.
    - "Outcome-Based": Every task must have a clear "Definition of Done" (e.g., "Build a working authentication system").
    - "Resource-Rich": Provide specific, actionable video queries that will find the BEST tutorials.
    
    Requirements:
    - Generate EXACTLY ${weekCount} Weeks (Indices 1, 2, 3, ..., ${weekCount}).
    - Each week must have **EXACTLY ${tasksPerWeek}** high-impact tasks (no more, no less).
    - **Description**: MAX 20 WORDS. Concise, actionable, and outcome-focused.
    - **Estimated Hours**: Be realistic. Courses: 3-8h, Projects: 8-20h, Reading: 1-5h.
    - **Video Query**: Must be VERY specific with exact technology and concept (e.g., "React useReducer advanced patterns tutorial 2024", "System Design distributed caching Redis architecture").
    - **Task Types**: Mix of 'course' (learning), 'project' (building), and 'reading' (documentation/articles).
    - **Difficulty Progression**: Tasks should get progressively harder each week.
    
    CRITICAL: Return ONLY valid JSON. NO markdown, NO explanations, NO extra text.
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
                            required: ["weekNumber", "theme", "tasks"],
                            properties: {
                                weekNumber: { type: Type.INTEGER },
                                theme: { type: Type.STRING },
                                tasks: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        required: ["id", "title", "description", "type", "estimatedHours", "completed", "videoQuery"],
                                        properties: {
                                            id: { type: Type.STRING },
                                            title: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                            type: { type: Type.STRING, enum: ['course', 'project', 'reading'] },
                                            estimatedHours: { type: Type.NUMBER },
                                            completed: { type: Type.BOOLEAN, description: "Must ALWAYS be false initially" },
                                            videoQuery: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    temperature: 0.7, // Slightly creative but still focused
                    maxOutputTokens: 4096 // Increased for longer plans
                }
            }
        );

        const rawPlan = JSON.parse(cleanJson(response.text || "[]")) as WeeklyPlan[];

        // Enhanced Post-processing
        const filteredPlan = rawPlan.filter(week =>
            week.tasks &&
            week.tasks.length > 0 &&
            week.theme &&
            week.theme.trim().length > 5 && // Increased from 3 to 5 for better quality
            !week.theme.toLowerCase().includes('week') &&
            !week.theme.toLowerCase().includes('untitled') &&
            !week.theme.toLowerCase().includes('placeholder')
        );

        if (filteredPlan.length === 0) {
            throw new Error("The AI returned a low-quality plan with missing content. Please try regenerating.");
        }

        // Ensure we have the target number of weeks
        const finalPlan = filteredPlan.slice(0, weekCount).map((week, idx) => ({
            ...week,
            weekNumber: idx + 1,
            tasks: week.tasks.slice(0, tasksPerWeek).map((task, taskIdx) => ({
                ...task,
                id: task.id || `task-${idx}-${taskIdx}-${Math.random().toString(36).substr(2, 9)}`,
                // Ensure estimatedHours is reasonable
                estimatedHours: Math.min(Math.max(task.estimatedHours || 5, 1), 40)
            }))
        }));

        // Validate we have enough weeks
        if (finalPlan.length < Math.min(4, weekCount)) {
            throw new Error(`Generated plan has only ${finalPlan.length} weeks, expected at least 4. Please try again.`);
        }

        // Post-processing: Ensure all tasks are marked as NOT completed initially
        const sanitizedPlan = finalPlan.map(week => ({
            ...week,
            tasks: week.tasks.map(task => ({
                ...task,
                completed: false
            }))
        }));

        return sanitizedPlan;
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

    const isBeginner = ["student", "fresher", "beginner"].includes(experienceLevel.toLowerCase());
    const complexityInstruction = isBeginner
        ? 'Start with doable but impressive projects. Allow CRUD if it solves a unique problem. Focus on "Finished & Deployed" over "Complex & Broken".'
        : 'NO To-Do Lists. NO simple CRUD. Must deal with Scale, Security, or Optimization.';

    // 1. STRICT Prompt to prevent runaway text
    const prompt = `
    Role: Hiring Manager at ${targetCompany}.
    Task: Suggest 3 "Hiring-Signal" Portfolio Projects for a "${experienceLevel}" "${targetRole}" candidate.
    ${context}
    
    GOAL: These projects must GUARANTEE an interview call by solving a REAL problem relevant to ${targetCompany}.
    - Relevance: If the company is distinct (e.g. FinTech), the project MUST be domain-specific (e.g. Ledger/Fraud Detection).
    - Complexity: ${complexityInstruction}
    - Tech Stack: **AVOID PAID SERVICES** (e.g. AWS EC2, Azure SQL) unless explicitly mentioning "Free Tier". **PREFER** Vercel, Netlify, Render, Railway, Supabase, Firebase, or LocalStack.
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
        "userStories": ["As a user, I want to...", "As a admin, I want to..."],
        "keyFeatures": ["Feature 1", "Feature 2"],
        "resumeValue": "1 punchy sentence explaining why this impresses a recruiter.",
        "implementationFlow": ["Step 1", "Step 2", "Step 3"],
        "learningOutcomes": ["Skill 1", "Skill 2"],
        "referenceGithubUrl": "https://github.com/search?q=..."
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
                    maxOutputTokens: 2048, // Increased for more details
                    temperature: 0.8
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
            userStories: p.userStories || [],
            keyFeatures: p.keyFeatures || [],
            resumeValue: p.resumeValue || "Demonstrates core competencies.",
            implementationFlow: p.implementationFlow || ["Design", "Build", "Test"],
            learningOutcomes: p.learningOutcomes || ["Full Stack Dev"],
            referenceGithubUrl: p.referenceGithubUrl || `https://github.com/search?q=${encodeURIComponent(p.title || "react project")}&type=repositories`,
            completed: false
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
                keyFeatures: ["Real-time ingestion", "Data aggregation"],
                referenceGithubUrl: "https://github.com/search?q=realtime+analytics+dashboard+react+node&type=repositories"
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
                keyFeatures: ["Fault tolerance", "Load distribution"],
                referenceGithubUrl: "https://github.com/search?q=distributed+task+scheduler+go&type=repositories"
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
                keyFeatures: ["Rate limiting", "JWT Auth"],
                referenceGithubUrl: "https://github.com/search?q=api+gateway+nodejs&type=repositories"
            }
        ];

        return fallbackSetA; // Simply return Set A for now to ensure type safety, could expand logic later
    }
};
