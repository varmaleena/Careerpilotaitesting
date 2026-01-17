import { JobListing } from "../types";
import { cleanJson, GEMINI_MODEL, generateWithRetry } from "./geminiClient";

/**
 * CareerPilot Market Scanner
 * ----------------------------------------
 * - AI-powered search agent (NOT a scraper)
 * - Source priority: ATS > Indeed > Career Pages > Search > HiringHustle
 * - Resume Readiness gating enforced at runtime
 * - Freshness: last 14 days only
 * - Link safety & fallback protection
 */

export const findMatchingJobs = async (
    targetRole: string,
    skills: string[],
    readinessScore: number = 50,
    missingSkills: string[] = []
): Promise<JobListing[]> => {
    /* ---------------------------
       1. Determine Access Level
    ---------------------------- */
    const accessLevel =
        readinessScore >= 80
            ? "UNRESTRICTED"
            : readinessScore >= 60
                ? "CONDITIONAL"
                : "RESTRICTED";

    /* ---------------------------
       2. Expected Output Schema
    ---------------------------- */
    const exampleJson: JobListing[] = [
        {
            id: "job-id-1",
            title: "Backend Engineer",
            company: "Example Corp",
            location: "India / Remote",
            salary: "₹10L – ₹18L PA",
            postedAt: "5 days ago",
            matchScore: 82,
            description: "Build scalable backend services using Java and Spring Boot.",
            skillsMatched: ["Java", "Spring Boot"],
            skillsMissing: ["Docker"],
            sourceType: "ATS", // ATS | Indeed | CareerPage | Search | HiringHustle
            applyLink: "https://boards.greenhouse.io/example/jobs/123",
            linkConfidence: "High", // High | Medium | Low
            readinessStatus: "Ready to Apply"
        }
    ];

    /* ---------------------------
       3. Gemini Prompt
    ---------------------------- */
    const prompt = `
You are a Career Intelligence Market Scanner tailored for FRESHERS and ENTRY-LEVEL candidates.
You DISCOVER and VALIDATE job opportunities using AI-powered Google Search.
You do NOT scrape HTML or fabricate links.

[TARGET ROLE]
${targetRole} (Entry Level / Fresher Focus)

[CANDIDATE CONTEXT]
- **ACQUIRED/VERIFIED SKILLS**: ${skills.join(", ")} (Use these to find transferable roles)
- Missing Skills: ${missingSkills.join(", ")}
- Resume Readiness Score: ${readinessScore}/100
- Access Level: ${accessLevel}

[STRICT SOURCE PRIORITY]
1. ATS Platforms (greenhouse.io, lever.co, myworkdayjobs.com, ashbyhq.com)
2. Indeed (discovery + redirect only)
3. Official Company Career Pages
4. Google Search fallback
5. HiringHustle.com / LinkedIn

[FRESHER-CENTRIC STRATEGY (CRITICAL)]
The candidate is a FRESHER. You must split results:
- **Batch A (50%)**: "Direct Role Matches" -> Entry-level ${targetRole} jobs.
- **Batch B (50%)**: "Skill-Based Matches" -> Jobs that explicitly require their **ACQUIRED SKILLS** (${skills.slice(0, 3).join(', ')}) even if the job title is different (e.g. "Python Developer" instead of "Data Scientist").
- **Constraint**: ALL jobs must be suitable for 0-1 years experience.

[FRESHNESS RULE]
- Only jobs posted within the last 14 days.
- Deprioritize anything older.

[READINESS GATING – NON-NEGOTIABLE]

IF Access Level = UNRESTRICTED (>=80):
- Show direct apply links.
- Prefer ATS links.
- readinessStatus = "Ready to Apply"

IF Access Level = CONDITIONAL (60–79):
- Show direct links.
- readinessStatus = "Apply After Closing Gaps"
- Explicitly mention up to 2 missing skills.

IF Access Level = RESTRICTED (<60):
- DO NOT return real apply links.
- Provide Google Search fallback links ONLY.
- readinessStatus = "Locked – Improve Readiness Before Applying"

[SEMANTIC MATCHING]
- Compute Match Score (0–100).
- For freshers, prioritize POTENTIAL and CORE SKILLS over years of experience.

[LINK SAFETY]
- High Confidence → Verified ATS or official apply page
- Medium Confidence → Company career page
- Low Confidence → Google Search fallback
- NEVER hallucinate deep URLs.

[SEARCH QUERIES - BROADENED FOR VOLUME]
1. site:boards.greenhouse.io "${targetRole}" (Fresher OR "Entry Level" OR Intern) India
2. site:lever.co "${targetRole}" (Fresher OR "Entry Level") India
3. site:hiringhustle.com "${targetRole}" Fresher
4. site:internshala.com "${targetRole}" internship (High relevance for freshers)
5. site:naukri.com "${targetRole}" "0-1 years" (Freshers typically here)
6. "${targetRole}" fresher jobs India hiring now
7. "${skills[0]} ${skills[1]}" entry level jobs India (Skill-based search)
8. "Junior ${targetRole}" or "Associate ${targetRole}" recruitment India

[OUTPUT RULES]
- **QUANTITY**: Return **10-12** high-quality listings.
- **RELEVANCE**: If exact "${targetRole}" matches are scarce, include **ADJACENT ROLES** (e.g., if "React Dev" is low, find "Frontend Dev" or "Web Dev").
- Output STRICT JSON only.
- Follow this schema exactly:

${JSON.stringify(exampleJson, null, 2)}
`;

    /* ---------------------------
       4. Execute Search
    ---------------------------- */
    try {
        const response = await generateWithRetry(
            GEMINI_MODEL,
            {
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 0 }
                }
            }
        );

        if (!response.text) return [];

        const parsed = JSON.parse(cleanJson(response.text));

        if (!Array.isArray(parsed)) return [];

        /* ---------------------------
           5. Post-Processing Guardrails
        ---------------------------- */
        return parsed.map((job: JobListing) => {
            if (accessLevel === "RESTRICTED") {
                return {
                    ...job,
                    applyLink: `https://www.google.com/search?q=${encodeURIComponent(
                        `${job.title} ${targetRole} skills`
                    )}`,
                    linkConfidence: "Low",
                    readinessStatus: "Locked – Improve Readiness Before Applying"
                };
            }

            if (accessLevel === "CONDITIONAL") {
                return {
                    ...job,
                    readinessStatus: `Apply After Learning: ${missingSkills
                        .slice(0, 2)
                        .join(", ")}`
                };
            }

            return job;
        });
    } catch (error) {
        console.error("❌ Market Scan Failed:", error);
        throw error;
    }
};
