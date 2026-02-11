/**
 * SEO Service for CareerPilot
 * Handles canonical URLs, meta tags, and SEO optimizations
 */

const BASE_URL = 'https://careerpilotai.co.in';

/**
 * Page-specific SEO metadata
 */
interface PageSEO {
    title: string;
    description: string;
    canonicalPath: string;
    keywords?: string;
    noindex?: boolean; // For pages that shouldn't be indexed
}

/**
 * SEO configuration for each page/view
 */
const PAGE_SEO_CONFIG: Record<string, PageSEO> = {
    '/': {
        title: 'CareerPilot AI - AI Career Companion | Learning Plans, Resume Builder & Mock Interviews',
        description: 'CareerPilot AI is an AI-powered career companion helping students and professionals with personalized learning plans, resume building, portfolio projects, and AI mock interviews.',
        canonicalPath: '/',
        keywords: 'CareerPilot AI, AI career companion, AI career guidance, AI learning plan generator, AI resume builder, portfolio builder, AI mock interview'
    },
    '/login': {
        title: 'Login | CareerPilot AI',
        description: 'Sign in to your CareerPilot AI account to access personalized learning plans, resume tools, and AI mock interviews.',
        canonicalPath: '/login',
        noindex: true // Login pages typically shouldn't be indexed
    },
    '/signup': {
        title: 'Sign Up | CareerPilot AI',
        description: 'Create your CareerPilot AI account and start your AI-powered career journey today.',
        canonicalPath: '/signup',
        noindex: true
    },
    '/dashboard': {
        title: 'Dashboard | CareerPilot AI',
        description: 'View your career readiness score, track progress, and access all CareerPilot AI features from your personalized dashboard.',
        canonicalPath: '/dashboard',
        noindex: true // User-specific pages shouldn't be indexed
    },
    '/learning-plan': {
        title: 'AI Learning Plan | CareerPilot AI',
        description: 'Get a personalized AI-generated learning plan tailored to your career goals and skill gaps.',
        canonicalPath: '/learning-plan',
        noindex: true
    },
    '/plan': {
        title: 'Learning Plan | CareerPilot AI',
        description: 'Access your personalized learning roadmap with weekly tasks and progress tracking.',
        canonicalPath: '/learning-plan', // Canonical to main path
        noindex: true
    },
    '/build-portfolio': {
        title: 'AI Portfolio Builder | CareerPilot AI',
        description: 'Build an impressive portfolio with AI-generated project ideas tailored to your target role and skill level.',
        canonicalPath: '/build-portfolio',
        noindex: true
    },
    '/projects': {
        title: 'Portfolio Projects | CareerPilot AI',
        description: 'Discover and build portfolio projects that showcase your skills to potential employers.',
        canonicalPath: '/build-portfolio', // Canonical to main path
        noindex: true
    },
    '/resume-architect': {
        title: 'AI Resume Architect | CareerPilot AI',
        description: 'Optimize your resume with AI-powered analysis and ATS-friendly improvements.',
        canonicalPath: '/resume-architect',
        noindex: true
    },
    '/resume': {
        title: 'Resume Builder | CareerPilot AI',
        description: 'Create and optimize your resume with AI-powered suggestions and ATS optimization.',
        canonicalPath: '/resume-architect', // Canonical to main path
        noindex: true
    },
    '/interview-prep': {
        title: 'AI Mock Interview | CareerPilot AI',
        description: 'Practice with AI-powered mock interviews tailored to your target role and company.',
        canonicalPath: '/interview-prep',
        noindex: true
    },
    '/interview': {
        title: 'Mock Interview | CareerPilot AI',
        description: 'Prepare for your dream job with realistic AI mock interviews and detailed feedback.',
        canonicalPath: '/mockinterview', // Canonical to main path
        noindex: true
    },
    // Actual app routes (different from SEO-friendly URLs)
    '/resumearchitect': {
        title: 'AI Resume Architect | CareerPilot AI',
        description: 'Optimize your resume with AI-powered analysis and ATS-friendly improvements.',
        canonicalPath: '/resumearchitect',
        noindex: true
    },
    '/mockinterview': {
        title: 'AI Mock Interview | CareerPilot AI',
        description: 'Practice with AI-powered mock interviews tailored to your target role and company.',
        canonicalPath: '/mockinterview',
        noindex: true
    },
    '/onboarding': {
        title: 'Get Started | CareerPilot AI',
        description: 'Set up your CareerPilot AI profile to get personalized career guidance and recommendations.',
        canonicalPath: '/onboarding',
        noindex: true
    }
};

