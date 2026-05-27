import { Type } from "@google/genai";
import axios from "axios";
import { ATSResumeAnalysis, CareerAnalysis, LatexResumeData, ResumeOptimizationResult, UserProfile } from "../types";
import { cleanJson, GEMINI_MODEL, generateWithRetry } from "./geminiClient";

const API_URL = "https://api.example.com/resume";

// Allowed MIME types for resume files
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
];

/**
 * Validates if the file type is an allowed resume format (PDF, DOCX, DOC)
 */
export const validateResumeFileType = (mimeType: string): boolean => {
    return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Uses AI to validate if the document content is actually a resume
 * Returns true if valid resume, throws error if not
 */
export const validateResumeContent = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } }
): Promise<{ isValid: boolean; reason: string }> => {

    // First validate file type
    if (resumeInput.file && !validateResumeFileType(resumeInput.file.mimeType)) {
        return {
            isValid: false,
            reason: `Invalid file type. Only PDF, DOCX, and DOC files are allowed. Received: ${resumeInput.file.mimeType}`
        };
    }

    const validationPrompt = `
You are a document classifier. Your ONLY task is to determine if the given document is a RESUME/CV or not.

A RESUME/CV typically contains:
- Personal information (name, contact details)
- Education section
- Work experience or internships
- Skills section
- Projects (optional)
- Certifications (optional)

Respond with ONLY a JSON object:
{
  "isResume": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation"
}

If the document is:
- A random PDF (invoice, receipt, article, book, image, etc.) → isResume: false
- A cover letter only → isResume: false  
- An actual resume/CV with career information → isResume: true

Be STRICT. If it doesn't look like a resume, reject it.
`;

    const contents = [];
    if (resumeInput.file) {
        contents.push({
            inlineData: {
                mimeType: resumeInput.file.mimeType,
                data: resumeInput.file.data
            }
        });
        contents.push({ text: validationPrompt });
    } else if (resumeInput.text) {
        contents.push({ text: `Document Content:\n"${resumeInput.text.slice(0, 5000)}"\n\n${validationPrompt}` });
    } else {
        return { isValid: false, reason: "No document provided." };
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
                            isResume: { type: Type.BOOLEAN },
                            confidence: { type: Type.NUMBER },
                            reason: { type: Type.STRING }
                        },
                        required: ["isResume", "confidence", "reason"]
                    }
                }
            }
        );

        const text = response.text;
        if (!text) {
            return { isValid: false, reason: "Failed to validate document." };
        }

        const result = JSON.parse(cleanJson(text));

        if (!result.isResume || result.confidence < 60) {
            return {
                isValid: false,
                reason: result.reason || "Invalid input. Please upload a valid resume of a student or professional."
            };
        }

        return { isValid: true, reason: "Valid resume detected." };
    } catch (error) {

        return { isValid: false, reason: "Failed to validate document. Please try again." };
    }
};


