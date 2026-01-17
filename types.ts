export enum AppView {
  LANDING = 'LANDING',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PLAN = 'PLAN',
  INTERVIEW = 'INTERVIEW',
  JOBS = 'JOBS',
  PROJECTS = 'PROJECTS',
  TRENDS = 'TRENDS',
  RESUME = 'RESUME'
}

export interface UserProfile {
  name: string;
  targetRole: string;
  resumeText?: string;
  resumeFile?: {
    data: string; // Base64
    mimeType: string;
  };
  isPremium?: boolean;
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

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedAt?: string; // e.g., "2 days ago"
  matchScore: number;
  description: string;
  skillsMatched: string[];
  applyLink?: string; // URL to the job posting
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
  sourcePaper?: ResearchPaperSource;
  implementationResources?: Array<{ name: string; url: string }>;
}

export interface MarketTrend {
  role: string;
  salaryRange: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  hotTechnologies: Array<{
    name: string;
    growthReason: string;
  }>;
  industryNews: Array<{
    headline: string;
    summary: string;
    impact: string; // How it affects the career
  }>;
}

export interface InterviewFeedback {
  score: number; // 0-10
  feedbackSummary: string;
  strengths: string[];
  improvements: string[];
  recommendedFocus: string; // One specific area to study
}

export interface ResumeImprovement {
  category: 'Impact' | 'Keywords' | 'Formatting' | 'Clarity';
  suggestion: string;
  originalSnippet?: string;
  improvedSnippet?: string;
}

export interface ResumeOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  atsScore: {
    before: number;
    after: number;
  };
  keyImprovements: ResumeImprovement[];
  missingKeywordsAdded: string[];
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