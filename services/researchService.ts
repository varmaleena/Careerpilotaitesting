import { Type } from "@google/genai";
import { ProjectIdea } from "../types";
import { ai, cleanJson, generateWithRetry, GEMINI_MODEL } from "./geminiClient";

// --- Types ---
interface RawPaper {
    title: string;
    abstract: string;
    url: string;
    authors: string[];
    published: string;
    id: string;
}

// --- Utilities ---

/**
 * Reconstructs the full abstract text from OpenAlex's inverted index format.
 * Format: { "word": [index1, index2], ... }
 */
const reconstructAbstract = (invertedIndex: Record<string, number[]> | undefined): string => {
    if (!invertedIndex) return "No abstract available.";

    try {
        const sortedWords: string[] = [];
        Object.entries(invertedIndex).forEach(([word, positions]) => {
            positions.forEach(pos => {
                sortedWords[pos] = word;
            });
        });
        return sortedWords.join(" ").replace(/\s+/g, ' ').trim();
    } catch (e) {
        return "Abstract summary unavailable.";
    }
};

/**
 * Resolves a reliable click-through URL for the paper.
 * Priority: DOI -> Landing Page -> OA URL -> OpenAlex ID Fallback
 */
const getPaperUrl = (work: any): string => {
    if (work.doi) return work.doi.startsWith('https://doi.org/') ? work.doi : `https://doi.org/${work.doi}`;
    if (work.primary_location?.landing_page_url) return work.primary_location.landing_page_url;
    if (work.open_access?.oa_url) return work.open_access.oa_url;
    // Fallback if absolutely nothing else exists (unlikely given filters, but safe)
    return work.ids?.openalex || "#";
};

// --- API Service ---

/**
 * Fetches relevant research papers from OpenAlex with strict filtering and normalization.
 */