// ATS Resume Analysis System Prompt
const ATS_ANALYSIS_PROMPT = `
You are an expert ATS (Applicant Tracking System), Senior Technical Recruiter,
Resume Analyst, and Career Coach combined.

Your task is to STRICTLY analyze and optimize resumes with extreme precision.

=====================
INPUT CONSTRAINTS
=====================

1. ACCEPT ONLY RESUME FILES.
   - Allowed formats: PDF, DOCX, DOC.
   - Reject any other file types (images, zip, txt, links, screenshots, etc.).
   - If the input is NOT a resume, respond with:
     "Invalid input. Please upload a valid resume of a student or professional."

2. The resume may belong to:
   - A student (fresher / intern / graduate)
   - An experienced professional

=====================
CORE OBJECTIVES
=====================

You MUST:
- Read and analyze EVERY LINE, EVERY WORD, and EVERY SECTION of the resume.
- Do NOT skip or summarize blindly.
- Extract information with 100% accuracy.
- Detect missing, weak, irrelevant, or poorly written content.
- Optimize the resume for ATS + recruiter readability.
- Match the resume against a given TARGET JOB PROFILE (if provided).

=====================
STEP-BY-STEP ANALYSIS
=====================

STEP 1: Resume Validation
- Confirm it is a real resume.
- Identify resume type: Student / Experienced Professional.
- Identify industry/domain.

STEP 2: Complete Information Extraction
Extract and structure the following clearly:

- Personal Details (Name, Location, Contact – exclude sensitive data in output)
- Professional Summary / Objective
- Skills (Technical, Soft, Tools, Frameworks)
- Education (Degree, Institution, Year, CGPA if available)
- Experience (Role, Company, Duration, Responsibilities, Impact)
- Projects (Title, Tech Stack, Description, Outcome)
- Certifications
- Achievements
- Extra sections (Publications, Open Source, Leadership, etc.)

STEP 3: Line-by-Line Quality Evaluation
For EACH section:
- Check clarity
- Check relevance
- Check action verbs
- Check quantification (metrics, numbers, impact)
- Identify weak or generic statements
- Identify grammar or wording issues

STEP 4: ATS Optimization Analysis
- Identify missing keywords
- Detect keyword stuffing or underuse
- Check formatting issues that ATS may reject
- Evaluate resume length suitability
- Evaluate section ordering

STEP 5: Job Profile Matching (If Job Description is Provided)
- Calculate skill match percentage
- Identify missing mandatory skills
- Identify transferable skills
- Highlight experience gaps
- Provide role-fit score (0–100)

=====================
STRICT RULES
=====================

- Be objective, professional, and extremely detailed.
- Do NOT hallucinate information.
- Do NOT assume skills not mentioned.
- If information is missing, explicitly state "Not provided".
- Do NOT add fake experience or fake skills.
- Maintain factual accuracy at all times.
- Optimize for FAANG-level and product-based company standards.

=====================
GOAL
=====================

Deliver a PERFECT, ATS-OPTIMIZED, JOB-ALIGNED resume analysis that can
directly improve interview shortlisting chances.
`;

/**
 * Analyzes the user's resume (Text or PDF) against a target role.
 */
export const analyzeProfile = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole: string,
    targetCompanies: string = "",
    experienceLevel: string = "Junior"
): Promise<{ analysis: CareerAnalysis; extractedProfile: Partial<UserProfile> }> => {

    const promptText = `
    Role: Elite Technical Recruiter & Career Strategist.
    Task: Critically analyze the candidate's profile against the target role: "${targetRole}" and target companies: "${targetCompanies || 'Tier 1 Tech Companies'}".
    Experience level expected: "${experienceLevel}".

    SCORING RUBRIC (STRICT):
    Your readinessScore MUST be based on these brutal standards:
    1. 0-40%: Basic resume, lack of metrics, generic skills, weak project descriptions, or no relevance to the target role.
    2. 41-60%: Good foundation, but missing critical technologies or industry-standard projects for "${targetRole}". 
    3. 61-80%: Strong profile with clear impact, quantified metrics (e.g., "Improved X by Y%"), and technical depth.
    4. 81-100%: Outstanding candidate, matching elite standards for companies like ${targetCompanies || 'FAANG'}. Has niche skills, significant leadership/impact, and perfect role alignment.

    CRITICAL PENALTIES:
    - If there are NO quantified metrics (%, $, numbers) in experience/projects → Max Score: 55%.
    - If it's a generic "Google Search Result" style resume → Max Score: 40%.
    - If critical skills for "${targetRole}" are missing → Reduce score by 15-20 points.

    Output strictly in JSON format matching the schema.
    - readinessScore: number 0-100 based on the STRICT RUBRIC above.
    - summary: A 2-3 sentence executive summary.
    - skills: List of skills extracted, categorized, and marked as 'acquired' (found in resume) or 'missing' (required for target role).
      CRITICAL: You MUST identify at least 5 'missing' skills that are standard for the role of "${targetRole}" but absent in the user's profile.
    - strengths: Top 3 selling points.
    - weaknesses: Top 3 REAL gaps to fill (be honest, don't be nice).
    - name: Candidate's full name if found.
    - mobileNumber: Candidate's phone number if found.
    - location: Candidate's city/country if found.
    - githubProfile: GitHub profile URL if found.
    - linkedinProfile: LinkedIn profile URL if found.
    - leetcodeProfile: LeetCode profile URL if found.

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

            throw new Error("Failed to parse AI response. Please try again.");
        }
    } catch (error) {

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

/**
 * Comprehensive ATS Resume Analysis
 * Analyzes resume with extreme precision for ATS optimization and job matching.
 */
export const analyzeResumeATS = async (
    resumeInput: { text?: string; file?: { data: string; mimeType: string } },
    targetRole?: string,
    jobDescription?: string
): Promise<ATSResumeAnalysis> => {

    // Step 1: Validate the document is a resume
    const validation = await validateResumeContent(resumeInput);
    if (!validation.isValid) {
        throw new Error(validation.reason);
    }

    const roleContext = targetRole
        ? `\n\nTARGET ROLE: ${targetRole}`
        : '';

    const jdContext = jobDescription
        ? `\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 3000)}`
        : '';

    const promptText = `${ATS_ANALYSIS_PROMPT}${roleContext}${jdContext}

