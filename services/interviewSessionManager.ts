/**
 * INTERVIEW SESSION MANAGER
 * Ensures candidates commit to focused, uninterrupted interview time
 * Critical for monetization and realistic interview experience
 */

export interface InterviewCommitment {
    sessionId: string;
    scheduledStartTime: number; // Unix timestamp
    estimatedDuration: number; // Minutes
    roundsSelected: number[]; // [1, 2, 3] or [1, 2, 3, 4, 5]
    userAgreedToTerms: boolean;
    focusModeEnabled: boolean;
}

export interface InterviewSession {
    id: string;
    userId: string;
    targetRole: string;
    targetCompany: string;

    // Time tracking
    scheduledAt: number;
    startedAt?: number;
    pausedAt?: number;
    resumedAt?: number;
    completedAt?: number;

    // Session state
    status: 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'abandoned';
    currentRound: number;
    totalRounds: number;
    estimatedDuration: number; // Minutes
    actualDuration?: number; // Minutes

    // Focus tracking
    focusModeEnabled: boolean;
    tabSwitchCount: number;
    pauseCount: number;
    warningsIssued: number;

    // Conversation
    messages: any[];

    // Results
    evaluation?: any;
    isPremium: boolean; // For monetization
}

/**
 * Pre-Interview Commitment Flow
 * User must agree to terms before starting
 */
export const createInterviewCommitment = (
    rounds: number[],
    targetRole: string,
    targetCompany: string
): {
    estimatedDuration: number;
    requirements: string[];
    warnings: string[];
    commitment: InterviewCommitment;
} => {

    // Calculate duration based on rounds
    const roundDurations = {
        1: 15, // Behavioral
        2: 30, // Technical/Conceptual
        3: 45, // DSA
        4: 45, // System Design
        5: 20  // Behavioral Advanced
    };

    const totalDuration = rounds.reduce((sum, round) => sum + (roundDurations[round as keyof typeof roundDurations] || 0), 0);

    return {
        estimatedDuration: totalDuration,
        requirements: [
            `✓ Stable internet connection`,
            `✓ Quiet environment with no interruptions`,
            `✓ ${totalDuration} minutes of focused time`,
            `✓ Webcam (optional but recommended)`,
            `✓ Pen and paper for notes/diagrams`,
            `✓ Close all other tabs and applications`
        ],
        warnings: [
            `⚠️ Once started, you cannot pause for more than 2 minutes`,
            `⚠️ Switching tabs will be tracked and may affect your score`,
            `⚠️ Abandoning the interview will count as a failed attempt`,
            `⚠️ You get only ${isPremiumUser() ? 'unlimited' : '3 free'} interviews per month`,
            `⚠️ This interview will be recorded for evaluation purposes`
        ],
        commitment: {
            sessionId: generateSessionId(),
            scheduledStartTime: Date.now(),
            estimatedDuration: totalDuration,
            roundsSelected: rounds,
            userAgreedToTerms: false,
            focusModeEnabled: true
        }
    };
};

/**
 * Start Interview Session
 * Only starts if user has confirmed commitment
 */
export const startInterviewSession = (
    commitment: InterviewCommitment,
    userProfile: any
): InterviewSession => {

    if (!commitment.userAgreedToTerms) {
        throw new Error('User must agree to interview terms before starting');
    }

    const now = Date.now();

    return {
        id: commitment.sessionId,
        userId: userProfile.email || 'guest',
        targetRole: userProfile.targetRole,
        targetCompany: userProfile.targetCompanies?.split(',')[0] || 'Tech Company',

        scheduledAt: commitment.scheduledStartTime,
        startedAt: now,

        status: 'in-progress',
        currentRound: 1,
        totalRounds: commitment.roundsSelected.length,
        estimatedDuration: commitment.estimatedDuration,

        focusModeEnabled: commitment.focusModeEnabled,
        tabSwitchCount: 0,
        pauseCount: 0,
        warningsIssued: 0,

        messages: [],
        isPremium: isPremiumUser()
    };
};

/**
 * Track Focus Violations
 * Monitors tab switches, pauses, and other distractions
 */
