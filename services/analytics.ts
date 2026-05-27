import mixpanel from 'mixpanel-browser';
import ReactGA from 'react-ga4';

// Analytics Configuration
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'demo-token';
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

class AnalyticsService {
    private initialized = false;

    constructor() {
        this.init();
    }

    init() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            // Initialize Mixpanel
            mixpanel.init(MIXPANEL_TOKEN, {
                debug: import.meta.env.DEV,
                track_pageview: true,
                persistence: 'localStorage',
                ignore_dnt: false
            });

            // Initialize Google Analytics
            if (GA_MEASUREMENT_ID) {
                ReactGA.initialize(GA_MEASUREMENT_ID);
            }

            this.initialized = true;

        } catch (error) {

        }
    }

    // Identify User
    identify(userId: string, traits?: Record<string, any>) {
        if (!this.initialized) return;

        try {
            mixpanel.identify(userId);
            if (traits) {
                mixpanel.people.set(traits);
            }

        } catch (error) {

        }
    }

    // Track Event
    track(eventName: string, properties?: Record<string, any>) {
        if (!this.initialized) return;

        try {
            // Mixpanel
            mixpanel.track(eventName, {
                ...properties,
                timestamp: new Date().toISOString(),
                platform: 'web'
            });

            // Google Analytics
            if (GA_MEASUREMENT_ID) {
                ReactGA.event({
                    category: properties?.category || 'User Action',
                    action: eventName,
                    label: properties?.label,
                    value: properties?.value
                });
            }


        } catch (error) {

        }
    }

    // Track Page View
    page(pageName: string, properties?: Record<string, any>) {
        if (!this.initialized) return;

        try {
            mixpanel.track('Page View', {
                page: pageName,
                ...properties
            });

            if (GA_MEASUREMENT_ID) {
                ReactGA.send({ hitType: 'pageview', page: pageName });
            }


        } catch (error) {

        }
    }

    // Track User Properties
    setUserProperties(properties: Record<string, any>) {
        if (!this.initialized) return;

        try {
            mixpanel.people.set(properties);
        } catch (error) {

        }
    }

    // Increment User Property
    incrementProperty(property: string, value: number = 1) {
        if (!this.initialized) return;

        try {
            mixpanel.people.increment(property, value);
        } catch (error) {

        }
    }

    // Reset (on logout)
    reset() {
        if (!this.initialized) return;

        try {
            mixpanel.reset();

        } catch (error) {

        }
    }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Event Names (for consistency)
export const EVENTS = {
    // Authentication
    SIGNUP_STARTED: 'Signup Started',
    SIGNUP_COMPLETED: 'Signup Completed',
    LOGIN_COMPLETED: 'Login Completed',
    LOGOUT: 'Logout',

    // Onboarding
    ONBOARDING_STARTED: 'Onboarding Started',
    RESUME_UPLOADED: 'Resume Uploaded',
    TARGET_ROLE_SELECTED: 'Target Role Selected',
    ONBOARDING_COMPLETED: 'Onboarding Completed',

    // Analysis
    ANALYSIS_STARTED: 'Analysis Started',
    ANALYSIS_COMPLETED: 'Analysis Completed',
    ANALYSIS_FAILED: 'Analysis Failed',

    // Learning Plan
    PLAN_GENERATION_STARTED: 'Plan Generation Started',
    PLAN_GENERATED: 'Plan Generated',
    TASK_COMPLETED: 'Task Completed',
    TASK_ADDED: 'Task Added',
    TASK_DELETED: 'Task Deleted',

    // Projects
    PROJECTS_GENERATED: 'Projects Generated',
    PROJECT_VIEWED: 'Project Viewed',
    PROJECT_DETAILS_OPENED: 'Project Details Opened',
    PROJECT_COPIED: 'Project Copied',

    // Interview
    INTERVIEW_STARTED: 'Interview Started',
    INTERVIEW_MESSAGE_SENT: 'Interview Message Sent',
    INTERVIEW_ENDED: 'Interview Ended',
    INTERVIEW_FEEDBACK_VIEWED: 'Interview Feedback Viewed',

    // Jobs
    JOB_SCAN_STARTED: 'Job Scan Started',
    JOB_SCAN_COMPLETED: 'Job Scan Completed',
    JOB_VIEWED: 'Job Viewed',

    // Resume
    RESUME_OPTIMIZATION_STARTED: 'Resume Optimization Started',
    RESUME_OPTIMIZED: 'Resume Optimized',
    RESUME_DOWNLOADED: 'Resume Downloaded',
    RESUME_COPIED: 'Resume Copied',

    // Navigation
    PAGE_VIEW: 'Page View',
    VIEW_CHANGED: 'View Changed',

    // Engagement
    FEEDBACK_SUBMITTED: 'Feedback Submitted',
    SHARE_CLICKED: 'Share Clicked',
    REFERRAL_LINK_COPIED: 'Referral Link Copied',

    // Errors
    ERROR_OCCURRED: 'Error Occurred',
    API_ERROR: 'API Error'
};

// User Properties (for consistency)
export const USER_PROPS = {
    NAME: 'name',
    EMAIL: 'email',
    TARGET_ROLE: 'targetRole',
    EXPERIENCE_LEVEL: 'experienceLevel',
    GRADUATION_YEAR: 'graduationYear',
    TARGET_COMPANIES: 'targetCompanies',
    SIGNUP_DATE: 'signupDate',
    LAST_ACTIVE: 'lastActive',

    // Engagement Metrics
    TOTAL_ANALYSES: 'totalAnalyses',
    TOTAL_PLANS: 'totalPlans',
    TOTAL_INTERVIEWS: 'totalInterviews',
    TOTAL_PROJECTS: 'totalProjects',
    TOTAL_JOB_SCANS: 'totalJobScans',

    // Progress
    READINESS_SCORE: 'readinessScore',
    SKILLS_ACQUIRED: 'skillsAcquired',
    SKILLS_MISSING: 'skillsMissing'
};
