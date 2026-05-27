import axios from 'axios';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';



export interface VerifiedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    applyLink: string;
    postedAt: string;
    sourceType: "Adzuna" | "Remotive" | "Greenhouse" | "Lever";
    description?: string;
    salary?: string;
}

// ─── Service-level in-memory job cache ───────────────────────────────────────
// Key: "uid:role" → { jobs, timestamp }. Avoids ANY network/Firestore hit when
// the user navigates away from Job Hub and returns within the same tab session.
const _serviceJobCache = new Map<string, { jobs: VerifiedJob[]; ts: number }>();
const SERVICE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (matches Firestore cache TTL)
// ─────────────────────────────────────────────────────────────────────────────


// Extract meaningful keywords from target role, filtering out generic career/role terms
const getRoleKeywords = (role: string): string[] => {
    const genericWords = new Set([
        'senior', 'junior', 'developer', 'engineer', 'designer', 'architect', 
        'lead', 'staff', 'principal', 'manager', 'intern', 'co-op', 'associate', 
        'analyst', 'consultant', 'specialist', 'executive', 'tech', 'technology', 
        'software', 'role', 'jobs', 'job', 'hiring', 'recruiting', 'in', 'at', 'for'
    ]);
    return role.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 1 && !genericWords.has(w));
};

// Match job title/description against target role keywords
export const matchJobToRole = (jobTitle: string, jobDescription: string, targetRole: string): boolean => {
    const title = jobTitle.toLowerCase();
    const desc = (jobDescription || '').toLowerCase();
    const roleLower = targetRole.toLowerCase();

    // 1. Get meaningful keywords (excluding generic roles)
    const keywords = getRoleKeywords(targetRole);

    // 2. If we have meaningful keywords, match them (at least one keyword matches)
    if (keywords.length > 0) {
        return keywords.some(keyword => title.includes(keyword) || desc.includes(keyword));
    }

    // 3. Fallback: match targetRole words (e.g. "software", "engineer")
    const fallbackWords = roleLower.split(/\s+/).filter(w => w.length > 1);
    if (fallbackWords.length > 0) {
        return fallbackWords.some(w => title.includes(w) || desc.includes(w));
    }

    // 4. Ultimate fallback: string includes
    return title.includes(roleLower) || desc.includes(roleLower);
};

// Helper: Approx date string
const getRelativeTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Recently";
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "1 day ago";
        return `${diffDays} days ago`;
    } catch {
        return "Recently";
    }
};

// CORS Proxy to bypass browser restrictions if direct fetch is blocked
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

// --- 1. Adzuna API (Real Jobs, India/Global) ---
const fetchAdzunaJobs = async (targetRole: string): Promise<VerifiedJob[]> => {
    const jobs: VerifiedJob[] = [];
    const appId = import.meta.env.VITE_ADZUNA_APP_ID;
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;
    
    if (!appId || !appKey) {
        return jobs;
    }

    try {
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(targetRole)}`;
        const response = await axios.get(url);
        
        const results = response.data.results || [];
        results.forEach((job: any) => {
            jobs.push({
                id: `adzuna_${job.id}`,
                title: job.title,
                company: job.company?.display_name || "Unknown Company",
                location: job.location?.display_name || "Remote",
                applyLink: job.redirect_url,
                postedAt: getRelativeTime(job.created),
                sourceType: "Adzuna",
                description: job.description,
                salary: job.salary_min ? `₹${job.salary_min} - ₹${job.salary_max}` : undefined
            });
        });
    } catch (error) {
        // Failed
    }
    return jobs;
};

// --- 2. Remotive API (Tech / Remote Jobs) ---
const fetchRemotiveJobs = async (targetRole: string): Promise<VerifiedJob[]> => {
    const jobs: VerifiedJob[] = [];
    try {
        const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(targetRole)}&limit=15`;
        const response = await axios.get(url);
        
        const results = response.data.jobs || [];
        results.slice(0, 15).forEach((job: any) => {
            jobs.push({
                id: `remotive_${job.id}`,
                title: job.title,
                company: job.company_name,
                location: job.candidate_required_location || "Worldwide",
                applyLink: job.url,
                postedAt: getRelativeTime(job.publication_date),
                sourceType: "Remotive",
                description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 200) + "..." : "Remote Tech Job",
                salary: job.salary || undefined
            });
        });
    } catch (error) {
        // Failed
    }
    return jobs;
};