export const fetchPapersFromOpenAlex = async (roleQuery: string, focusTopics: string[] = []): Promise<RawPaper[]> => {
    // 1. Construct Query - Intelligent Keyword Extraction
    // Remove seniority/noise words to focus on the TECH DOMAIN (e.g. "Senior React Dev" -> "React Dev")
    const noiseWords = ['Junior', 'Senior', 'Lead', 'Staff', 'Principal', 'Intern', 'Entry Level', 'Associated', 'Head of', 'Director'];
    let keywords = roleQuery
        .split(' ')
        .filter(w => !noiseWords.includes(w))
        .slice(0, 3)
        .join(' ');

    // Add the top focus topic if available to bias search towards learning path
    if (focusTopics.length > 0) {
        keywords += ` ${focusTopics[0]}`;
    }

    const sanitizedQuery = encodeURIComponent(keywords);

    // Feature: Shuffle/Randomization
    // We fetch from the top 4 pages (12 total results) to ensure variety while keeping relevance high.
    // This solves the issue of "getting the same projects every time".
    const randomPage = Math.floor(Math.random() * 4) + 1;

    // Filter: Post-2023, Articles only, Sorted by Relevance
    const url = `https://api.openalex.org/works?search=${sanitizedQuery}&filter=from_publication_date:2023-01-01,type:article&sort=relevance_score:desc&per-page=3&page=${randomPage}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn("OpenAlex API Request Failed");
            return [];
        }

        const data = await response.json();
        if (!data.results || !Array.isArray(data.results)) return [];

        // 2. Normalize Data
        const validPapers: RawPaper[] = data.results
            .map((work: any) => {
                const paperUrl = getPaperUrl(work);
                if (paperUrl === "#") return null;

                return {
                    title: work.title || "Untitled Research",
                    abstract: reconstructAbstract(work.abstract_inverted_index).slice(0, 800),
                    url: paperUrl,
                    authors: work.authorships?.map((a: any) => a.author.display_name).slice(0, 3) || ["Unknown Author"],
                    published: work.publication_date || new Date().toISOString().split('T')[0],
                    id: work.id
                };
            })
            .filter((p: any): p is RawPaper => p !== null);

        return validPapers.slice(0, 3);

    } catch (e) {
        console.error("OpenAlex Fetch Error:", e);
        return [];
    }
};

// --- Mapper Service (LLM) ---

/**
 * Batch maps papers to standardized portfolio projects.
 * Enforces strict constraints via System Instructions and Schema.
 */
const mapPapersToProjectsBatch = async (papers: RawPaper[]): Promise<ProjectIdea[]> => {
    if (papers.length === 0) return [];

    const papersContext = papers.map((p, i) => `
    [PAPER #${i + 1}]
    TITLE: ${p.title}
    AUTHORS: ${p.authors.join(', ')}
    DATE: ${p.published}
    URL: ${p.url}
    ABSTRACT: ${p.abstract}
    `).join('\n\n');

    const prompt = `
    Role: Senior Technical Mentor for College Students.
    Task: Transform these ${papers.length} ACADEMIC RESEARCH papers into LIGHTWEIGHT, BUILDABLE PORTFOLIO PROJECTS.
    Target Audience: College students and fresh graduates.
    
    Input Papers:
    ${papersContext}
    
    strict_transformation_rules:
    1. **Simplify for Students**: Convert complex research into a doable 2-4 week project.
       - If paper is "Static Analysis for Microservices using Tai-e", project is "Java Code Quality Dashboard".
       - If paper is "Survey of NoSQL Databases", project is "Interactive DB Performance Benchmark Tool".
    2. **Handle Surveys**: If a paper is a "Review" or "Survey", DO NOT suggest reading. Build a **Comparator Tool** or **Visualization Dashboard** based on that data.
    3. **Titles**: Simple, professional, non-intimidating, and exciting.
    4. **Description**: MAX 30 WORDS. clear "Definition of Done". (e.g. "Build a dashboard that visualizes...")
    5. **Difficulty**: Prefer "Intermediate". Only use "Advanced" if it's a capstone level.
    6. **Tech Stack**: Use standard, easy-to-learn tools (Java, Python, JS, React, Spring Boot, FastAPI, Firebase).
    7. **Features**: 2-3 simple, concrete features (e.g. "Login", "Dashboard", "Export PDF").
    8. **Resources**: 2-3 URLs to OFFICIAL docs (React Docs, MDN, Spring Guides).

    Output Schema:
    Return a JSON Array of exactly ${papers.length} project objects.
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
                            required: ["title", "difficulty", "description", "techStack", "keyFeatures", "resumeValue", "implementationResources"],
                            properties: {
                                title: { type: Type.STRING, description: "Full professional title" },
                                difficulty: { type: Type.STRING, enum: ['Intermediate', 'Advanced'] },
                                description: { type: Type.STRING, description: "Max 30 words" },
                                techStack: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "At least 4 tools"
                                },
                                keyFeatures: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                resumeValue: { type: Type.STRING },
                                implementationResources: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            url: { type: Type.STRING }
                                        },
                                        required: ["name", "url"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );

        const rawProjects = JSON.parse(cleanJson(response.text || "[]"));

        // Final Merge: Attach Source Metadata from the original papers
        // We trust the order because we instructed One-to-One mapping
        return rawProjects.map((proj: any, idx: number) => {
            const source = papers[idx];
            if (!source) return null;

            return {
                ...proj,
                id: source.url, // ID is the URL
                sourcePaper: {
                    title: source.title,
                    authors: source.authors,
                    url: source.url,
                    publishedDate: source.published,
                    abstractSummary: source.abstract.slice(0, 150) + "..."
                }
            };
        }).filter((p: any) => p !== null);

    } catch (error) {
        console.error("Batch Project Mapping Failed:", error);
        return [];
    }
};

// --- Main Facade ---

/**
 * Main entry point: Generates research-backed projects.
 * Enforces strict 10s timeout to prevent UI hanging.
 */
export const generateResearchBackedProjects = async (role: string, focusTopics: string[] = []): Promise<ProjectIdea[]> => {
    const fetchAndMap = async () => {
        const papers = await fetchPapersFromOpenAlex(role, focusTopics);
        if (papers.length === 0) throw new Error("No valid papers found.");
        return await mapPapersToProjectsBatch(papers);
    };

    // Strict 10s Timeout
    const timeout = new Promise<ProjectIdea[]>((_, reject) => {
        setTimeout(() => reject(new Error("Research generation timed out")), 10000);
    });

    return Promise.race([fetchAndMap(), timeout]);
};
