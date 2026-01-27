import { Type } from "@google/genai";
import axios from "axios";
import { CareerAnalysis, LatexResumeData, ResumeOptimizationResult, UserProfile } from "../types";
import { cleanJson, GEMINI_MODEL, generateWithRetry } from "./geminiClient";

const API_URL = "https://api.example.com/resume";

/**
 * Analyzes the user's resume (Text or PDF) against a target role.
 */
// Define return type locally or import if added to types
export const analyzeProfile = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole: string
): Promise<{ analysis: CareerAnalysis; extractedProfile: Partial<UserProfile> }> => { // Changed return type

    const promptText = `
    Role: Senior Career Coach.
    Task: Analyze the candidate's profile against the target role: "${targetRole}".
    Also, extract the candidate's contact and social profile links from the resume effectively.
    
    Output strictly in JSON format matching the schema.
    - readinessScore: number 0-100 based on fit.
    - summary: A 2-3 sentence executive summary.
    - skills: List of skills extracted, categorized, and marked as 'acquired' (found in resume) or 'missing' (required for target role).
      CRITICAL: You MUST identify at least 5 'missing' skills that are standard for the role of "${targetRole}" but absent in the user's profile. Do not return an empty list of missing skills.
    - strengths: Top 3 selling points.
    - weaknesses: Top 3 gaps to fill.
    - name: Candidate's full name if found.
    - mobileNumber: Candidate's phone number if found (look for patterns like +91-XXX, (XXX) XXX-XXXX, etc.).
    - location: Candidate's city/country if found.
    - githubProfile: GitHub profile URL if found. Look for patterns like:
      * github.com/username
      * https://github.com/username
      * www.github.com/username
      Extract the FULL URL including https:// if present, or prepend it if missing.
    - linkedinProfile: LinkedIn profile URL if found. Look for patterns like:
      * linkedin.com/in/username
      * https://www.linkedin.com/in/username
      * in.linkedin.com/in/username
      Extract the FULL URL including https:// if present, or prepend it if missing.
    - leetcodeProfile: LeetCode profile URL if found. Look for patterns like:
      * leetcode.com/username
      * https://leetcode.com/username
      Extract the FULL URL including https:// if present, or prepend it if missing.

    CRITICAL INSTRUCTIONS FOR URL EXTRACTION:
    - Scan the ENTIRE resume text for these URLs, including headers, footers, and contact sections.
    - URLs may appear with or without "https://", "http://", or "www." - capture them regardless.
    - If you find a partial URL (e.g., "github.com/john"), convert it to full format: "https://github.com/john"
    - Return empty string "" if truly not found, but search thoroughly first.
    
    Ensure:
    - githubProfile must include "github.com" if found.
    - linkedinProfile must include "linkedin.com" if found.
    - leetcodeProfile must include "leetcode.com" if found.
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
                            name: { type: Type.STRING },
                            mobileNumber: { type: Type.STRING },
                            location: { type: Type.STRING },
                            githubProfile: { type: Type.STRING },
                            linkedinProfile: { type: Type.STRING },
                            leetcodeProfile: { type: Type.STRING },
                        },
                        required: ["readinessScore", "summary", "skills", "strengths", "weaknesses"]
                    }
                }
            }
        );

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        try {
            const data = JSON.parse(cleanJson(text));

            const analysis: CareerAnalysis = {
                readinessScore: data.readinessScore,
                summary: data.summary,
                skills: data.skills,
                strengths: Array.isArray(data.strengths) ? data.strengths : [],
                weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : []
            };

            const extractedProfile: Partial<UserProfile> = {
                mobileNumber: data.mobileNumber,
                location: data.location,
                githubProfile: data.githubProfile,
                linkedinProfile: data.linkedinProfile,
                leetcodeProfile: data.leetcodeProfile
            };

            if (data.name) {
                extractedProfile.name = data.name;
            }

            return { analysis, extractedProfile };

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
    const promptText = `
Role: Senior FAANG Recruiter + ATS Optimization Specialist

Objective:
Optimize the candidate’s resume for maximum ATS ranking AND recruiter readability.
The output will be rendered into a LaTeX-based resume, so content accuracy, redundancy, and structure are critical.

PRIMARY GOAL:
Produce an ATS-competitive resume (not just ATS-parseable) while preserving all truthful information from the original resume.

STRICT RULES (NON-NEGOTIABLE):

1. CONTENT PARITY (NO SIGNAL LOSS)
- Do NOT remove or weaken any existing skills, technologies, tools, metrics, achievements, links, or education details.
- If content is rewritten, ensure keywords remain explicitly present.
- Achievements, GPA, certifications, and profile links MUST be preserved if present.

2. ATS KEYWORD DENSITY & REPETITION
- Critical skills (e.g., Python, Java, REST APIs, Spring Boot, Machine Learning, LLMs, Cloud) must appear:
  - In the Skills section
  - AND repeated naturally in Experience and/or Projects bullets
- Do NOT over-compress skills into a single mention.

3. METRICS & QUANTIFICATION (MANDATORY)
- EVERY Experience and Project bullet must contain at least one metric:
  - %, $, time saved, users impacted, scale, accuracy, latency, performance, ranking, or volume.
- If exact numbers are missing, estimate conservatively (10–20%, 50+ users, etc.).
- No bullet should be purely descriptive.

4. EXPERIENCE BULLET FORMAT (STAR-COMPACT)
- Action verb + technical action + business/result impact + metric
- Example:
  ❌ "Built REST APIs"
  ✅ "Built REST APIs using Spring Boot, improving response latency by 35% across 1K+ requests/day"

5. ACHIEVEMENTS SECTION (REQUIRED IF APPLICABLE)
- Explicitly include awards, hackathon wins, rankings, selections, or recognitions.
- Include scale (e.g., “Won among 2000+ participants”).
- Use strong ATS keywords: Winner, Awarded, Selected, Ranked.

6. EDUCATION COMPLETENESS
- Degree, institution, dates must be present.
- Include CGPA/GPA if available (especially for freshers).
- Do NOT omit academic performance data.
- Example format: "B.E. - Information Technology | GLWEC | 2021-2025 | CGPA: 8.14"

7. CONTACT & PROFILE LINKS (PLAIN TEXT)
- Ensure the following appear as plain text (not icons):
  - Email
  - Phone number
  - LinkedIn URL (must contain “linkedin.com”)
  - GitHub URL (must contain “github.com”)
  - LeetCode URL if available
- Do NOT hide links inside visuals or icons.

8. SECTION STRUCTURE (ATS-STANDARD ONLY)
Use ONLY the following section names:
- Professional Summary
- Technical Skills
- Experience
- Projects
- Education
- Certifications
- Achievements (if applicable)

9. NO HALLUCINATION
- Do NOT add skills, tools, companies, or experience not present in the original resume.
- You MAY rephrase, reorder, and strengthen wording.
- You MAY infer soft skills (Agile, collaboration) ONLY if implied.

10. OPTIMIZATION PRIORITY ORDER
1. Business impact & metrics
2. Technical depth
3. Keyword alignment with target role / JD
4. Leadership or ownership
5. Formatting clarity

OUTPUT REQUIREMENTS:
- Produce optimized resume content suitable for LaTeX rendering.
- Maintain clean, single-column structure.
- Bullets must be concise, ATS-friendly, and metric-driven.
- Ensure no section is empty unless truly absent in original data.

FINAL CHECK BEFORE OUTPUT:
- No important keyword removed
- No achievement lost
- No metrics missing
- No contact/profile link missing
- Resume reads well when copied as plain text

Transform for: ${targetRole}${jdSnippet}

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
You are a Senior Resume Architect. Extract ALL resume data into JSON format.

CRITICAL: This resume will be used for REAL job applications. Missing data = application rejection.

EXAMPLE INPUT:
"B.E. Information Technology, GLWEC, 2021-2025, CGPA: 8.14
Projects: CareerPilot (GDG Agentathon Winner) - Built AI platform
Certifications: Advanced Data Science - Innomatics Research Labs (2024)"

EXPECTED OUTPUT:
{
  "education": [{
    "degree": "B.E. - Information Technology",
    "university": "Gokaraju Lailavathi Women's Engineering College",
    "location": "Hyderabad",
    "dates": "2021 - 2025",
    "gpa": "8.14 CGPA"  // ← MANDATORY IF PRESENT
  }],
  "achievements": [{
    "title": "Winner, Google Developer Groups Agentathon 2025",
    "description": "Built AI-driven career platform"
  }],
  "certifications": [{
    "name": "Advanced Data Science Program",
    "issuer": "Innomatics Research Labs",
    "date": "2024"  // ← EXTRACT IF PRESENT
  }]
}

MANDATORY EXTRACTION RULES:

1. EDUCATION - ZERO DATA LOSS:
   ✓ Extract CGPA/GPA from phrases like:
     - "CGPA: 8.14"
     - "8.14 CGPA"
     - "GPA: 3.5/4.0"
     - "85%"
   ✓ If education mentions grades, YOU MUST extract them
   ✓ For freshers, GPA is CRITICAL - never omit

2. ACHIEVEMENTS - GLOBAL EXTRACTION (CRITICAL):
   ✓ Scan WHOLE RESUME (Headers, Education, Experience, Projects, Awards Section).
   ✓ EXTRACT if you see keywords:
     - "Winner", "Finalist", "Award", "Reward"
     - "Place" (1st/2nd/3rd), "Rank" (e.g., "AIR 5", "Top 1%")
     - "Medal" (Gold/Silver), "Scholarship", "Grant", "Patent"
     - "Hackathon", "Coding Contest", "Olympiad"
     - "Dean's List", "Best Paper", "Published"
   
   ✓ HANDLE MIXED SOURCES:
     - Case A: Achievement in Project Title ("CareerPilot (Winner)")
       → Extract as Achievement: "Winner, CareerPilot Hackathon"
     - Case B: Achievement in Education Bullet ("Secured Gold Medal")
       → Extract as Achievement
     - Case C: Explicit "Honors & Awards" section
       → Extract all items
   
   ✓ AVOID DUPLICATES:
     - If recognized in multiple places (e.g. summary AND project), create ONE consolidated entry.
   
   ✓ INCLUDE DATES:
     - Try to find the year (e.g., "2024") and append to title if not in description.
     - Example: "Winner, Smart India Hackathon (2023)"

4. PERSONAL INFO:
   ✓ fullName: Extract EXACTLY (e.g., "Dummani Leena Varma")
   ✓ phone: Include country code (e.g., "+91 9390780317")
   ✓ email: Must be present
   ✓ location: Extract if mentioned

5. SKILLS - CATEGORIZE PROPERLY:
   ✓ languages: Python, Java, SQL, etc.
   ✓ technologies: Spring Boot, Flask, ML, NLP, LLMs, etc.
   ✓ tools: Git, Streamlit, GCP, etc.

VALIDATION BEFORE RETURNING:
□ Did I extract CGPA/GPA from education?
□ Did I check project titles for achievements?
□ Did I extract certification dates if present?
□ Is phone number complete with country code?
□ Are all sections populated with available data?

If ANY checkbox is unchecked, RE-SCAN the resume text.

OUTPUT: Complete JSON matching LatexResumeData schema.
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
                                required: ["fullName"]  // Only name is required, rest will be filled from user profile
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
                                    required: ["title", "company", "dates", "bullets"]  // location is optional
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
                                    required: ["degree", "university", "dates"]  // location and gpa are optional
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
                            },
                            achievements: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    },
                                    required: ["title"]
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