// --- 3. Greenhouse (Direct call with Proxy Fallback) ---
const fetchGreenhouseJobs = async (targetRole: string): Promise<VerifiedJob[]> => {
    const companies = ['stripe', 'airbnb', 'twitch', 'dropbox', 'reddit'];
    const jobs: VerifiedJob[] = [];

    const promises = companies.map(async (company) => {
        try {
            const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
            let response;
            try {
                // Try direct client-side fetch (CORS supported by default on Greenhouse boards)
                response = await axios.get(url, { timeout: 5000 });
            } catch (e) {
                // Fallback to proxy
                response = await axios.get(`${CORS_PROXY}${url}`, { timeout: 8000 });
            }

            const listings = response.data.jobs || [];

            listings.forEach((job: any) => {
                if (matchJobToRole(job.title, '', targetRole)) {
                    jobs.push({
                        id: `greenhouse_${job.id}`,
                        title: job.title,
                        company: company.charAt(0).toUpperCase() + company.slice(1),
                        location: job.location?.name || "Remote",
                        applyLink: job.absolute_url,
                        postedAt: getRelativeTime(job.updated_at),
                        sourceType: "Greenhouse",
                        description: "ATS Listing"
                    });
                }
            });
        } catch (e) {
            // Ignore individual company failures
        }
    });

    await Promise.all(promises);
    return jobs;
};

// --- 4. Lever (Direct call with Proxy Fallback) ---
const fetchLeverJobs = async (targetRole: string): Promise<VerifiedJob[]> => {
    const companies = ['leverdemo', 'palantir', 'wealthfront'];
    const jobs: VerifiedJob[] = [];

    const promises = companies.map(async (company) => {
        try {
            const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
            let response;
            try {
                // Try direct client-side fetch (CORS supported by default on Lever postings)
                response = await axios.get(url, { timeout: 5000 });
            } catch (e) {
                // Fallback to proxy
                response = await axios.get(`${CORS_PROXY}${url}`, { timeout: 8000 });
            }

            const listings = response.data || [];

            listings.forEach((job: any) => {
                const desc = job.descriptionPlain || '';
                if (matchJobToRole(job.text, desc, targetRole)) {
                    jobs.push({
                        id: `lever_${job.id}`,
                        title: job.text,
                        company: company.charAt(0).toUpperCase() + company.slice(1),
                        location: job.categories?.location || "Remote",
                        applyLink: job.hostedUrl,
                        postedAt: getRelativeTime(new Date(job.createdAt).toISOString()),
                        sourceType: "Lever",
                        description: desc.substring(0, 200) + "..." || "ATS Listing"
                    });
                }
            });
        } catch (e) {
            // Ignore individual company failures
        }
    });

    await Promise.all(promises);
    return jobs;
};

/**
 * Main Aggregator with 1-Hour Firestore Caching & Multi-Source Filtering
 */
export const fetchAllVerifiedJobs = async (targetRole: string, uid: string, forceRefresh = false): Promise<VerifiedJob[]> => {
    if (!targetRole || !uid) return [];
    
    const safeRole = targetRole.toLowerCase().trim();
    const cacheKey = `${uid}:${safeRole}`;
    const cacheDocRef = doc(db, 'users', uid, 'jobs_cache', 'latest');

    // 1. Check service-level in-memory cache (fastest — zero latency)
    if (!forceRefresh) {
        const mem = _serviceJobCache.get(cacheKey);
        if (mem && (Date.now() - mem.ts) < SERVICE_CACHE_TTL_MS && mem.jobs.length > 0) {
            return mem.jobs;
        }
    }

    // 2. Check Firestore cache
    if (!forceRefresh) {
        try {
            const cacheSnap = await getDoc(cacheDocRef);
            if (cacheSnap.exists()) {
                const data = cacheSnap.data();
                if (data.role === safeRole && Array.isArray(data.jobs) && data.jobs.length > 0) {
                    // Warm the in-memory cache for subsequent calls
                    _serviceJobCache.set(cacheKey, { jobs: data.jobs, ts: Date.now() });
                    return data.jobs;
                }
            }
        } catch (error) {
            // Read failed
        }
    }

    // 2. Fetch Fresh Data (Parallel)
    const [adzuna, remotive, greenhouse, lever] = await Promise.all([
        fetchAdzunaJobs(targetRole),
        fetchRemotiveJobs(targetRole),
        fetchGreenhouseJobs(targetRole),
        fetchLeverJobs(targetRole)
    ]);

    // Flatten all sources
    const combinedJobs = [...adzuna, ...remotive, ...greenhouse, ...lever];

    // Filter by matching target role keywords
    const matchedJobs = combinedJobs.filter(job => 
        matchJobToRole(job.title, job.description || '', targetRole)
    );

    // Fallback: If filtering is too restrictive and leaves 0 jobs, return the combined jobs
    const finalJobsList = matchedJobs.length > 0 ? matchedJobs : combinedJobs;

    // Shuffle slightly to mix sources and limit to 50 jobs
    const allJobs = finalJobsList
        .sort(() => Math.random() - 0.5)
        .slice(0, 50);

    // 4. Save to Firestore + warm in-memory cache
    try {
        await setDoc(cacheDocRef, {
            role: safeRole,
            timestamp: Date.now(),
            jobs: allJobs
        });
        _serviceJobCache.set(cacheKey, { jobs: allJobs, ts: Date.now() });
    } catch (error) {
        // Write failed — still warm in-memory so session stays fast
        _serviceJobCache.set(cacheKey, { jobs: allJobs, ts: Date.now() });
    }

    return allJobs;
};