OUTPUT FORMAT (JSON):
{
  "resumeOverview": {
    "resumeType": "Student | Experienced Professional",
    "experienceLevel": "Fresher | Junior | Mid | Senior",
    "domain": "Technology domain/industry",
    "overallATSScore": 0-100
  },
  "extractedData": {
    "skills": ["skill1", "skill2"],
    "education": ["degree - institution - year"],
    "experience": ["role at company - duration - key responsibility"],
    "projects": ["project - tech stack - outcome"],
    "certifications": ["certification name - issuer"]
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "criticalImprovements": ["improvement1", "improvement2"],
  "atsKeywordOptimization": {
    "missingKeywords": ["keyword1"],
    "suggestedKeywords": ["keyword1"],
    "keywordDensityIssues": ["issue1"]
  },
  "jobMatchAnalysis": {
    "skillMatchPercent": 0-100,
    "missingSkills": ["skill1"],
    "roleFitScore": 0-100
  },
  "optimizationSuggestions": {
    "rewrittenLines": [{"original": "weak line", "improved": "strong line"}],
    "betterActionVerbs": ["verb1"],
    "quantifiableMetrics": ["add X% improvement"]
  },
  "finalVerdict": {
    "isReady": true/false,
    "reason": "Clear explanation",
    "priorityImprovements": ["top1", "top2", "top3"]
  }
}`;

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
        throw new Error("No resume input provided. Please upload a valid resume (PDF, DOCX, or DOC).");
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
                            resumeOverview: {
                                type: Type.OBJECT,
                                properties: {
                                    resumeType: { type: Type.STRING },
                                    experienceLevel: { type: Type.STRING },
                                    domain: { type: Type.STRING },
                                    overallATSScore: { type: Type.NUMBER }
                                },
                                required: ["resumeType", "experienceLevel", "domain", "overallATSScore"]
                            },
                            extractedData: {
                                type: Type.OBJECT,
                                properties: {
                                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    education: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    experience: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["skills", "education", "experience", "projects", "certifications"]
                            },
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                            criticalImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                            atsKeywordOptimization: {
                                type: Type.OBJECT,
                                properties: {
                                    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    keywordDensityIssues: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["missingKeywords", "suggestedKeywords", "keywordDensityIssues"]
                            },
                            jobMatchAnalysis: {
                                type: Type.OBJECT,
                                properties: {
                                    skillMatchPercent: { type: Type.NUMBER },
                                    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    roleFitScore: { type: Type.NUMBER }
                                }
                            },
                            optimizationSuggestions: {
                                type: Type.OBJECT,
                                properties: {
                                    rewrittenLines: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                original: { type: Type.STRING },
                                                improved: { type: Type.STRING }
                                            },
                                            required: ["original", "improved"]
                                        }
                                    },
                                    betterActionVerbs: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    quantifiableMetrics: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["rewrittenLines", "betterActionVerbs", "quantifiableMetrics"]
                            },
                            finalVerdict: {
                                type: Type.OBJECT,
                                properties: {
                                    isReady: { type: Type.BOOLEAN },
                                    reason: { type: Type.STRING },
                                    priorityImprovements: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["isReady", "reason", "priorityImprovements"]
                            }
                        },
                        required: [
                            "resumeOverview",
                            "extractedData",
                            "strengths",
                            "weaknesses",
                            "criticalImprovements",
                            "atsKeywordOptimization",
                            "optimizationSuggestions",
                            "finalVerdict"
                        ]
                    }
                }
            }
        );

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        try {
            const data = JSON.parse(cleanJson(text));
            return data as ATSResumeAnalysis;
        } catch (parseError) {

            throw new Error("Failed to parse AI response. Please try again.");
        }
    } catch (error) {

        throw error;
    }
};
