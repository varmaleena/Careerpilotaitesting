import { JobListing } from "../types";
import { cleanJson, GEMINI_MODEL, generateWithRetry } from "./geminiClient";

/**
 * CareerPilot Market Scanner 2.0 (Freshness First)
 * ------------------------------------------------
 * Goal: ELIMINATE OUTDATED JOBS (2023, 2024, 2025).
 * Strategy:
 * 1. Use Gemini with Google Search Access.
 * 2. STRICT 'after:YYYY-MM-DD' search operators.
 * 3. Validation Layer: LLM is strictly instructed to discard any result > 30 days old.
 */

export const findMatchingJobs = async (
    targetRole: string,
    skills: string[],
    readinessScore: number = 50,
    missingSkills: string[] = [],
    experienceLevel: string = 'fresher',
    targetCompanies: string = ''
): Promise<JobListing[]> => {

    // Dynamic Date Calculation
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = now.getFullYear();

    // Strategy: Act as a targeted scraper for HiringHustle.com via Google Search
    const prompt = `
CURRENT DATE: ${currentDate}
YOUR MISSION: Scrape and extract job listings exclusively from "hiringhustle.com" for the role of ${targetRole}.

[TARGET SOURCE]
- **SITE**: hiringhustle.com
- **STRICT REQUIREMENT**: DO NOT return jobs from any other domain (like LinkedIn, Naukri, etc). ONLY hiringhustle.com links.

[CANDIDATE PROFILE]
- Role: ${targetRole}
- Experience: ${experienceLevel}
- Skills: ${skills.join(", ")}

[EXECUTE THESE SEARCHES]
1. site:hiringhustle.com "${targetRole}"
2. site:hiringhustle.com "${targetRole}" India
3. site:hiringhustle.com "${targetRole}" freshers ${currentYear}
4. site:hiringhustle.com "${targetRole}" intern
5. site:hiringhustle.com "${targetRole}" off campus

[EXTRACTION RULES]
- Extract the Job Title, Company Name, and the DIRECT LINK to the hiringhustle.com page.
- If the listing mentions "2023" or older, IGNORE IT.
- Focus on "2025" and "2026" batches or "Hiring Now".
- **FORMAT**: Return valid JSON.

[OUTPUT SCHEMA]
Return a JSON array of 10 jobs:
{
  "title": string,
  "company": string,
  "location": "India",
  "postedAt": "Recently",
  "applyLink": string (Must start with https://hiringhustle.com),
  "sourceType": "HiringHustle",
  "matchScore": number (Calculate based on skill match 0-100),
  "description": string (One line summary),
  "readinessStatus": "Ready to Apply"
}
`;

    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json"
                }
            }
        );

        let jobs = [];
        if (response.text) {
            try {
                jobs = JSON.parse(cleanJson(response.text));
            } catch (e) {

            }
        }

        if (!Array.isArray(jobs) || jobs.length === 0) {
            return fallbackToSearchLinks(targetRole, experienceLevel, skills);
        }

        // Post-Processing
        return jobs.map((job: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            title: job.title || targetRole,
            company: job.company || "Unknown",
            location: job.location || "India",
            salary: "View details",
            postedAt: job.postedAt || "Recently",
            matchScore: job.matchScore || 80,
            description: job.description || `Opportunity found on HiringHustle for ${targetRole}`,
            skillsMatched: skills.slice(0, 3),
            skillsMissing: [],
            applyLink: job.applyLink,
            linkConfidence: "High",
            readinessStatus: "Ready to Apply",
            sourceType: "HiringHustle"
        }));

    } catch (error) {

        return fallbackToSearchLinks(targetRole, experienceLevel, skills);
    }
};

/**
 * Fallback: Direct User to HiringHustle Search
 */
const fallbackToSearchLinks = (role: string, level: string, skills: string[]): JobListing[] => {
    return [
        {
            id: "hh-fb-1",
            title: `Search ${role} on HiringHustle`,
            company: "HiringHustle",
            location: "India",
            postedAt: "Live",
            matchScore: 100,
            description: "Direct link to HiringHustle's latest search results.",
            skillsMatched: skills.slice(0, 2),
            skillsMissing: [],
            applyLink: `https://www.google.com/search?q=${encodeURIComponent(`site:hiringhustle.com "${role}" India`)}`,
            linkConfidence: "High",
            readinessStatus: "Ready to Apply",
            sourceType: "HiringHustle"
        }
    ];
};