export const trackFocusViolation = (
    session: InterviewSession,
    violationType: 'tab-switch' | 'pause' | 'idle' | 'browser-minimize'
): {
    session: InterviewSession;
    warning?: string;
    shouldTerminate: boolean;
} => {

    const updatedSession = { ...session };

    switch (violationType) {
        case 'tab-switch':
            updatedSession.tabSwitchCount++;
            break;
        case 'pause':
            updatedSession.pauseCount++;
            break;
    }

    // Warning thresholds
    const warnings = {
        'tab-switch': 3,
        'pause': 2,
        'idle': 1
    };

    let warning: string | undefined;
    let shouldTerminate = false;

    if (updatedSession.tabSwitchCount >= warnings['tab-switch']) {
        warning = `⚠️ You've switched tabs ${updatedSession.tabSwitchCount} times. This may affect your evaluation. Stay focused!`;
        updatedSession.warningsIssued++;
    }

    if (updatedSession.pauseCount >= warnings['pause']) {
        warning = `⚠️ You've paused ${updatedSession.pauseCount} times. One more pause will terminate the interview.`;
        updatedSession.warningsIssued++;
    }

    // Terminate if too many violations
    if (updatedSession.warningsIssued >= 3 || updatedSession.pauseCount >= 3) {
        shouldTerminate = true;
        updatedSession.status = 'abandoned';
    }

    return {
        session: updatedSession,
        warning,
        shouldTerminate
    };
};

/**
 * Pause Interview
 * Limited pauses allowed (max 2 minutes each)
 */
export const pauseInterview = (
    session: InterviewSession
): {
    success: boolean;
    message: string;
    maxPauseDuration: number; // Seconds
} => {

    if (session.pauseCount >= 2) {
        return {
            success: false,
            message: 'Maximum pause limit reached. You cannot pause again.',
            maxPauseDuration: 0
        };
    }

    return {
        success: true,
        message: 'Interview paused. You have 2 minutes to return.',
        maxPauseDuration: 120 // 2 minutes
    };
};

/**
 * Complete Interview Session
 */
export const completeInterviewSession = (
    session: InterviewSession,
    evaluation: any
): InterviewSession => {

    const now = Date.now();
    const actualDuration = session.startedAt
        ? Math.round((now - session.startedAt) / 60000) // Convert to minutes
        : 0;

    return {
        ...session,
        status: 'completed',
        completedAt: now,
        actualDuration,
        evaluation
    };
};

/**
 * Check if user can start a new interview
 * Free users: 3 interviews/month
 * Premium users: Unlimited
 */
export const canStartNewInterview = (
    userId: string,
    previousSessions: InterviewSession[]
): {
    canStart: boolean;
    reason?: string;
    remainingInterviews?: number;
} => {

    const isPremium = isPremiumUser();

    if (isPremium) {
        return { canStart: true };
    }

    // Check monthly limit for free users
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const recentSessions = previousSessions.filter(
        s => s.startedAt && s.startedAt > oneMonthAgo
    );

    const FREE_INTERVIEW_LIMIT = 3;
    const remaining = FREE_INTERVIEW_LIMIT - recentSessions.length;

    if (remaining <= 0) {
        return {
            canStart: false,
            reason: 'You have reached your monthly limit of 3 free interviews. Upgrade to Premium for unlimited interviews.',
            remainingInterviews: 0
        };
    }

    return {
        canStart: true,
        remainingInterviews: remaining
    };
};

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
    return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is premium
 * TODO: Integrate with actual payment system
 */
function isPremiumUser(): boolean {
    return true;
}

/**
 * Get interview pricing tiers
 */
export const getInterviewPricing = () => {
    return {
        free: {
            name: 'Free',
            price: 0,
            interviews: 3,
            features: [
                '3 mock interviews per month',
                'Basic feedback',
                'Resume analysis',
                'Learning roadmap'
            ]
        },
        pro: {
            name: 'Pro',
            price: 19,
            currency: 'USD',
            period: 'month',
            interviews: 'unlimited',
            features: [
                'Unlimited mock interviews',
                'Detailed feedback with scores',
                'Company-specific prep',
                'Resume optimization',
                'Priority support',
                'Interview recordings'
            ]
        },
        premium: {
            name: 'Premium',
            price: 49,
            currency: 'USD',
            period: 'month',
            interviews: 'unlimited',
            features: [
                'Everything in Pro',
                '1-on-1 mentorship (2 sessions/month)',
                'Referral network access',
                'Custom learning plans',
                'Job application tracking',
                'Salary negotiation guide'
            ]
        }
    };
};
