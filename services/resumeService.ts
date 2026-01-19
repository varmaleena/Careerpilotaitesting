import { Type } from "@google/genai";
import axios from "axios";
import { CareerAnalysis, LatexResumeData, ResumeOptimizationResult } from "../types";
import { cleanJson, GEMINI_MODEL, generateWithRetry } from "./geminiClient";

const API_URL = "https://api.example.com/resume";

/**
 * Analyzes the user's resume (Text or PDF) against a target role.
 */
export const analyzeProfile = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole: string
): Promise<CareerAnalysis> => {

    const promptText = `
    Role: Senior Career Coach.
    Task: Analyze the candidate's profile against the target role: "${targetRole}".
    
    CRITICAL: YOU MUST PROVIDE EXACTLY 3 STRENGTHS and 3 WEAKNESSES. 
    If the resume is sparse, infer strengths from their background or potential (e.g., "Strong Academic Foundation", "Self-Driven Learning", "Technical Curiosity").
    Do NOT return empty arrays.
    
    Output strictly in JSON format matching the schema.
    - readinessScore: number 0-100 based on fit.
    - summary: A 2-3 sentence executive summary.
    - skills: List of skills extracted, categorized, and marked as 'acquired' (found in resume) or 'missing' (required for target role).
    - strengths: Top 3 selling points.
    - weaknesses: Top 3 gaps to fill.
  `;

    const contents = [];

    if (resumeInput.file) {
        contents.push({
            inlineData: {
                mimeType: resumeInput.file.mimeType,
                data: resumeInput.file.data
            }
        });
        contents.push({ text: promptText });
    } else if (resumeInput.text) {
        contents.push({ text: `Resume Content:\n"${resumeInput.text.slice(0, 30000)}"\n\n${promptText}` });
    } else {
        throw new Error("No resume input provided");
    }

    try {
        const response = await generateWithRetry(
            'gemini-2.0-flash-exp',
            {
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            readinessScore: { type: Type.NUMBER },
                            summary: { type: Type.STRING },
                            skills: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        category: { type: Type.STRING, enum: ['technical', 'soft', 'domain'] },
                                        status: { type: Type.STRING, enum: ['acquired', 'missing', 'in-progress'] },
                                    }
                                }
                            },
                            strengths: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                minItems: 3,
                                maxItems: 3
                            },
                            weaknesses: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                minItems: 3,
                                maxItems: 3
                            },
                        },
                        required: ["readinessScore", "summary", "skills", "strengths", "weaknesses"]
                    }
                }
            }
        );

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        try {
            return JSON.parse(cleanJson(text)) as CareerAnalysis;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Text:", text);
            throw new Error("Failed to parse AI response. Please try again.");
        }
    } catch (error) {
        console.error("Analysis failed", error);
        throw error;
    }
};