/**
 * Cleans a URL path by:
 * 1. Removing trailing slashes (except for root)
 * 2. Removing UTM and tracking parameters
 * 3. Removing other common tracking parameters
 * 4. Converting to lowercase
 */
export function cleanUrlPath(path: string): string {
    // Remove query string entirely for canonical purposes
    let cleanPath = path.split('?')[0].split('#')[0];

    // Remove trailing slash (except for root)
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
    }

    // Ensure path starts with /
    if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
    }

    return cleanPath.toLowerCase();
}

/**
 * Gets the canonical URL for a given path
 * Strips tracking parameters and normalizes the URL
 */
export function getCanonicalUrl(path: string): string {
    const cleanPath = cleanUrlPath(path);

    // Check if we have specific canonical config for this path
    const config = PAGE_SEO_CONFIG[cleanPath];
    if (config) {
        return `${BASE_URL}${config.canonicalPath}`;
    }

    // Default: use the cleaned path
    return `${BASE_URL}${cleanPath || '/'}`;
}

/**
 * Gets SEO metadata for a given path
 */
export function getPageSEO(path: string): PageSEO {
    const cleanPath = cleanUrlPath(path);

    // Return specific config if available
    if (PAGE_SEO_CONFIG[cleanPath]) {
        return PAGE_SEO_CONFIG[cleanPath];
    }

    // Default fallback
    return {
        title: 'CareerPilot AI - AI Career Companion',
        description: 'AI-powered career guidance platform offering learning plans, resume building, portfolio projects, and mock interview practice.',
        canonicalPath: cleanPath || '/'
    };
}

/**
 * Updates the page's SEO meta tags dynamically
 * Should be called on route changes in the SPA
 */
export function updatePageSEO(path: string): void {
    const seo = getPageSEO(path);
    const canonicalUrl = getCanonicalUrl(path);

    // Update document title
    document.title = seo.title;

    // Update or create canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (metaDescription) {
        metaDescription.content = seo.description;
    }

    // Update meta keywords if provided
    if (seo.keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
        if (metaKeywords) {
            metaKeywords.content = seo.keywords;
        }
    }

    // Update robots meta tag for noindex pages
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (robotsMeta) {
        robotsMeta.content = seo.noindex ? 'noindex, nofollow' : 'index, follow';
    }

    // Update Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (ogUrl) {
        ogUrl.content = canonicalUrl;
    }

    // Update Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    if (ogTitle) {
        ogTitle.content = seo.title;
    }

    // Update Open Graph description
    let ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    if (ogDescription) {
        ogDescription.content = seo.description;
    }

    // Update Twitter title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
    if (twitterTitle) {
        twitterTitle.content = seo.title;
    }

    // Update Twitter description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
    if (twitterDescription) {
        twitterDescription.content = seo.description;
    }
}

/**
 * Hook to manage SEO on route changes
 * Usage: useSEO() in your App component
 */
export function useSEO(location: { pathname: string; search: string }): void {
    // Update SEO whenever the path changes
    updatePageSEO(location.pathname);
}

/**
 * Checks if the current URL needs to be normalized (redirect)
 * Returns the correct URL if redirect is needed, null otherwise
 */
export function checkUrlNormalization(currentUrl: string): string | null {
    try {
        const url = new URL(currentUrl);
        let needsRedirect = false;
        let normalizedPath = url.pathname;

        // Check for trailing slash (except root)
        if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
            normalizedPath = normalizedPath.slice(0, -1);
            needsRedirect = true;
        }

        // Check for uppercase characters
        if (normalizedPath !== normalizedPath.toLowerCase()) {
            normalizedPath = normalizedPath.toLowerCase();
            needsRedirect = true;
        }

        // Strip tracking parameters from URL (for cleaner history)
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'dclid', 'mc_cid', 'mc_eid',
            '_ga', '_gl', 'ref', 'source'
        ];

        let hasTrackingParams = false;
        trackingParams.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                hasTrackingParams = true;
            }
        });

        if (hasTrackingParams || needsRedirect) {
            url.pathname = normalizedPath;
            return url.href;
        }

        return null;
    } catch {
        return null;
    }
}

export default {
    getCanonicalUrl,
    getPageSEO,
    updatePageSEO,
    useSEO,
    checkUrlNormalization,
    cleanUrlPath
};
