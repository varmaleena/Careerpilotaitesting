import { Type } from "@google/genai";
import { CareerAnalysis, ResumeOptimizationResult, LatexResumeData } from "../types";
import { cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";

/**
 * Analyzes the user's resume (Text or PDF) against a target role.
 */
export const analyzeProfile = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole: string
): Promise<CareerAnalysis> => {

    const promptText = `
    Role: Elite Technical Career Coach (Ex-FAANG Recruiter & Engineering Lead).
    Task: Conduct a deep-dive analysis of the candidate's profile for the target role: "${targetRole}".
    
    Philosophy: Be brutally honest but highly constructive. Use current 2025 market standards.
    
    Output strictly in JSON format matching the schema.
    - readinessScore: number 0-100. (Rules: <40=Junior/Student, 40-70=Mid-Level/Capable, >80=Job Ready/Senior. Be strict.)
    - summary: A 3-sentence strategic summary. 1) Current Status. 2) The Critical Gap. 3) The "Winning Move" to get hired.
    - skills: Extract and categorize. Mark 'missing' if essential for ${targetRole} but not found.
    - strengths: 3 distinct "Selling Points" that make them stand out.
    - weaknesses: 3 specific "Deal Breakers" or gaps they MUST fix.
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
            GEMINI_MODEL,
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
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        }
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
    targetRole: string
): Promise<ResumeOptimizationResult> => {
    const promptText = `
    Role: Elite ATS & Resume Optimization Specialist.
    Task: Transform the provided resume into a High-Impact, ATS-Friendly document for the role of "${targetRole}".
    
    Process:
    1. **Analyze**: Calculate a rough ATS Score (0-100).
    2. **Rewrite**:
       - Convert weak, passive bullet points into "Action + Context + Result (Metrics)" format.
       - **STRICT RULE**: Do NOT add technical skills (e.g. Docker, Jenkins, Kubernetes, React) if they are not mentioned or clearly implied in the original text. You MUST NOT hallucinate experience.
       - You MAY add "Soft Skills" or "Domain Keywords" (e.g. "Agile", "Cross-functional collaboration") if they fit the context.
    3. **Evaluate**: Calculate the NEW ATS Score.
    4. **Explain**: List specific improvements.

    Output JSON strictly matching this schema:
    {
      "originalContent": "Extracted text. Max 500 chars summary if too long.",
      "optimizedContent": "The COMPLETE, fully formatted markdown of the new resume. NO FAKE SKILLS.",
      "atsScore": { "before": 45, "after": 92 },
      "keyImprovements": [
        { "category": "Impact", "suggestion": "Quantified achievements", "originalSnippet": "Managed team", "improvedSnippet": "Led team of 5 engineers to deliver..." }
      ],
      "missingKeywordsAdded": ["Agile", "Team Leadership"] // ONLY list keywords you actually added to the text. Do not list missing hard skills.
    }
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
        contents.push({ text: `Resume Content:\n"${resumeInput.text.slice(0, 10000)}"\n\n${promptText}` });
    } else {
        throw new Error("No resume provided.");
    }

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: contents,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
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
                                    after: { type: Type.NUMBER }
                                },
                                required: ["before", "after"]
                            },
                            keyImprovements: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        category: { type: Type.STRING, enum: ['Impact', 'Keywords', 'Formatting', 'Clarity'] },
                                        suggestion: { type: Type.STRING },
                                        originalSnippet: { type: Type.STRING },
                                        improvedSnippet: { type: Type.STRING }
                                    },
                                    required: ["category", "suggestion", "originalSnippet", "improvedSnippet"]
                                }
                            },
                            missingKeywordsAdded: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["originalContent", "optimizedContent", "atsScore", "keyImprovements", "missingKeywordsAdded"]
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
