import { Type } from "@google/genai";
import { JobListing, MarketTrend } from "../types";
import { cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";

/**
 * Scans for real jobs using Google Search with optimized speed.
 */
export const findMatchingJobs = async (targetRole: string, skills: string[]): Promise<JobListing[]> => {
    // Example JSON structure provided by user to ensure consistency
    const exampleJson = [
        {
            "id": "apple-ml-2025",
            "title": "Machine Learning Engineer, OS Intelligence",
            "company": "Apple",
            "location": "Cupertino, CA / Remote Eligible",
            "salary": "$126,800 - $220,900",
            "postedAt": "3 days ago",
            "matchScore": 95,
            "description": "Design deep learning architectures and implement ML algorithms to optimize operating system performance and battery life.",
            "skillsMatched": ["Python", "PyTorch", "TensorFlow", "Deep Learning"],
            // Link logic is key here
            "applyLink": "https://www.google.com/search?q=Apple+Machine+Learning+Engineer+jobs"
        }
    ];

    const prompt = `
    Role: Senior Technical Recruiter.
    Task: Find 5 REAL, ACTIONABLE job listings for "${targetRole}" posted in the last 7 days.
    
    Target Locations: LinkedIn, Naukri, Glassdoor, Indeed.
    
    Candidate Skills Context: ${skills.join(', ')}.
    
    Instructions:
    1. Use Google Search to find specific job posting pages on the target sites (e.g., "site:linkedin.com/jobs ${targetRole}").
    2. **CRITICAL**: The 'matchScore' (0-100) must be calculated based on the overlap between the job requirements and the candidate's skills provided above.
    3. **LINK SECURITY**: Do NOT guess URLs. 
       - If you find a direct valid link in the search result, use it.
       - If NOT, simple create a google search link: "https://www.google.com/search?q=[Company]+[Job Title]+jobs".
       - NEVER output a broken or hallucinated "linkedin.com/jobs/view/..." link if you didn't see it.
    4. Format the output EXACTLY as this JSON array:
    ${JSON.stringify(exampleJson)}
    
    Output Rules:
    - Return ONLY the JSON array.
    - No markdown formatting.
    - Focus on recent (last 7 days) posts.
    - **Market Context**: Prioritize jobs in India or remote-friendly global roles.
    - **Currency**: Convert all salaries to INR (e.g., "₹12L - ₹20L PA"). If salary is missing, estimate based on INDIAN market standards.
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 0 }, // Disable thinking to speed up grounded response
                    // Using prompt engineering for structure instead of responseSchema to avoid conflicts with search tools
                }
            }
        );

        if (!response.text) return [];

        // cleanJson will handle stripping any accidental conversational text
        const parsed = JSON.parse(cleanJson(response.text));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Job Scan Failed:", error);
        // Rethrow so the UI can handle the specific 429 error message
        throw error;
    }
};

export const fetchMarketTrends = async (targetRole: string): Promise<MarketTrend> => {
    const exampleJson = {
        role: targetRole,
        salaryRange: "₹12L - ₹18L PA",
        demandLevel: "High",
        hotTechnologies: [
            { name: "TechName", growthReason: "Reason for growth" }
        ],
        industryNews: [
            { headline: "Headline", summary: "Short summary", impact: "Impact on career" }
        ]
    };

    const prompt = `
    Role: Tech Analyst.
    Task: Provide a real-time market snapshot for "${targetRole}" including salary ranges, demand, hot technologies, and recent industry news.
    
     Instructions:
    1. Use Google Search to find CURRENT data for:
       - Salary range (INDIAN MARKET specific, in INR)
       - Market demand level
       - Trending technologies/skills for this role
       - Recent news headlines affecting this role
    2. Format the output EXACTLY as this JSON object:
    ${JSON.stringify(exampleJson)}
    
    Output Rules:
    - Return ONLY the JSON object.
    - No markdown formatting.
    - Start with '{' and end with '}'.
  `;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 0 },
                    // Note: Removed strict responseSchema to prevent conflict with Google Search tool output.
                    // Relying on prompt engineering for JSON structure.
                }
            }
        );
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (error) {
        console.error("Trends Fetch Failed:", error);
        throw error;
    }
};
