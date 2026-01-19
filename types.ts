export enum AppView {
  LANDING = 'LANDING',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PLAN = 'PLAN',
  INTERVIEW = 'INTERVIEW',
  PROJECTS = 'PROJECTS',
  RESUME = 'RESUME'
}

export interface UserProfile {
  name: string;
  targetRole: string;
  experienceLevel?: string; // student, fresher, junior, mid, senior
  graduationYear?: string;
  targetCompanies?: string; // Comma-separated dream companies
  resumeText?: string;
  resumeFile?: {
    data: string; // Base64
    mimeType: string;
  };
  isPremium?: boolean;
  isResumeUnlocked?: boolean;
}

export interface Skill {
  name: string;
  category: 'technical' | 'soft' | 'domain';
  status: 'acquired' | 'missing' | 'in-progress';
}

export interface CareerAnalysis {
  readinessScore: number; // 0-100
  summary: string;
  skills: Skill[];
  strengths: string[];
  weaknesses: string[];
}

export interface LearningTask {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'project' | 'reading';
  estimatedHours: number;
  completed: boolean;
  videoQuery?: string; // For YouTube search
}

export interface WeeklyPlan {
  weekNumber: number;
  theme: string;
  tasks: LearningTask[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}


export interface ResearchPaperSource {
  title: string;
  authors: string[];
  url: string;
  publishedDate: string;
  abstractSummary: string;
}

export interface ProjectIdea {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  techStack: string[];
  keyFeatures: string[];
  resumeValue: string; // Why this helps on a resume
  implementationFlow: string[]; // Step-by-step guide
  learningOutcomes: string[]; // What the student learns
  sourcePaper?: ResearchPaperSource;
  implementationResources?: Array<{ name: string; url: string }>;
}



// Interview System Types
export interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'dsa' | 'system-design' | 'project' | 'conceptual';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  context?: string;
  expectedKeyPoints?: string[];
  followUps?: string[];
  topic?: string; // e.g., "OOP", "DBMS", "OS", "Networks"
}

export interface InterviewRound {
  roundName: string;
  duration: string;
  questions: InterviewQuestion[];
  tips: string[];
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  score?: number;
  feedback?: string;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  targetCompany: string;
  rounds: InterviewRound[];
  answers: InterviewAnswer[];
  overallScore?: number;
  startedAt: number;
  completedAt?: number;
}

export interface InterviewFeedback {
  score: number; // 0-10
  feedbackSummary: string;
  strengths: string[];
  improvements: string[];
  recommendedFocus: string;
}

export interface ResumeImprovement {
  category: 'Impact' | 'Keywords' | 'Formatting' | 'Clarity' | 'Quantification';
  suggestion: string;
  originalSnippet: string;
  improvedSnippet: string;
  impact?: 'high' | 'medium' | 'low';
}

export interface ResumeOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  atsScore: {
    before: number;
    after: number;
    breakdown?: {
      keywordMatch: number;
      quantification: number;
      actionVerbs: number;
      formatting: number;
      relevance: number;
    };
  };
  keyImprovements: ResumeImprovement[];
  missingKeywordsAdded: string[];
  weaknessesAddressed?: string[];
  nextSteps?: string[];
}

export interface LatexResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  skills: {
    languages: string[];
    technologies: string[];
    tools: string[];
  };
  experience: {
    title: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    university: string;
    location: string;
    dates: string;
    gpa?: string;
  }[];
  projects?: {
    name: string;
    technologies: string;
    date?: string;
    bullets: string[];
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
  }[];
}