export const optimizeResume = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole: string,
    jobDescription?: string
): Promise<ResumeOptimizationResult> => {

    // Ultra-compressed prompt - optimized for speed (60% token reduction)
    const jdSnippet = jobDescription
        ? `\nJD:\n${jobDescription.slice(0, 1500)}\nMatch keywords naturally.`
        : `\nOptimize for ${targetRole} at top companies.`;

    // Hyper-optimized prompt - FAANG performance standards
    const promptText = `Resume Optimizer (Ex-FAANG Recruiter)
Transform for: ${targetRole}${jdSnippet}

ATS SCORING (0-100):
- Keywords (30%): Tech skills, tools
- Metrics (25%): Numbers, %,  $
- Verbs (15%): Led/Built/Scaled
- Format (15%): Clean structure
- Relevance (15%): Role match

RULES:
1. STAR format: Action + Result (with metrics)
   ❌ "Managed team" 
   ✅ "Led 8 engineers, cut latency 40%, saved $200K/yr"

2. Quantify EVERYTHING
   - Add %, $, time, users to each bullet
   - Estimate if unknown (10-15%, 50+ users)

3. Power verbs
   Managed→Led | Worked→Built | Helped→Optimized

4. Keyword Optimization (MANDATORY)
   - Identify 5-10 technical keywords/tools/methodologies essential for ${targetRole}.
   - Inject these keywords naturally into bullets or skills.
   - You MUST populate 'missingKeywordsAdded' array with these identified keywords.

5. Order by impact
   Business $ → Scale → Technical → Leadership

OUTPUT JSON:
{
  "originalContent": "summary (max 300 chars)",
  "optimizedContent": "full markdown resume",
  "atsScore": {
    "before": <num>,
    "after": <num>,
    "breakdown": {
      "keywordMatch": <num>,
      "quantification": <num>,
      "actionVerbs": <num>,
      "formatting": <num>,
      "relevance": <num>
    }
  },
  "keyImprovements": [
    {
      "category": "Impact|Keywords|Formatting|Clarity|Quantification",
      "suggestion": "what changed",
      "originalSnippet": "before (max 80 chars)",
      "improvedSnippet": "after (max 120 chars)",
      "impact": "high|medium|low"
    }
  ],
  "missingKeywordsAdded": ["keyword1"],
  "weaknessesAddressed": ["weakness fixed"],
  "nextSteps": ["action item"]
}

Make it production-ready, no placeholders.`;

    const contents = [];

    if (resumeInput.file) {
        contents.push({
            inlineData: {
                mimeType: resumeInput.file.mimeType,
                data: resumeInput.file.data
            }
        });
        contents.push({ text: promptText });
    } else if (resumeInput.text) {
        // Truncate resume text more aggressively for speed
        contents.push({ text: `RESUME:\n${resumeInput.text.slice(0, 8000)}\n\n${promptText}` });
    } else {
        throw new Error("No resume provided.");
    }

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: contents,
                config: {
                    thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            originalContent: { type: Type.STRING },
                            optimizedContent: { type: Type.STRING },
                            atsScore: {
                                type: Type.OBJECT,
                                properties: {
                                    before: { type: Type.NUMBER },
                                    after: { type: Type.NUMBER },
                                    breakdown: {
                                        type: Type.OBJECT,
                                        properties: {
                                            keywordMatch: { type: Type.NUMBER },
                                            quantification: { type: Type.NUMBER },
                                            actionVerbs: { type: Type.NUMBER },
                                            formatting: { type: Type.NUMBER },
                                            relevance: { type: Type.NUMBER }
                                        }
                                    }
                                },
                                required: ["before", "after", "breakdown"]
                            },
                            keyImprovements: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        category: { type: Type.STRING, enum: ['Impact', 'Keywords', 'Formatting', 'Clarity', 'Quantification'] },
                                        suggestion: { type: Type.STRING },
                                        originalSnippet: { type: Type.STRING },
                                        improvedSnippet: { type: Type.STRING },
                                        impact: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                                    },
                                    required: ["category", "suggestion", "originalSnippet", "improvedSnippet", "impact"]
                                }
                            },
                            missingKeywordsAdded: { type: Type.ARRAY, items: { type: Type.STRING } },
                            weaknessesAddressed: { type: Type.ARRAY, items: { type: Type.STRING } },
                            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["originalContent", "optimizedContent", "atsScore", "keyImprovements", "missingKeywordsAdded", "weaknessesAddressed", "nextSteps"]
                    }
                }
            }
        );

        const text = response.text || "{}";
        return JSON.parse(cleanJson(text)) as ResumeOptimizationResult;
    } catch (error) {
        console.error("Resume Optimization Failed:", error);
        throw error;
    }
};

export const generateLatexData = async (
    resumeText: string
): Promise<LatexResumeData> => {
    const promptText = `
    Role: Professional Resume Formatter.
    Task: Extract structured data from the provided resume text to populate a LaTeX template.
    
    Output strictly in JSON format matching the schema.
    Ensure all bullet points are concise and impact-focused.
    If specific fields are missing, try to infer them or leave them empty strings (do not hallucinate data).
    Separate skills into languages, technologies, and tools if possible.
    `;

    const contents = [
        { text: `Resume Content:\n"${resumeText.slice(0, 30000)}"\n\n${promptText}` }
    ];

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            personalInfo: {
                                type: Type.OBJECT,
                                properties: {
                                    fullName: { type: Type.STRING },
                                    email: { type: Type.STRING },
                                    phone: { type: Type.STRING },
                                    location: { type: Type.STRING },
                                    linkedin: { type: Type.STRING },
                                    website: { type: Type.STRING }
                                },
                                required: ["fullName", "email", "phone", "location"]
                            },
                            summary: { type: Type.STRING },
                            skills: {
                                type: Type.OBJECT,
                                properties: {
                                    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    tools: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["languages", "technologies", "tools"]
                            },
                            experience: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        company: { type: Type.STRING },
                                        location: { type: Type.STRING },
                                        dates: { type: Type.STRING },
                                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["title", "company", "location", "dates", "bullets"]
                                }
                            },
                            education: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        degree: { type: Type.STRING },
                                        university: { type: Type.STRING },
                                        location: { type: Type.STRING },
                                        dates: { type: Type.STRING },
                                        gpa: { type: Type.STRING }
                                    },
                                    required: ["degree", "university", "location", "dates"]
                                }
                            },
                            projects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        technologies: { type: Type.STRING },
                                        date: { type: Type.STRING },
                                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["name", "technologies", "bullets"]
                                }
                            },
                            certifications: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        issuer: { type: Type.STRING },
                                        date: { type: Type.STRING }
                                    },
                                    required: ["name", "issuer", "date"]
                                }
                            }
                        },
                        required: ["personalInfo", "summary", "skills", "experience", "education"]
                    }
                }
            }
        );

        const text = response.text || "{}";
        return JSON.parse(cleanJson(text)) as LatexResumeData;
    } catch (error) {
        console.error("Latex Data Extraction Failed:", error);
        throw error;
    }
};

export const fetchResume = async (userId: string) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
