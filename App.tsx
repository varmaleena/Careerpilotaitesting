import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Briefcase,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Code,
  Compass,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Link,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  MessageSquare,
  History,
  Mic,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Send,
  Target,
  Trash2,
  TrendingUp,
  UploadCloud,
  User,
  Users,
  UserPlus,
  Volume2,
  VolumeX,
  X,
  CheckCircle,
  List,
  Youtube,
  Github,
  Smartphone,
  Globe,
  CreditCard,
  Receipt,
  Linkedin,
  Edit2,
  Save,
  Zap,
  Share2,
  Sparkles,
  Flame,
  Calendar,
  Activity
} from 'lucide-react';

import LandingPage from "./components/LandingPage";
import { FeedbackModal } from './components/FeedbackModal';
import { ScoreGauge } from "./components/ScoreGauge";
import Sidebar from "./components/Sidebar";
import MobileBottomNav from "./components/MobileBottomNav";
import { SkillCard } from "./components/SkillCard";
import { ShareSuccessModal } from "./components/ShareSuccessModal";
import { DailyQuest } from "./components/DailyQuest";
import { InterviewAnalysisView } from "./components/InterviewAnalysisView";
import { ConfirmResetModal } from "./components/ConfirmResetModal";
import { ProfileModal } from "./components/ProfileModal";
import { EmptyState } from "./components/EmptyState";
import { AuthService } from './services/authService';
import { canStartNewInterview } from './services/interviewSessionManager';
import { generateLearningPlan, generateProjectIdeas } from './services/learningService';
import { calculatePlanStatistics, getProgressMessage, getCurrentWeek } from './services/planStatistics';
import { downloadLatexPdf, downloadResumeAsPdf } from './services/pdfExportService';
import { extractTextFromPdf } from './services/pdfService';
import { evaluatePremiumInterview, generatePremiumInterviewResponse } from './services/premiumInterviewService';
import { analyzeProfile, generateLatexData, optimizeResume, validateResumeContent } from './services/resumeService';
import { analytics, EVENTS, USER_PROPS } from './services/analytics';
import {
  AppView,
  CareerAnalysis,
  ChatMessage,
  InterviewFeedback,
  LatexResumeData,
  PastInterview,
  ProjectIdea,
  ResumeOptimizationResult,
  UserProfile,
  WeeklyPlan
} from './types';

// LaTeX Character Escaping Function
const escapeLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

// Convert Structured Resume Data to LaTeX Format
const generateLatexDocument = (data: LatexResumeData): string => {
  const { personalInfo, summary, skills, experience, education, projects, certifications, achievements } = data;

  // Header
  const header = `
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName)}} \\\\ \\vspace{1pt}
    \\small ${personalInfo.phone ? escapeLatex(personalInfo.phone) + " $|$ " : ""}${personalInfo.email ? `\\href{mailto:${personalInfo.email}}{\\underline{${escapeLatex(personalInfo.email)}}}` + " $|$ " : ""}${personalInfo.linkedin ? escapeLatex(personalInfo.linkedin) + " $|$ " : ""}${personalInfo.website ? escapeLatex(personalInfo.website) : ""}
\\end{center}
`;

  // Summary
  const summarySection = summary ? `
%-----------SUMMARY-----------
\\section{Professional Summary}
  \\small{${escapeLatex(summary)}}
` : "";

  // Skills
  let skillsContent = "";
  if (skills.languages?.length || skills.technologies?.length || skills.tools?.length) {
    const langs = skills.languages?.length ? `\\textbf{Languages}{: ${escapeLatex(skills.languages.join(", "))}} \\\\` : "";
    const techs = skills.technologies?.length ? `\\textbf{Technologies}{: ${escapeLatex(skills.technologies.join(", "))}} \\\\` : "";
    const tools = skills.tools?.length ? `\\textbf{Tools}{: ${escapeLatex(skills.tools.join(", "))}}` : "";

    skillsContent = `
%-----------SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     ${langs}
     ${techs}
     ${tools}
    }}
 \\end{itemize}
`;
  }

  // Experience
  let experienceSection = "";
  if (experience?.length) {
    const items = experience.map(exp => {
      const bullets = (exp.bullets || []).map(b => `        \\resumeItem{${escapeLatex(b)}}`).join("\n");
      return `    \\resumeSubheading
      {${escapeLatex(exp.title)}}{${escapeLatex(exp.dates)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location || "")}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
    }).join("\n");

    experienceSection = `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd
`;
  }

  // Education
  let educationSection = "";
  if (education?.length) {
    const items = education.map(edu => {
      // Put CGPA on the same line as dates
      const datesWithGPA = edu.gpa ? `${edu.dates} | CGPA: ${edu.gpa}` : edu.dates;
      return `    \\resumeSubheading
      {${escapeLatex(edu.degree)}}{${escapeLatex(datesWithGPA)}}
      {${escapeLatex(edu.university)}}{${escapeLatex(edu.location || "")}}`;
    }).join("\n");

    educationSection = `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd
`;
  }

  // Projects
  let projectsSection = "";
  if (projects?.length) {
    const items = projects.map(proj => {
      const bullets = (proj.bullets || []).map(b => `        \\resumeItem{${escapeLatex(b)}}`).join("\n");
      return `    \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}} $|$ \\emph{${escapeLatex(proj.technologies)}}}{${escapeLatex(proj.date || "")}}
          \\resumeItemListStart
${bullets}
          \\resumeItemListEnd`;
    }).join("\n");

    projectsSection = `
%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
${items}
    \\resumeSubHeadingListEnd
`;
  }

  // Certifications (Optional)
  let certificationsSection = "";
  if (certifications?.length) {
    const items = certifications.map(cert => {
      const dateText = cert.date && cert.date.trim() ? ` -- ${escapeLatex(cert.date)}` : '';
      return `\\item
          \\textbf{${escapeLatex(cert.name)}}{: ${escapeLatex(cert.issuer)}${dateText}}`;
    }).join("\n");

    certificationsSection = `
%-----------CERTIFICATIONS-----------
\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
${items}
    }
 \\end{itemize}
`;
  }

  // Achievements (Optional)
  let achievementsSection = "";
  if (achievements?.length) {
    const items = achievements.map(ach => {
      return `\\item
          \\textbf{${escapeLatex(ach.title)}}${ach.description ? `: ${escapeLatex(ach.description)}` : ""}`;
    }).join("\n");

    achievementsSection = `
%-----------ACHIEVEMENTS-----------
\\section{Achievements}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
${items}
    }
 \\end{itemize}
`;
  }

  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

${header}

${summarySection}

${skillsContent}

${experienceSection}

${projectsSection}

${educationSection}

${certificationsSection}

${achievementsSection}

\\end{document}`;
};

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const App = () => {
  // --- Global State ---
  const [view, setView] = useState<AppView>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/onboarding')) return AppView.ONBOARDING;
    if (path.startsWith('/dashboard')) return AppView.DASHBOARD;
    if (path.startsWith('/plan')) return AppView.PLAN;
    if (path.startsWith('/projects')) return AppView.PROJECTS;
    if (path.startsWith('/resumearchitect')) return AppView.RESUME;
    if (path.startsWith('/mockinterview')) return AppView.INTERVIEW;
    return AppView.LANDING;
  });

  // --- Routing Sync ---
  const navigate = useNavigate();
  const location = useLocation();

  // 1. URL -> View Sync
  useEffect(() => {
    const path = location.pathname;
    let newView = AppView.LANDING;

    if (path === '/' || path === '') newView = AppView.LANDING;
    else if (path.startsWith('/onboarding')) newView = AppView.ONBOARDING;
    else if (path.startsWith('/dashboard')) newView = AppView.DASHBOARD;
    else if (path.startsWith('/plan')) newView = AppView.PLAN;
    else if (path.startsWith('/projects')) newView = AppView.PROJECTS;
    else if (path.startsWith('/resumearchitect')) newView = AppView.RESUME;
    else if (path.startsWith('/mockinterview')) newView = AppView.INTERVIEW;

    // Only update if different to prevent loops
    if (view !== newView) {
      setView(newView);
    }
  }, [location.pathname]);

  // 2. View -> URL Sync
  useEffect(() => {
    let targetPath = '/';
    switch (view) {
      case AppView.LANDING: targetPath = '/'; break;
      case AppView.ONBOARDING: targetPath = '/onboarding'; break;
      case AppView.DASHBOARD: targetPath = '/dashboard'; break;
      case AppView.PLAN: targetPath = '/plan'; break;
      case AppView.PROJECTS: targetPath = '/projects'; break;
      case AppView.RESUME: targetPath = '/resumearchitect'; break;
      case AppView.INTERVIEW: targetPath = '/mockinterview'; break;
      default: targetPath = '/';
    }

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [view]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Modals & UI State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'payments'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Auth Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // User Data State
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', targetRole: '' });
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Learning Plan
  const [plan, setPlan] = useState<WeeklyPlan[] | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [addingTaskWeek, setAddingTaskWeek] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'course' | 'project' | 'reading'>('reading');
  const [newTaskHours, setNewTaskHours] = useState(1);


  // Resume Optimizer
  const [optimizedResume, setOptimizedResume] = useState<string>('');
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<ResumeOptimizationResult | null>(null);
  const [isOptimizingResume, setIsOptimizingResume] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectIdea | null>(null);
  const [resumeFormat, setResumeFormat] = useState<'text' | 'latex'>('text');
  const [latexResume, setLatexResume] = useState<string>('');
  const [latexData, setLatexData] = useState<LatexResumeData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Projects
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [seenProjectTitles, setSeenProjectTitles] = useState<string[]>([]);
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false);

  // Premium Interview System
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
  const [interviewElapsedSeconds, setInterviewElapsedSeconds] = useState(0);
  const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [interviewCommitment, setInterviewCommitment] = useState<any>(null);

  // Trends


  // Interview
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatInstance, setChatInstance] = useState<any | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [showPastInterviewsDropdown, setShowPastInterviewsDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const recognitionStoppedRef = useRef(false); // Track intentional stops to prevent stale transcripts

  // Upload State
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Browser Support Detection
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);

  // Modal States
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);

  // Navigation Loading State
  const [isNavigating, setIsNavigating] = useState(false);

  // Detect Speech Recognition support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechRecognitionSupported(!!SpeechRecognition);
  }, []);

  // --- Persistence Effects ---

  // --- Session Persistence ---

  // Hydrate session on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('careerPilot_session_email');
    if (savedEmail) {
      // Attempt auto-login
      loginUser(savedEmail).catch(err => {
        console.error("Session restoration failed", err);
        localStorage.removeItem('careerPilot_session_email');
      });
    }
  }, []);

  // Save state on critical updates ONLY if logged in
  useEffect(() => {
    if (isLoggedIn && currentUserEmail) {
      localStorage.setItem('careerPilot_session_email', currentUserEmail); // Keep session alive

      AuthService.saveUserData(currentUserEmail, {
        userProfile,
        analysis,
        plan,
        projects,

        chatMessages,
        interviewFeedback,
        resumeAnalysisResult,
        seenProjectTitles
      });
    }
  }, [
    isLoggedIn,
    currentUserEmail,
    userProfile,
    analysis,
    plan,
    projects,

    chatMessages,
    interviewFeedback,
    resumeAnalysisResult,
    seenProjectTitles
  ]);

  // Analytics: Identify user and track properties
  useEffect(() => {
    if (isLoggedIn && currentUserEmail) {
      analytics.identify(currentUserEmail, {
        [USER_PROPS.NAME]: userProfile.name,
        [USER_PROPS.EMAIL]: currentUserEmail,
        [USER_PROPS.TARGET_ROLE]: userProfile.targetRole,
        [USER_PROPS.EXPERIENCE_LEVEL]: userProfile.experienceLevel,
        [USER_PROPS.GRADUATION_YEAR]: userProfile.graduationYear,
        [USER_PROPS.TARGET_COMPANIES]: userProfile.targetCompanies,
        [USER_PROPS.LAST_ACTIVE]: new Date().toISOString(),
        [USER_PROPS.READINESS_SCORE]: analysis?.readinessScore,
        [USER_PROPS.SKILLS_ACQUIRED]: analysis?.skills?.filter(s => s.status === 'acquired').length || 0,
        [USER_PROPS.SKILLS_MISSING]: analysis?.skills?.filter(s => s.status === 'missing').length || 0
      });
    }
  }, [isLoggedIn, currentUserEmail, userProfile, analysis]);

  // Analytics: Track page views
  useEffect(() => {
    analytics.page(view, {
      targetRole: userProfile.targetRole,
      isLoggedIn
    });
  }, [view]);

  // Persist current view to localStorage for page reload restoration
  useEffect(() => {
    if (isLoggedIn && view !== AppView.LANDING && view !== AppView.ONBOARDING) {
      localStorage.setItem('careerPilot_last_view', view);
    }
  }, [view, isLoggedIn]);

  // Show loading indicator during navigation
  useEffect(() => {
    if (isLoggedIn) {
      setIsNavigating(true);
      const timer = setTimeout(() => setIsNavigating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [view, isLoggedIn]);

  // CRITICAL FIX: Cancel audio when switching views
  useEffect(() => {
    if (view !== AppView.INTERVIEW) {
      window.speechSynthesis.cancel();
      setIsListening(false);
      setIsInterviewStarted(false);
      setInterviewFeedback(null);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [view]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Interview timer
  useEffect(() => {
    if (!isInterviewStarted || !interviewStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000);
      setInterviewElapsedSeconds(elapsed);

      // Auto-end interview after 35 minutes (2100 seconds)
      if (elapsed >= 2100) {
        handleEndInterview();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewStarted, interviewStartTime]);

  // Initial scan when entering views
  useEffect(() => {
    if (view === AppView.PROJECTS && projects?.length === 0) {
      handleGenerateProjects();
    }

  }, [view]);

  // --- Helpers ---
  const handleApiError = (error: any, defaultMsg: string) => {
    console.error(error);
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      const msg = "🚦 AI System Busy\n\nAll API keys have reached their rate limit. This typically resets within a few minutes.\n\n✅ What to do:\n• Wait 2-3 minutes and try again\n• The system is automatically retrying with backup keys\n\nIf this persists, the daily quota may have been reached. Quotas reset at midnight Pacific Time.";
      alert(msg);
    } else {
      alert(`${defaultMsg}: ${error.message || "Unknown error"}.`);
    }
  };

  // --- Auth Handlers ---

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Empty field validation
    if (!emailInput.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Please enter your password.');
      return;
    }

    // Format validation
    if (!AuthService.isValidEmail(emailInput)) {
      setAuthError('Please enter a valid email address (e.g., you@example.com).');
      return;
    }
    // Password format validation only for signup (login validates against database)
    if (authMode === 'signup' && !AuthService.isValidPassword(passwordInput)) {
      const errors = AuthService.getPasswordValidationErrors(passwordInput);
      setAuthError('Password requirements: ' + errors.join(', '));
      return;
    }
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const result = await AuthService.signup(emailInput, passwordInput);
        if (result.success) {
          // Auto login after signup
          await loginUser(emailInput);
        } else {
          setAuthError(result.message || 'Signup failed.');
        }
      } else {
        const result = await AuthService.login(emailInput, passwordInput);
        if (result.success) {
          await loginUser(emailInput);
        } else {
          setAuthError(result.message || 'Login failed.');
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await AuthService.loginWithGoogle();
      if (result.success && result.email) {
        await loginUser(result.email);
      } else {
        setAuthError(result.message || 'Google Login failed.');
      }
    } catch (err) {
      setAuthError("An unexpected error occurred during Google Login.");
    }
  };



  // ... (existing state)

  const loginUser = async (email: string) => {
    const userData = await AuthService.getUserData(email);
    if (userData) {
      // Calculate Streak
      const today = new Date().toDateString();
      const lastDatestr = userData.userProfile.lastLoginDate;
      const lastLogin = lastDatestr ? new Date(lastDatestr).toDateString() : null;

      let newStreak = userData.userProfile.streak || 1;
      let newXp = userData.userProfile.xp || 0;

      if (lastLogin !== today) {
        // New day login
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastLogin === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // broken streak
        }
        // Save new login date
        userData.userProfile.lastLoginDate = new Date().toISOString();
        userData.userProfile.streak = newStreak;
        userData.userProfile.xp = newXp + 10; // Bonus for daily login

        // Persist immediately
        await AuthService.saveUserData(email, userData);
      }

      // Hydrate State
      setCurrentUserEmail(email);
      setIsLoggedIn(true);
      setShowAuthModal(false);

      setUserProfile(userData.userProfile);
      setAnalysis(userData.analysis ? {
        ...userData.analysis,
        strengths: userData.analysis.strengths || [],
        weaknesses: userData.analysis.weaknesses || []
      } : null);
      setPlan(userData.plan);
      setProjects(userData.projects || []);
      setSeenProjectTitles(userData.seenProjectTitles || []);

      setChatMessages(userData.chatMessages || []);
      setInterviewFeedback(userData.interviewFeedback);
      setResumeAnalysisResult(userData.resumeAnalysisResult || null);

      // Route Logic
      if (userData.analysis) {
        const lastView = localStorage.getItem('careerPilot_last_view') as AppView;
        const validViews = [AppView.DASHBOARD, AppView.PLAN, AppView.PROJECTS, AppView.RESUME, AppView.INTERVIEW];

        if (lastView && validViews.includes(lastView)) {
          setView(lastView);
        } else {
          setView(AppView.DASHBOARD);
        }
      } else {
        setView(AppView.ONBOARDING);
      }
    } else {
      setAuthError("Critical error loading user data.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserEmail('');
    localStorage.removeItem('careerPilot_session_email'); // Clear persistent session

    // Reset all local state
    setUserProfile({ name: 'User', targetRole: '' });
    setAnalysis(null);
    setPlan(null);
    setProjects([]);
    setSeenProjectTitles([]);

    setChatMessages([]);
    setInterviewFeedback(null);

    setView(AppView.LANDING);
  };

  const handleResetData = () => {
    if (!currentUserEmail) return;
    setShowConfirmResetModal(true);
  };

  const confirmResetData = async () => {
    if (!currentUserEmail) return;

    try {
      // Preserve critical account data
      const preservedProfile = {
        ...userProfile,
        targetRole: '', // Reset target
        resumeText: '', // Reset resume
        resumeFile: undefined,
        experienceLevel: '',
        graduationYear: '',
        targetCompanies: '',
        // Explicitly keep these (though spread ...userProfile handles it, being explicit is safer against future changes)
        isPremium: userProfile.isPremium,
        paymentHistory: userProfile.paymentHistory,
        streak: userProfile.streak,
        xp: userProfile.xp,
        credits: userProfile.credits
      };

      const emptyData = {
        userProfile: preservedProfile,
        analysis: null,
        plan: null,
        projects: [],
        seenProjectTitles: [],

        chatMessages: [],
        interviewFeedback: null,
        resumeAnalysisResult: null
      };

      // Save empty data to storage
      await AuthService.saveUserData(currentUserEmail, emptyData);

      // Hydrate state with empty data
      setUserProfile(preservedProfile);
      setAnalysis(null);
      setPlan(null);
      setProjects([]);
      setSeenProjectTitles([]);

      setChatMessages([]);
      setInterviewFeedback(null);
      setView(AppView.ONBOARDING);
    } catch (error) {
      console.error("Reset failed:", error);
      alert("Failed to reset data. Please try again.");
    }
  };

  const handleSwitchTrack = () => {
    if (window.confirm("This will start a new career track but keep your resume. Are you sure?")) {
      setUserProfile(prev => ({ ...prev, targetRole: '' }));
      setAnalysis(null);
      setPlan(null);
      setProjects([]);
      setSeenProjectTitles([]);

      setChatMessages([]);
      setInterviewFeedback(null);
      setView(AppView.ONBOARDING);
    }
  };

  // --- App Logic Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Please upload a PDF smaller than 2MB.");
        return;
      }

      setIsUploadingResume(true);

      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          setUserProfile(prev => ({
            ...prev,
            resumeFile: {
              data: base64String,
              mimeType: file.type
            }
          }));
          setIsUploadingResume(false);
        };
        reader.onerror = () => {
          alert("Failed to read file. Please try again.");
          setIsUploadingResume(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload file. Please try again.");
        setIsUploadingResume(false);
      }
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userProfile?.resumeText && !userProfile?.resumeFile) || !userProfile?.targetRole) return;

    setIsAnalyzing(true);
    setValidationError(''); // Clear any previous error
    try {
      // Step 1: Validate document is a real resume before analysis
      const validation = await validateResumeContent({
        text: userProfile.resumeText,
        file: userProfile.resumeFile
      });

      if (!validation.isValid) {
        // Use the specific reason from the AI validator (e.g. "This looks like an invoice, not a resume")
        setValidationError(validation.reason || 'The uploaded document does not appear to be a valid resume. Please upload a professional CV.');
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Only proceed with analysis if validation passed
      const result = await analyzeProfile(
        { text: userProfile.resumeText, file: userProfile.resumeFile },
        userProfile.targetRole,
        userProfile.targetCompanies,
        userProfile.experienceLevel
      );
      setAnalysis(result.analysis);
      setUserProfile(prev => ({
        ...prev,
        ...result.extractedProfile
      }));
      setView(AppView.DASHBOARD);
    } catch (error: any) {
      handleApiError(error, "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!analysis || !userProfile) return;
    setIsGeneratingPlan(true);
    try {
      // Safe access: analysis.skills might be missing if AI failed partially
      const missingSkills = analysis.skills?.filter(s => s.status === 'missing').map(s => s.name) || [];
      const generatedPlan = await generateLearningPlan(userProfile.targetRole, missingSkills);

      // Final filtering & deduplication to ensure content quality
      const uniquePlan = generatedPlan.reduce((acc, current) => {
        const isDuplicate = acc.find(w => w.theme.toLowerCase() === current.theme.toLowerCase());
        const hasContent = current.tasks && current.tasks.length > 0;
        const hasTheme = current.theme && current.theme.trim().length > 2;

        if (!isDuplicate && hasContent && hasTheme) {
          acc.push(current);
        }
        return acc;
      }, [] as WeeklyPlan[]);

      if (uniquePlan.length === 0) {
        throw new Error("The AI failed to generate a high-quality roadmap. Please try again.");
      }

      setPlan(uniquePlan);
      setView(AppView.PLAN);
    } catch (error: any) {
      handleApiError(error, "Failed to generate plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // --- Resume Upload Handler ---
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    try {
      // 1. Extract Text for Analysis
      const text = await extractTextFromPdf(file);

      // 2. Convert to Base64 for Persistence
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];

        setUserProfile(prev => ({
          ...prev,
          resumeText: text,
          resumeFile: {
            data: base64,
            mimeType: file.type
          }
        }));
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("PDF Upload Failed:", error);
      alert("Failed to parse PDF. Please ensure it is a valid text-based PDF.");
    }
  };

  const handleDeleteTask = (weekIndex: number, taskId: string) => {
    if (!plan) return;
    const newPlan = plan.map((week, idx) => {
      if (idx === weekIndex) {
        return { ...week, tasks: week.tasks.filter(t => t.id !== taskId) };
      }
      return week;
    });
    setPlan(newPlan);
  };

  const handleToggleTask = (weekIndex: number, taskId: string) => {
    if (!plan) return;
    const newPlan = plan.map((week, idx) => {
      if (idx === weekIndex) {
        return {
          ...week,
          tasks: week.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return week;
    });
    setPlan(newPlan);
  };

  const handleAddTask = (weekIndex: number) => {
    if (!plan || !newTaskTitle.trim()) return;
    const newPlan = plan.map((week, idx) => {
      if (idx === weekIndex) {
        return {
          ...week,
          tasks: [...week.tasks, {
            id: Date.now().toString(),
            title: newTaskTitle,
            description: 'Manually added task',
            type: newTaskType,
            estimatedHours: newTaskHours,
            completed: false
          }]
        };
      }
      return week;
    });
    setPlan(newPlan);
    setAddingTaskWeek(null);
    setNewTaskTitle('');
    setNewTaskHours(1);
  };


  const handleGenerateProjects = async () => {
    if (!userProfile?.targetRole) return;
    setIsGeneratingProjects(true);
    setProjects([]); // Clear previous

    try {
      // Extract Focus Topics from Learning Plan or Analysis
      let focusTopics: string[] = [];
      if (plan) {
        // Prioritize themes from the learning plan
        focusTopics = plan.map(w => w.theme).slice(0, 3);
      } else if (analysis?.skills) {
        // Fallback to missing skills
        focusTopics = analysis.skills
          .filter(s => s.status === 'missing')
          .map(s => s.name)
          .slice(0, 3);
      }

      // Generate highly tailored projects based on User's Dream Role & Company
      const standardProjects = await generateProjectIdeas(
        userProfile.targetRole,
        focusTopics,
        userProfile.targetCompanies || "Tech Company",
        userProfile.experienceLevel || "Intermediate",
        seenProjectTitles // Pass the history of seen titles
      );

      setProjects(standardProjects.slice(0, 3));

      // Update history
      const newTitles = standardProjects.map(p => p.title);
      setSeenProjectTitles(prev => [...prev, ...newTitles]);

    } catch (error) {
      handleApiError(error, "Failed to generate projects");
    } finally {
      setIsGeneratingProjects(false);
    }
  };



  const handleOptimizeResume = async () => {
    if ((!userProfile?.resumeText && !userProfile?.resumeFile) || !userProfile?.targetRole) {
      alert("Please ensure you have a resume and target role set.");
      return;
    }

    setIsOptimizingResume(true);
    try {
      const input = {
        text: userProfile.resumeText,
        file: userProfile.resumeFile
      };

      const result = await optimizeResume(input, userProfile.targetRole);

      setOptimizedResume(result.optimizedContent);
      setResumeAnalysisResult(result);

      // Generate LaTeX version
      const latexData = await generateLatexData(result.optimizedContent);

      // Debug: Check if achievements are being extracted
      console.log('LaTeX Data (before override):', latexData);
      console.log('User Profile:', userProfile);
      console.log('Current User Email:', currentUserEmail);

      // COMPREHENSIVE CLEANUP: Replace ALL placeholder values with real data

      // Personal Info - Replace 'string', 'Unknown', empty values
      const cleanPersonalInfo = (value: string | undefined, fallback: string) => {
        if (!value || value === 'string' || value === 'Unknown' || value.trim() === '') {
          return fallback;
        }
        return value;
      };

      latexData.personalInfo.fullName = cleanPersonalInfo(
        latexData.personalInfo.fullName,
        userProfile.name
      );

      latexData.personalInfo.email = cleanPersonalInfo(
        latexData.personalInfo.email,
        currentUserEmail || userProfile.email || ''
      );

      latexData.personalInfo.phone = cleanPersonalInfo(
        latexData.personalInfo.phone,
        userProfile.mobileNumber || ''
      );

      latexData.personalInfo.location = cleanPersonalInfo(
        latexData.personalInfo.location,
        userProfile.location || ''
      );

      // Always use user-entered URLs
      latexData.personalInfo.linkedin = userProfile.linkedinProfile || '';
      latexData.personalInfo.website = userProfile.githubProfile || '';

      // Clean up experience locations - Leave empty if not found (don't use 'Remote')
      if (latexData.experience) {
        latexData.experience.forEach(exp => {
          exp.location = cleanPersonalInfo(exp.location, '');
        });
      }

      // Clean up education locations
      if (latexData.education) {
        latexData.education.forEach(edu => {
          edu.location = cleanPersonalInfo(edu.location, 'Hyderabad');
          // Fix duplicate CGPA text
          if (edu.gpa && edu.gpa.includes('CGPA')) {
            edu.gpa = edu.gpa.replace(/CGPA:?\s*/gi, '').trim();
          }
        });
      }

      // Clean up project dates
      if (latexData.projects) {
        latexData.projects.forEach(proj => {
          proj.date = cleanPersonalInfo(proj.date, '');
        });
      }

      // Clean up certification dates - Remove if empty to avoid "-- "
      if (latexData.certifications) {
        latexData.certifications.forEach(cert => {
          if (!cert.date || cert.date === 'string' || cert.date === 'Unknown' || cert.date.trim() === '') {
            cert.date = '';
          }
        });
      }

      console.log('LaTeX Data (after cleanup):', latexData);

      setLatexData(latexData);
      const latexContent = generateLatexDocument(latexData);
      setLatexResume(latexContent);

      // If we extracted text from a PDF, save it so the user sees it in the "Original" box
      if (result.originalContent && !userProfile.resumeText) {
        setUserProfile(prev => ({ ...prev, resumeText: result.originalContent }));
      }

    } catch (error) {
      handleApiError(error, "Failed to optimize resume");
    } finally {
      setIsOptimizingResume(false);
    }
  };



  const handlePayment = async () => {
    /*
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }
  
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: 100,
      currency: "INR",
      name: "CareerPilot",
      description: "Mock Interview Access",
      // image: "https://example.com/your_logo",
      handler: function (response: any) {
        setUserProfile(prev => ({
          ...prev,
          isPremium: true,
          paymentHistory: [
            ...(prev.paymentHistory || []),
            {
              id: response.razorpay_payment_id || Date.now().toString(),
              date: new Date().toISOString(),
              amount: 1, // Store actual rupees (not paise)
              item: 'Mock Interview',
              status: 'success'
            }
          ]
        }));
        alert("Payment Successful! Mock Interview Unlocked.");
      },
      prefill: {
        name: userProfile.name,
        email: currentUserEmail || '',
        contact: ""
      },
      notes: {
        address: "CareerPilot Corporate Office"
      },
      theme: {
        color: "#4f46e5"
      }
    };
  
    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    */
  };

  const handleResumePayment = async () => {
    /*
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }
  
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: 100, // 100 paise = ₹1
      currency: "INR",
      name: "CareerPilot",
      description: "Resume Architect Access",
      handler: function (response: any) {
        setUserProfile(prev => ({
          ...prev,
          isResumePremium: true,
          paymentHistory: [
            ...(prev.paymentHistory || []),
            {
              id: response.razorpay_payment_id || Date.now().toString(),
              date: new Date().toISOString(),
              amount: 1, // Store actual rupees (not paise)
              item: 'Resume Architect',
              status: 'success'
            }
          ]
        }));
        alert("Payment Successful! Resume Architect Unlocked.");
      },
      prefill: {
        name: userProfile.name,
        email: currentUserEmail || '',
        contact: ""
      },
      theme: {
        color: "#10b981" // Emerald color for resume section
      }
    };
  
    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    */
  };

  const startInterview = useCallback(async () => {
    if (!userProfile?.targetRole) {
      alert("Please define a target role first.");
      return;
    }

    setIsInterviewStarted(true);
    setInterviewFeedback(null);
    setChatMessages([]);
    setIsChatLoading(true);

    try {
      // Check eligibility
      const eligibility = canStartNewInterview(userProfile.email || 'guest', []);

      if (!eligibility.canStart) {
        alert(eligibility.reason || 'You have reached your interview limit. Upgrade to Pro for unlimited interviews!');
        setIsInterviewStarted(false);
        setIsChatLoading(false);
        return;
      }

      // Start interview immediately
      const now = Date.now();
      setInterviewStartTime(now);
      setInterviewElapsedSeconds(0);
      setInterviewMessages([]);

      // Prepare candidate profile for interview
      const candidateProfile = {
        resume: userProfile.resumeText || analysis?.summary || 'Entry-level candidate',
        skills: analysis?.skills?.filter(s => s.status === 'acquired').map(s => s.name) || [],
        projects: userProfile.resumeText?.match(/project/gi)?.length ? ['Resume projects'] : [],
        readinessScore: analysis?.readinessScore || 50
      };

      // Generate first interviewer message
      const firstResponse = await generatePremiumInterviewResponse(
        {
          targetRole: userProfile.targetRole,
          companyName: userProfile.targetCompanies?.split(',')[0]?.trim() || 'Tech Company',
          companyType: 'FAANG',
          experienceLevel: userProfile.experienceLevel || 'fresher',
          totalDuration: 35,
          candidateProfile
        },
        [],
        0,
        true // First message
      );

      const firstMessage = {
        id: Date.now().toString(),
        role: 'model' as const,
        text: firstResponse,
        timestamp: now
      };

      setChatMessages([firstMessage]);
      setInterviewMessages([{
        role: 'interviewer',
        content: firstResponse,
        timestamp: now,
        elapsedTime: 0,
        phase: 1
      }]);

      if (isSpeakingEnabled) speakText(firstResponse);

    } catch (err: any) {
      setIsInterviewStarted(false);
      handleApiError(err, "Failed to start interview");
    } finally {
      setIsChatLoading(false);
    }
  }, [userProfile, isSpeakingEnabled, analysis]);

  const handleEndInterview = async () => {
    // 1. Force Stop Audio & Listening Immediately
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);

    if (chatMessages.length < 2) {
      setIsInterviewStarted(false);
      setChatMessages([]);
      setInterviewStartTime(null);
      setInterviewElapsedSeconds(0);
      return;
    }

    setIsInterviewStarted(false);
    setIsGeneratingFeedback(true);

    try {
      // Generate premium evaluation
      const evaluation = await evaluatePremiumInterview(
        {
          targetRole: userProfile.targetRole,
          companyName: userProfile.targetCompanies?.split(',')[0]?.trim() || 'Tech Company',
          companyType: 'FAANG',
          experienceLevel: userProfile.experienceLevel || 'fresher',
          totalDuration: 35,
          candidateProfile: {
            resume: userProfile.resumeText || analysis?.summary || 'Entry-level candidate',
            skills: analysis?.skills?.filter(s => s.status === 'acquired').map(s => s.name) || [],
            projects: [],
            readinessScore: analysis?.readinessScore || 50
          }
        },
        interviewMessages,
        Math.floor(interviewElapsedSeconds / 60)
      );

      // Convert to InterviewFeedback format
      const feedback: InterviewFeedback = {
        score: evaluation.overallScore, // Keep raw 0-100 score
        feedbackSummary: evaluation.detailedFeedback.split('\n')[0] || "Evaluation Complete", // Short summary for header
        strengths: evaluation.strengths,
        improvements: evaluation.blockingGaps, // Map blocking gaps to improvements for backward compat or use specific fields
        recommendedFocus: evaluation.nextSteps[0] || 'Continue practicing',

        // Detailed Premium Fields
        communication: evaluation.communication,
        technicalCompetence: evaluation.technicalCompetence,
        problemSolving: evaluation.problemSolving,
        confidenceUnderPressure: evaluation.confidenceUnderPressure,
        timeManagement: evaluation.timeManagement,
        decision: evaluation.decision,
        blockingGaps: evaluation.blockingGaps,
        improvementRoadmap: evaluation.improvementRoadmap,
        comparisonToHiringBar: evaluation.comparisonToHiringBar,
        detailedFeedback: evaluation.detailedFeedback,
      };

      const newPastInterview: PastInterview = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        targetRole: userProfile.targetRole,
        companyName: userProfile.targetCompanies?.split(',')[0] || 'Tech Company',
        score: feedback.score,
        feedback: feedback
      };

      setUserProfile(prev => ({
        ...prev,
        pastInterviews: [newPastInterview, ...(prev.pastInterviews || [])]
      }));

      setInterviewFeedback(feedback);
      setInterviewStartTime(null);
      setInterviewElapsedSeconds(0);
    } catch (error) {
      handleApiError(error, "Failed to generate feedback");
      setChatMessages([]);
    } finally {
      setIsGeneratingFeedback(false);
      setChatInstance(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    // Stop mic if active (ensures mic stays active UNTIL send is clicked)
    if (recognitionRef.current) {
      recognitionStoppedRef.current = true; // Mark as intentionally stopped to ignore final events
      recognitionRef.current.stop();
      setIsListening(false);
      recognitionRef.current = null;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Calculate elapsed time
      const elapsed = interviewStartTime ? Math.floor((Date.now() - interviewStartTime) / 1000) : 0;

      // Add user message to interview history
      const updatedMessages = [
        ...interviewMessages,
        {
          role: 'candidate' as const,
          content: userMsg.text,
          timestamp: Date.now(),
          elapsedTime: elapsed,
          phase: Math.ceil(elapsed / 300) as 1 | 2 | 3 | 4 // Rough phase calculation
        }
      ];

      setInterviewMessages(updatedMessages);

      // Generate interviewer response
      const response = await generatePremiumInterviewResponse(
        {
          targetRole: userProfile.targetRole,
          companyName: userProfile.targetCompanies?.split(',')[0]?.trim() || 'Tech Company',
          companyType: 'FAANG',
          experienceLevel: userProfile.experienceLevel || 'fresher',
          totalDuration: 35,
          candidateProfile: {
            resume: userProfile.resumeText || analysis?.summary || 'Entry-level candidate',
            skills: analysis?.skills?.filter(s => s.status === 'acquired').map(s => s.name) || [],
            projects: [],
            readinessScore: analysis?.readinessScore || 50
          }
        },
        updatedMessages,
        elapsed,
        false
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, botMsg]);

      // Add to interview history
      setInterviewMessages([
        ...updatedMessages,
        {
          role: 'interviewer',
          content: response,
          timestamp: Date.now(),
          elapsedTime: elapsed + 2,
          phase: Math.ceil(elapsed / 300) as 1 | 2 | 3 | 4
        }
      ]);

      if (isSpeakingEnabled) speakText(response);
    } catch (error) {
      // Add error message to chat
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting right now (High Traffic). Please try again in a moment.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice Input is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        recognitionStoppedRef.current = false; // Reset flag for new session
        setIsListening(true);
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          // Only stop if we meant to stop.
          // If it stopped due to silence but we want continuous, we'd restart here,
          // but for now we just reflect state.
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onresult = (event: any) => {
        // Ignore results if recognition was intentionally stopped (e.g., on message send)
        if (recognitionStoppedRef.current) {
          return;
        }

        // Build the complete transcript from all results in this session
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        // Simply set the entire transcript as the current input
        // This replaces the previous content, which is the expected behavior
        setChatInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        if (event.error === 'no-speech') {
          // Ignore
          return;
        }
        setIsListening(false);
        recognitionRef.current = null;

        if (event.error === 'not-allowed') {
          alert("Microphone access blocked. Please enable permissions in your browser settings.");
        } else {
          // Silent fail for other minor errors to avoid spamming alerts
          console.warn("Speech recognition failed:", event.error);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Speech init error", e);
      alert("Could not start voice input.");
    }
  };


  // --- Landing View ---
  if (view === AppView.LANDING) {
    return (
      <>
        {/* Navigation Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
            </div>
          </div>
        )}

        <LandingPage
          onGetStarted={() => {
            if (isLoggedIn) {
              setView(analysis ? AppView.DASHBOARD : AppView.ONBOARDING);
            } else {
              setAuthMode('signup');
              setShowAuthModal(true);
            }
          }}
          onLogin={() => {
            if (isLoggedIn) {
              setView(analysis ? AppView.DASHBOARD : AppView.ONBOARDING);
            } else {
              setAuthMode('login');
              setShowAuthModal(true);
            }
          }}
        />
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setEmailInput('');
                  setPasswordInput('');
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-zinc-400 text-sm">
                  {authMode === 'login'
                    ? 'Enter your credentials to access your career plan.'
                    : 'Join CareerPilot to start your journey.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        if (emailError && AuthService.isValidEmail(e.target.value)) {
                          setEmailError('');
                        }
                      }}
                      onBlur={() => {
                        if (emailInput.trim() && !AuthService.isValidEmail(emailInput)) {
                          setEmailError('Please enter a valid email address');
                        } else {
                          setEmailError('');
                        }
                      }}
                      className={`w-full bg-zinc-900 border rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-zinc-600 ${emailError ? 'border-red-500' : 'border-zinc-800'}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {emailError && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-zinc-600"
                      placeholder="••••••••"
                    />
                  </div>
                  {authMode === 'signup' && (
                    <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                      <p className="text-zinc-400 font-medium mb-1">Password requirements:</p>
                      <p className={passwordInput.length >= 8 ? 'text-emerald-400' : ''}>• Minimum 8 characters</p>
                      <p className={/\d/.test(passwordInput) ? 'text-emerald-400' : ''}>• At least one number (0-9)</p>
                      <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordInput) ? 'text-emerald-400' : ''}>• At least one special character (!@#$%^&*...)</p>
                    </div>
                  )}
                  {authMode === 'login' && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!emailInput) {
                            setAuthError("Please enter your email address to reset password.");
                            return;
                          }
                          const result = await AuthService.resetPassword(emailInput);
                          alert(result.message);
                        }}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    </>
                  )}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-2 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-zinc-900 font-semibold py-3 rounded-xl transition-all hover:bg-zinc-100 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                  }}
                  className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // --- Onboarding View ---
  if (view === AppView.ONBOARDING) {
    // Premium Full-Screen Loading State during Analysis
    if (isAnalyzing) {
      return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Logo Container */}
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl border border-zinc-700 flex items-center justify-center shadow-xl">
              <TrendingUp className="w-12 h-12 text-violet-400" />
            </div>

            <div className="space-y-3 max-w-md">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Initializing Pilot...
              </h2>
              <p className="text-zinc-400 text-lg">
                Analyzing your resume and building your custom roadmap.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 rounded-full"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Navigation Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
            </div>
          </div>
        )}

        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
          <div className="bg-zinc-900 max-w-2xl w-full rounded-2xl shadow-2xl shadow-black/50 p-8 border border-zinc-800 relative">
            {/* Back to Login if stuck */}
            <button
              onClick={handleLogout}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white flex items-center text-sm"
            >
              <User className="w-4 h-4 mr-2" /> {userProfile.name} (Logout)
            </button>

            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-100">Setup your Pilot</h1>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-6">
              {/* Career Stage Section */}
              <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Compass className="w-5 h-5 mr-2 text-violet-400" />
                  Where are you in your journey?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Experience Level</label>
                    <select
                      required
                      className="w-full p-3 bg-[#09090b] border border-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      value={userProfile.experienceLevel || ''}
                      onChange={e => setUserProfile(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="student">Student (Still Studying)</option>
                      <option value="fresher">Fresher (0-1 year)</option>
                      <option value="junior">Junior (1-3 years)</option>
                      <option value="mid">Mid-Level (3-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Graduation Year</label>
                    <input
                      type="number"
                      required
                      min="2020"
                      max="2030"
                      className="w-full p-3 bg-[#09090b] border border-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                      placeholder="e.g. 2024, 2025..."
                      value={userProfile.graduationYear || ''}
                      onChange={e => setUserProfile(prev => ({ ...prev, graduationYear: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Career Goals Section */}
              <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-400" />
                  Career Target
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Role */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Target Role <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        required
                        className="w-full p-3 pl-10 bg-[#09090b] border border-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                        placeholder="e.g. Software Engineer"
                        value={userProfile.targetRole}
                        onChange={e => setUserProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Target Companies */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Target Company <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-3.5 w-4 h-4 flex items-center justify-center text-zinc-500 group-focus-within:text-emerald-400 transition-colors font-bold text-xs">
                        @
                      </div>
                      <input
                        type="text"
                        className="w-full p-3 pl-10 bg-[#09090b] border border-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                        placeholder="e.g. Google, TCS, Startup..."
                        value={userProfile.targetCompanies || ''}
                        onChange={e => setUserProfile(prev => ({ ...prev, targetCompanies: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 mt-3 flex items-center">
                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold mr-2">Tip</span>
                  We'll auto-tailor your resume and interview questions for this specific role.
                </p>
              </div>

              {/* Resume Upload Section */}
              <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-amber-400" />
                  Upload Your Resume <span className="text-red-400 ml-1">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Option */}
                  <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${userProfile.resumeFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800'}`}>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                      {isUploadingResume ? (
                        <>
                          <Loader2 className="w-8 h-8 text-violet-400 mb-2 animate-spin" />
                          <span className="text-sm font-medium text-violet-300">Processing...</span>
                          <span className="text-xs text-zinc-500 mt-1">Reading your resume</span>
                        </>
                      ) : userProfile.resumeFile ? (
                        <>
                          <FileText className="w-8 h-8 text-emerald-400 mb-2" />
                          <span className="text-sm font-medium text-emerald-300">Resume Uploaded ✓</span>
                          <span className="text-xs text-emerald-500/70 mt-1">Ready to analyze</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-violet-400 mb-2" />
                          <span className="text-sm font-medium text-zinc-300">Upload PDF / TXT</span>
                          <span className="text-xs text-zinc-500 mt-1">Drag & drop or click</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Or Text Paste Option */}
                  <div className="relative">
                    <textarea
                      className="w-full h-full min-h-[140px] p-4 bg-[#09090b] border border-zinc-800 text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none font-mono text-xs placeholder-slate-600"
                      placeholder="Or paste resume text here..."
                      value={userProfile.resumeText || ''}
                      onChange={e => setUserProfile(prev => ({ ...prev, resumeText: e.target.value }))}
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600">
                      {userProfile.resumeText?.length || 0} chars
                    </div>
                  </div>
                </div>


              </div>

              {/* Validation Error Message */}
              {validationError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 font-medium">{validationError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Profile...</span>
                  </>
                ) : (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole ? (
                  <span>Select Resume & Role to Launch</span>
                ) : (
                  <>
                    <span>Launch Career Analysis</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Save Draft & Exit Button */}
              {(userProfile.resumeFile || userProfile.resumeText || userProfile.targetRole) && (
                <button
                  type="button"
                  onClick={() => {
                    // Data is already auto-saved via localStorage
                    setView(isLoggedIn ? AppView.DASHBOARD : AppView.LANDING);
                  }}
                  className="w-full mt-3 bg-zinc-800 hover:bg-slate-700 text-zinc-300 font-medium py-3 rounded-xl border border-zinc-700 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Save Draft & Exit</span>
                </button>
              )}
            </form>
          </div>
        </div>
      </>
    );
  }

  // --- Main App Layout ---
  return (
    <>
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#09090b] flex text-zinc-100 font-sans">
        {showShareModal && analysis && (
          <ShareSuccessModal
            score={analysis.readinessScore}
            role={userProfile.targetRole}
            onClose={() => setShowShareModal(false)}
            streak={userProfile.streak || 1}
          />
        )}

        <Sidebar
          currentView={view}
          onChangeView={setView}
          onLogout={handleLogout}
          onSwitchTrack={handleSwitchTrack}
          onResetData={handleResetData}
          onOpenFeedback={() => setShowFeedbackModal(true)}
        />

        <MobileBottomNav
          currentView={view}
          onChangeView={setView}
          onLogout={handleLogout}
          onSwitchTrack={handleSwitchTrack}
          onResetData={handleResetData}
          onOpenFeedback={() => setShowFeedbackModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10 pt-6 md:pt-10 bg-[#09090b] relative">

          <div className="flex-1 flex flex-col">
            {/* Top Bar - Profile */}
            <header className="flex justify-between md:justify-end items-center px-4 md:px-6 py-3">
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight">CareerPilot</span>
              </div>
              {isLoggedIn && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-zinc-900/50 border border-amber-500/20 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all group cursor-default">
                    <div className="bg-amber-500/10 p-1 rounded-full group-hover:bg-amber-500/20 transition-colors">
                      <Flame className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 fill-amber-500 animate-[pulse_3s_ease-in-out_infinite]" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-xs md:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                        {userProfile.streak || 1} <span className="text-amber-500">Days</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-950 font-bold text-sm shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-105 transition-all cursor-pointer ring-2 ring-zinc-500/20"
                    title="View Profile"
                  >
                    {userProfile.name?.[0]?.toUpperCase() || 'U'}
                  </button>
                </div>
              )}
            </header>

            {/* Dashboard View */}
            {view === AppView.DASHBOARD && analysis && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Compact Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <div>
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Target: <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  {/* Daily Quest */}
                  <DailyQuest
                    streak={userProfile.streak || 1}
                    xp={userProfile.xp || 150}
                    onNavigate={setView}
                  />

                  {/* Score & Summary Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Score Card */}
                    <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Match Potential</p>
                      <ScoreGauge score={analysis.readinessScore} />
                      <p className="text-center text-xs text-zinc-400 mt-4">
                        {analysis.readinessScore > 75
                          ? "Strong candidate. Focus on polishing advanced skills."
                          : "Great foundation. Complete your plan to boost this score."}
                      </p>
                    </div>

                    {/* Strengths */}
                    <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                        Top Strengths
                      </p>
                      <div className="space-y-2">
                        {analysis.strengths?.slice(0, 3).map((s, i) => (
                          <div key={i} className="text-sm text-zinc-300 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10 flex items-start">
                            <span className="text-emerald-400 mr-2">•</span>
                            <span className="line-clamp-2">{s}</span>
                          </div>
                        ))}
                        {(!analysis.strengths || analysis.strengths.length === 0) && (
                          <p className="text-sm text-zinc-500 italic">No strengths detected yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Gaps */}
                    <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        Key Gaps
                      </p>
                      <div className="space-y-2">
                        {analysis.weaknesses?.slice(0, 3).map((w, i) => (
                          <div key={i} className="text-sm text-zinc-300 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 flex items-start">
                            <span className="text-amber-400 mr-2">•</span>
                            <span className="line-clamp-2">{w}</span>
                          </div>
                        ))}
                        {(!analysis.weaknesses || analysis.weaknesses.length === 0) && (
                          <p className="text-sm text-zinc-500 italic">No gaps detected yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills Matrix */}
                  <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white">Skills Breakdown</h3>
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-zinc-800 rounded text-zinc-400">
                        {analysis.skills?.length || 0} skills tracked
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Acquired</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.skills?.filter(s => s.status === 'acquired').map(s => <SkillCard key={s.name} skill={s} />)}
                          {analysis.skills?.filter(s => s.status === 'acquired').length === 0 && (
                            <span className="text-sm text-zinc-500 italic">No exact matches found yet.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Missing / To Learn</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.skills?.filter(s => s.status === 'missing').map(s => <SkillCard key={s.name} skill={s} />)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                      <button
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center transition-colors disabled:opacity-70"
                      >
                        {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
                        {plan ? 'Regenerate' : 'Create Roadmap'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Plan View */}
            {view === AppView.PLAN && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Compact Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <div>
                    <h1 className="text-xl font-bold text-white">Learning Plan</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Roadmap for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                  </div>
                  {plan && (
                    <button
                      onClick={handleGeneratePlan}
                      disabled={isGeneratingPlan}
                      className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                    >
                      {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Regenerate
                    </button>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {!plan && !isGeneratingPlan && (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                        <BookOpen className="w-7 h-7 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No Learning Plan Yet</h3>
                      <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                        Create a personalized curriculum based on your skill gaps.
                      </p>
                      <button
                        onClick={handleGeneratePlan}
                        className="bg-white hover:bg-zinc-200 text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center mx-auto transition-all shadow-lg shadow-white/5"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Generate Plan
                      </button>
                    </div>
                  )}

                  {isGeneratingPlan && (
                    <div className="flex flex-col items-center justify-center py-24">
                      <Loader2 className="w-10 h-10 text-zinc-500 animate-spin mb-4" />
                      <p className="text-zinc-400 text-sm">Designing your curriculum...</p>
                    </div>
                  )}

                  {plan && (
                    <>
                      {/* Statistics Panel */}
                      {(() => {
                        const stats = calculatePlanStatistics(plan, 2);
                        const currentWeek = getCurrentWeek(plan);
                        const progressMessage = getProgressMessage(stats.progressPercentage);

                        console.log(`[UI] Plan Stats Updated - Hours: ${stats.completedHours}/${stats.totalHours}`);

                        return (
                          <div className="bg-gradient-to-br from-[#09090b] via-zinc-900 to-indigo-950/30 rounded-2xl border border-zinc-800/60 p-8 shadow-xl relative overflow-hidden group">
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            {/* Top Row - Progress */}
                            <div className="flex items-end justify-between mb-8 relative z-10">
                              <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
                                  Course Progress
                                  {stats.progressPercentage >= 100 && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />}
                                </h2>
                                <p className="text-base font-medium text-indigo-200/70">{progressMessage}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{stats.progressPercentage}%</div>
                              </div>
                            </div>

                            {/* Professional Progress Bar */}
                            <div className="h-4 bg-zinc-900/50 rounded-full overflow-hidden mb-8 border border-white/5 shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${stats.progressPercentage}%` }}
                              />
                            </div>

                            {/* Stats Grid - Vibrant & Clean */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5 relative z-10">
                              <div className="group/stat">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500/70" /> Tasks
                                </p>
                                <p className="text-2xl font-bold text-white group-hover/stat:text-emerald-400 transition-colors">
                                  {stats.completedTasks} <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalTasks}</span>
                                </p>
                              </div>
                              <div className="group/stat">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-500/70" /> Hours
                                </p>
                                <p className="text-2xl font-bold text-white group-hover/stat:text-blue-400 transition-colors">
                                  {stats.completedHours}<span className="text-sm">h</span> <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalHours}<span className="text-sm">h</span></span>
                                </p>
                              </div>
                              <div className="group/stat">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-violet-500/70" /> Est. Completion
                                </p>
                                <p className="text-lg font-bold text-white group-hover/stat:text-violet-400 transition-colors truncate">
                                  {stats.estimatedCompletionDate}
                                </p>
                              </div>
                              <div className="group/stat">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5 text-amber-500/70" /> Current Week
                                </p>
                                <p className="text-2xl font-bold text-white group-hover/stat:text-amber-400 transition-colors">
                                  {currentWeek} <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalWeeks}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Weekly Plan */}
                      {plan?.map((week, idx) => {
                        const completedCount = week.tasks.filter(t => t.completed).length;
                        const totalCount = week.tasks.length;
                        const weekProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                        // Unified Theme: Professional Indigo/Violet
                        const borderColor = 'border-l-indigo-500';
                        const headerGradient = 'from-indigo-500/10';

                        return (
                          <div key={idx} className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6 border-l-4 ${borderColor} shadow-lg shadow-black/20`}>
                            {/* Week Header */}
                            <div className={`px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r ${headerGradient} to-transparent`}>
                              <div>
                                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                  <span className="opacity-50 font-normal text-sm uppercase tracking-wider">Week {idx + 1}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                  {week.theme}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{Math.round(weekProgress)}% Done</span>
                                <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${weekProgress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-zinc-500 to-white'}`}
                                    style={{ width: `${weekProgress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Tasks List */}
                            <div className="divide-y divide-zinc-800/50">
                              {week.tasks?.map((task) => (
                                <div key={task.id} className="px-6 py-4 hover:bg-zinc-800/30 transition-colors group flex items-start gap-4">
                                  {/* Minimal Icon */}
                                  <div className={`mt-0.5 ${task.type === 'project' ? 'text-zinc-400' : task.type === 'course' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {task.type === 'project' ? <Briefcase className="w-4 h-4" /> :
                                      task.type === 'course' ? <PlayCircle className="w-4 h-4" /> :
                                        <BookOpen className="w-4 h-4" />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <h4 className={`text-sm font-medium transition-colors ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                        {task.title}
                                      </h4>
                                      <span className="text-xs text-zinc-500 ml-4 shrink-0 font-medium">
                                        {task.estimatedHours}h
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{task.description}</p>

                                    <div className="flex items-center gap-3 mt-3">
                                      {task.videoQuery && (
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.videoQuery)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors"
                                        >
                                          <Youtube className="w-3 h-3 mr-1.5" /> Watch Tutorial
                                        </a>
                                      )}

                                      <button
                                        onClick={() => handleToggleTask(idx, task.id)}
                                        className={`text-xs font-medium transition-colors flex items-center ${task.completed ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'
                                          }`}
                                      >
                                        {task.completed ? (
                                          <><Check className="w-3 h-3 mr-1.5" /> Completed</>
                                        ) : (
                                          <><Circle className="w-3 h-3 mr-1.5" /> Mark as Done</>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <button
                                    onClick={() => handleDeleteTask(idx, task.id)}
                                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              {/* Add Task - Minimal */}
                              <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800">
                                {addingTaskWeek === idx ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      value={newTaskTitle}
                                      onChange={(e) => setNewTaskTitle(e.target.value)}
                                      placeholder="New task title..."
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-zinc-500 outline-none"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setAddingTaskWeek(null)} className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white">Cancel</button>
                                      <button onClick={() => handleAddTask(idx)} className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded shadow-sm">Add Task</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAddingTaskWeek(idx)}
                                    className="flex items-center text-xs font-medium text-zinc-500 hover:text-white transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Projects Hub View */}
            {view === AppView.PROJECTS && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Compact Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-white/5 gap-4 sm:gap-0">
                  <div>
                    <h1 className="text-xl font-bold text-white">Portfolio Builder</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">AI-generated projects for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                  </div>
                  <button
                    onClick={handleGenerateProjects}
                    disabled={isGeneratingProjects}
                    className="bg-white hover:bg-zinc-200 text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                  >
                    {isGeneratingProjects ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Generate Ideas</>
                    )}
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                  {/* Loading State - Full page centered (same as initial page load) */}
                  {isGeneratingProjects && projects?.length === 0 && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-zinc-500">
                      {/* CSS Animation */}
                      <style>{`
                    @keyframes iconPulse {
                      0%, 100% { opacity: 0.3; transform: scale(1); color: #52525b; }
                      50% { opacity: 1; transform: scale(1.15); color: #ffffff; }
                    }
                    .portfolio-loader-icon {
                      width: 48px;
                      height: 48px;
                      color: #52525b; /* zinc-600 */
                      animation: iconPulse 1.5s ease-in-out infinite;
                    }
                    @keyframes dotBounce {
                      0%, 100% { transform: translateY(0); opacity: 0.5; }
                      50% { transform: translateY(-6px); opacity: 1; }
                    }
                  `}</style>

                      {/* Career Icons Animation */}
                      <div className="flex items-center gap-6 mb-8">
                        {/* Resume/FileText icon */}
                        <svg className="portfolio-loader-icon" style={{ animationDelay: '0s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <line x1="10" y1="9" x2="8" y2="9"></line>
                        </svg>
                        {/* Code icon */}
                        <svg className="portfolio-loader-icon" style={{ animationDelay: '0.15s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6"></polyline>
                          <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                        {/* Layers icon */}
                        <svg className="portfolio-loader-icon" style={{ animationDelay: '0.3s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                          <polyline points="2 17 12 22 22 17"></polyline>
                          <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        {/* Briefcase icon */}
                        <svg className="portfolio-loader-icon" style={{ animationDelay: '0.45s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                        </svg>
                        {/* MessageSquare icon */}
                        <svg className="portfolio-loader-icon" style={{ animationDelay: '0.6s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                        </svg>
                      </div>

                      {/* Loading Text */}
                      <p className="text-zinc-400 text-sm tracking-wide">
                        Crafting Your Perfect Projects
                        <span className="inline-flex gap-1 ml-1">
                          <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0s' }}></span>
                          <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.15s' }}></span>
                          <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.3s' }}></span>
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Projects Grid */}
                  {/* Empty State */}
                  {!isGeneratingProjects && (!projects || projects.length === 0) && (
                    <EmptyState
                      icon={Code}
                      title="No Projects Yet"
                      description="Generate your first portfolio project tailored to your target role. We'll give you the tech stack, features, and difficulty level."
                      actionLabel="Generate New Ideas"
                      onAction={handleGenerateProjects}
                      color="indigo"
                    />
                  )}

                  {/* Projects Grid */}
                  {projects?.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects?.map((project, idx) => (
                        <div
                          key={idx}
                          className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-violet-500/50 transition-all flex flex-col h-full"
                        >
                          <div className="p-6 flex flex-col h-full">
                            {/* Header Row */}
                            <div className="flex items-start justify-between mb-4">
                              <div className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium border ${project.difficulty === 'Beginner' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                                project.difficulty === 'Intermediate' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                                  'bg-purple-500/5 text-purple-400 border-purple-500/20'
                                }`}>
                                {project.difficulty}
                              </div>
                              <div className="p-2 bg-zinc-800 rounded-lg">
                                <Layers className="w-4 h-4 text-zinc-400" />
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
                              {project.title}
                            </h4>

                            {/* Description */}
                            <p className="text-sm text-zinc-400 mb-6 line-clamp-3 leading-relaxed">
                              {project.description}
                            </p>

                            {/* Tech Stack */}
                            <div className="mt-auto mb-6">
                              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Tech Stack</p>
                              <div className="flex flex-wrap gap-2">
                                {project.techStack?.slice(0, 4).map(t => (
                                  <span key={t} className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                    {t}
                                  </span>
                                ))}
                                {project.techStack?.length > 4 && (
                                  <span className="text-[11px] text-zinc-500 px-1 py-1">
                                    +{project.techStack.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-zinc-800 w-full mb-4"></div>

                            {/* Resume Value */}
                            <div className="flex items-start gap-2 mb-6">
                              <TrendingUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-zinc-400 line-clamp-2">{project.resumeValue}</p>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center transition-colors border border-zinc-700 hover:border-zinc-600"
                            >
                              View Specs
                              <ArrowRight className="w-4 h-4 ml-2 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isGeneratingProjects && projects?.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Code className="w-7 h-7 text-violet-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Build Your Portfolio</h3>
                      <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                        Get 3 project ideas (Beginner to Advanced) designed to impress recruiters.
                      </p>
                      <button
                        onClick={handleGenerateProjects}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center mx-auto transition-all"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Projects
                      </button>
                    </div>
                  )}
                </div>

                {/* Project Details Modal */}
                {selectedProject && (
                  <div
                    className="fixed inset-0 md:left-64 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setSelectedProject(null)}
                  >
                    <div
                      className="bg-zinc-900 rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${selectedProject.difficulty === 'Beginner'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : selectedProject.difficulty === 'Intermediate'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-purple-500/10 text-purple-400'
                                }`}>
                                {selectedProject.difficulty}
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{selectedProject.title}</h2>
                            <p className="text-sm text-zinc-400 line-clamp-1">{selectedProject.techStack?.join(' • ')}</p>
                          </div>
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0 border border-zinc-700"
                          >
                            <X className="w-4 h-4 text-zinc-400" />
                          </button>
                        </div>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 space-y-6">
                        {/* Description */}
                        <div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{selectedProject.description}</p>
                        </div>
                        {/* User Stories Section */}
                        {selectedProject.userStories && selectedProject.userStories.length > 0 && (
                          <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                              <Users className="w-4 h-4 mr-2 text-violet-400" />
                              User Stories
                            </h3>
                            <ul className="space-y-2">
                              {selectedProject.userStories.map((story, idx) => (
                                <li key={idx} className="text-sm text-zinc-300 flex items-start">
                                  <span className="text-violet-400 mr-2">•</span>
                                  {story}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Features Section */}
                        {selectedProject.keyFeatures && selectedProject.keyFeatures.length > 0 && (
                          <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                              Key Features
                            </h3>
                            <ul className="space-y-2">
                              {selectedProject.keyFeatures.map((feature, idx) => (
                                <li key={idx} className="text-sm text-zinc-300 flex items-start">
                                  <span className="text-emerald-400 mr-2">•</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Implementation Steps Section */}
                        {selectedProject.implementationFlow && selectedProject.implementationFlow.length > 0 && (
                          <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                              <List className="w-4 h-4 mr-2 text-violet-400" />
                              Implementation Steps
                            </h3>
                            <div className="space-y-2">
                              {selectedProject.implementationFlow.map((step, idx) => (
                                <div key={idx} className="flex items-start text-sm text-zinc-300">
                                  <span className="text-violet-400 font-bold mr-2 shrink-0">{idx + 1}.</span>
                                  <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* You'll Learn Section */}
                        {selectedProject.learningOutcomes && selectedProject.learningOutcomes.length > 0 && (
                          <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                              <Award className="w-4 h-4 mr-2 text-zinc-400" />
                              Skills You'll Master
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.learningOutcomes.map((outcome, idx) => (
                                <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700">
                                  {outcome}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resume Value */}
                        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-zinc-800 rounded-lg shrink-0">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white mb-1">Why Build This?</h3>
                              <p className="text-sm text-zinc-400 leading-relaxed">{selectedProject.resumeValue}</p>
                            </div>
                          </div>
                        </div>

                        {/* Implementation Resources */}
                        {selectedProject.implementationResources && selectedProject.implementationResources.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2 text-blue-400" />
                              Resources
                            </h3>
                            <div className="space-y-2">
                              {selectedProject.implementationResources.map((resource, idx) => (
                                <a
                                  key={idx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-white/5 transition-all group"
                                >
                                  <span className="text-sm text-zinc-300 group-hover:text-white">{resource.name}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Source Paper */}
                        {selectedProject.sourcePaper && (
                          <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/10">
                            <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Research Paper
                            </h3>
                            <p className="text-sm text-white font-medium mb-1">{selectedProject.sourcePaper.title}</p>
                            <p className="text-xs text-zinc-400 mb-2">{selectedProject.sourcePaper.authors.join(', ')}</p>
                            <a
                              href={selectedProject.sourcePaper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-medium"
                            >
                              Read Paper <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${selectedProject.title}\n\n${selectedProject.description}\n\nTech Stack: ${selectedProject.techStack?.join(', ')}`);
                              alert('Project details copied to clipboard!');
                            }}
                            className="flex-1 bg-zinc-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </button>
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resume View - Payment Gate */}
            {/* {view === AppView.RESUME && !userProfile.isResumePremium && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative text-center px-4">
              <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-600/10">
                <FileText className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Resume Architect Pro</h2>
              <p className="text-zinc-400 max-w-lg mb-8 text-lg">
                Unlock professional resume optimization and LaTeX downloads. Land 3x more interviews with an ATS-optimized resume for just <span className="text-white font-bold">₹1</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-lg w-full">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ATS Optimization</h4>
                    <p className="text-xs text-zinc-400">Keyword injection & metric focus</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <Code className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">LaTeX Export</h4>
                    <p className="text-xs text-zinc-400">Get professional PDF versions</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleResumePayment}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 flex items-center"
              >
                Unlock Architect for ₹1
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <p className="mt-4 text-xs text-zinc-500 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Secure payment via Razorpay
              </p>
              <button
                onClick={() => setUserProfile(p => ({ ...p, isResumePremium: true }))}
                className="mt-8 text-[10px] text-zinc-700 hover:text-emerald-400 transition-colors"
                title="Dev Bypass"
              >
                [Dev Bypass]
              </button>
            </div>
          )} */}

            {/* Resume View */}
            {view === AppView.RESUME && /*userProfile.isResumePremium &&*/ (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Compact Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-white/5 gap-4 sm:gap-0">
                  <div>
                    <h1 className="text-xl font-bold text-white">Resume Architect</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Transform your resume for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                  </div>
                  <button
                    onClick={handleOptimizeResume}
                    disabled={isOptimizingResume || !userProfile.githubProfile || !userProfile.linkedinProfile}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
                  >
                    {isOptimizingResume ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {optimizedResume ? 'Regenerate' : 'Polish Resume'}
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                  {/* Profile Links - Compact Row */}
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-zinc-800 rounded mr-3">
                          <Link className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Social Profiles</h3>
                          <p className="text-xs text-zinc-500">Required for accurate personal branding</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative group">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input
                          type="url"
                          placeholder="GitHub URL"
                          value={userProfile.githubProfile || ''}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, githubProfile: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-all placeholder-zinc-600"
                        />
                      </div>
                      <div className="relative group">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input
                          type="url"
                          placeholder="LinkedIn URL"
                          value={userProfile.linkedinProfile || ''}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-all placeholder-zinc-600"
                        />
                      </div>
                      <div className="relative group">
                        <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input
                          type="url"
                          placeholder="LeetCode URL"
                          value={userProfile.leetcodeProfile || ''}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, leetcodeProfile: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-all placeholder-zinc-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ATS Score Impact - Only show after optimization */}
                  {resumeAnalysisResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">ATS Score</p>
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-white">{resumeAnalysisResult.atsScore.after}</span>
                            <span className="text-sm font-medium text-emerald-500 flex items-center">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              +{resumeAnalysisResult.atsScore.after - resumeAnalysisResult.atsScore.before} pts
                            </span>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Keywords Added</p>
                        <div className="flex flex-wrap gap-2">
                          {resumeAnalysisResult.missingKeywordsAdded.slice(0, 5).map(k => (
                            <span key={k} className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs border border-zinc-700">{k}</span>
                          ))}
                          {resumeAnalysisResult.missingKeywordsAdded.length > 5 && (
                            <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-500 text-xs border border-zinc-700">+{resumeAnalysisResult.missingKeywordsAdded.length - 5}</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Optimization Stats</p>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-2xl font-bold text-white">{resumeAnalysisResult.keyImprovements?.length || 0}</p>
                            <p className="text-xs text-zinc-500">Fixes applied</p>
                          </div>
                          <div className="h-8 w-px bg-zinc-800"></div>
                          <div>
                            <p className="text-2xl font-bold text-white">100%</p>
                            <p className="text-xs text-zinc-500">Format check</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Comparison */}
                  <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-[500px]">
                    {/* Original */}
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Original Source</h3>
                      </div>
                      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-zinc-950/30">
                        {userProfile.resumeText ? (
                          <pre className="text-xs text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed">{userProfile.resumeText}</pre>
                        ) : userProfile.resumeFile ? (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <FileText className="w-8 h-8 text-zinc-700 mb-3" />
                            <p className="text-sm text-zinc-400 font-medium">Resume file loaded</p>
                            <p className="text-xs text-zinc-600 mt-1">Ready to analyze</p>
                          </div>
                        ) : (
                          <label className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors border-2 border-dashed border-zinc-800 hover:border-zinc-700 p-8 rounded-lg group">
                            <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                            <UploadCloud className="w-8 h-8 text-zinc-700 group-hover:text-zinc-500 transition-colors mb-3" />
                            <p className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">Upload PDF Resume</p>
                            <p className="text-xs text-zinc-700 mt-1">Drag & drop or click</p>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Optimized */}
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                          <Award className="w-3.5 h-3.5 mr-2 text-zinc-500" /> Professional Draft
                        </h3>
                        {optimizedResume && (
                          <div className="flex items-center gap-2">
                            <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                              <button
                                onClick={() => setResumeFormat('text')}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${resumeFormat === 'text' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                              >Text</button>
                              <button
                                onClick={() => setResumeFormat('latex')}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${resumeFormat === 'latex' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                              >LaTeX</button>
                            </div>
                            <div className="h-4 w-px bg-zinc-800 mx-1"></div>
                            <button
                              onClick={() => {
                                const contentToCopy = resumeFormat === 'latex' ? latexResume : optimizedResume;
                                navigator.clipboard.writeText(contentToCopy);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                              title="Copy to Clipboard"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                if (latexData) downloadLatexPdf(latexData);
                                else if (resumeAnalysisResult) downloadResumeAsPdf(resumeAnalysisResult, userProfile.name);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded text-xs font-bold transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Export</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-zinc-950/50">
                        {optimizedResume ? (
                          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">{resumeFormat === 'latex' ? latexResume : optimizedResume}</pre>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Bot className="w-8 h-8 text-zinc-500 mb-3" />
                            <p className="text-sm text-zinc-400">Optimization pending</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Improvements List - Clean Document Style */}
                  {resumeAnalysisResult && resumeAnalysisResult.keyImprovements && resumeAnalysisResult.keyImprovements.length > 0 && (
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                      <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-zinc-500" />
                        <h3 className="text-sm font-semibold text-white">Suggested Improvements</h3>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {resumeAnalysisResult.keyImprovements.map((imp, idx) => (
                          <div key={idx} className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 text-xs font-bold text-zinc-400 border border-zinc-700">
                                {idx + 1}
                              </span>
                              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${imp.category === 'Impact' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                imp.category === 'Keywords' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>{imp.category}</span>
                              <p className="text-sm text-zinc-200 font-medium">{imp.suggestion}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pl-9">
                              {/* Original */}
                              <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 rounded-full group-hover:bg-rose-500/50 transition-colors"></div>
                                <div className="pl-4">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center">
                                    Before
                                  </p>
                                  <p className="text-sm text-zinc-500 leading-relaxed bg-zinc-950/50 p-3 rounded-lg border border-transparent group-hover:border-rose-500/20 transition-colors">
                                    "{imp.originalSnippet}"
                                  </p>
                                </div>
                              </div>

                              {/* Optimized */}
                              <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-60"></div>
                                <div className="pl-4">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center">
                                    Optimized
                                  </p>
                                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800 group-hover:border-zinc-700 transition-colors shadow-sm">
                                    "{imp.improvedSnippet}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interview View - Payment Gate */}
            {/* {view === AppView.INTERVIEW && !userProfile.isPremium && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative text-center px-4">
              <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-indigo-600/10">
                <Lock className="w-10 h-10 text-violet-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Premium Feature</h2>
              <p className="text-zinc-400 max-w-lg mb-8 text-lg">
                Unlock unlimited AI Mock Interviews with personalized feedback and scoring. Master your interviews for just <span className="text-white font-bold">₹1</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-lg w-full">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Real-time Simulation</h4>
                    <p className="text-xs text-zinc-400">Voice-enabled AI interviewer</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Detailed Scoring</h4>
                    <p className="text-xs text-zinc-400">Get rated on 1-10 scale</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1 flex items-center"
              >
                Unlock Now for ₹1
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <p className="mt-4 text-xs text-zinc-500 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Secure payment via Razorpay
              </p>
              <button
                onClick={() => setUserProfile(p => ({ ...p, isPremium: true }))}
                className="mt-8 text-[10px] text-zinc-700 hover:text-violet-400 transition-colors"
                title="Dev Bypass"
              >
                [Dev Bypass]
              </button>
            </div>
          )} */}

            {/* Interview View */}
            {view === AppView.INTERVIEW && /*userProfile.isPremium &&*/ (
              <div className="h-[calc(100dvh-160px)] md:h-[calc(100vh-140px)] md:min-h-[600px] flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">

                {isGeneratingFeedback ? (
                  /* Feedback Loading State */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Analyzing Performance</h3>
                    <p className="text-zinc-400 max-w-md">Our AI is reviewing your answers, tone, and technical accuracy to generate a personalized report.</p>
                  </div>
                ) : interviewFeedback ? (
                  /* Feedback Report */
                  <InterviewAnalysisView
                    feedback={interviewFeedback}
                    onClose={() => {
                      setInterviewFeedback(null);
                      setChatMessages([]);
                    }}
                  />
                ) : !isInterviewStarted ? (
                  /* Minimal Focused Start Screen */
                  <div className="flex-1 flex flex-col">
                    {/* Compact Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                      <div>
                        <h1 className="text-xl font-bold text-white">Mock Interview Simulator</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Target Role: <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                      </div>
                      {/* Past Interviews Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowPastInterviewsDropdown(!showPastInterviewsDropdown)}
                          className="text-sm text-zinc-400 hover:text-white flex items-center transition-colors"
                        >
                          <History className="w-4 h-4 mr-1.5" />
                          Past Interviews
                          <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showPastInterviewsDropdown ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {showPastInterviewsDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {userProfile.pastInterviews && userProfile.pastInterviews.length > 0 ? (
                                userProfile.pastInterviews.map((interview) => (
                                  <div
                                    key={interview.id}
                                    className="px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-white">{interview.targetRole}</div>
                                      <div className="text-xs text-zinc-500 mt-0.5">
                                        {new Date(interview.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        <span className="mx-1.5">•</span>
                                        <span className={interview.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{interview.score}%</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setInterviewFeedback(interview.feedback);
                                        setShowPastInterviewsDropdown(false);
                                      }}
                                      className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                                    >
                                      View Analysis
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-sm text-zinc-500">
                                  No past interviews yet.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-6">
                      <div className="text-center max-w-md">
                        <button
                          onClick={startInterview}
                          className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-zinc-900 px-12 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-white/5 flex items-center justify-center mx-auto"
                        >
                          <Play className="w-6 h-6 mr-3 fill-zinc-900 text-zinc-900" />
                          Start Mock Interview
                        </button>
                        <p className="text-sm text-zinc-500 mt-4">
                          Role-specific AI interviewer with instant feedback
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Chat Interface */
                  <>
                    <div className="bg-white/5 p-5 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        <span className="font-bold text-zinc-200">AI Interviewer <span className="text-zinc-500 font-normal">| {userProfile.targetRole}</span></span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Timer - Always visible, responsive sizing */}
                        <div className="flex items-center space-x-1 sm:space-x-2 bg-zinc-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-zinc-700">
                          <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${((2100 - interviewElapsedSeconds) < 300) ? 'text-amber-400' : 'text-zinc-400'}`} />
                          <span className={`font-mono font-bold text-xs sm:text-sm ${((2100 - interviewElapsedSeconds) < 60) ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>
                            {Math.floor((2100 - interviewElapsedSeconds) / 60).toString().padStart(2, '0')}:
                            {((2100 - interviewElapsedSeconds) % 60).toString().padStart(2, '0')}
                          </span>
                        </div>

                        <button
                          onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                          className={`transition-colors ${isSpeakingEnabled ? 'text-violet-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                          title="Toggle Text-to-Speech"
                        >
                          {isSpeakingEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                        <button
                          onClick={handleEndInterview}
                          className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider border border-red-500/30 px-2 sm:px-3 py-1 rounded-full hover:bg-red-500/10 transition-all"
                        >
                          End
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                      {/* Only show 'Connecting' if truly loading and no messages yet */}
                      {chatMessages?.length === 0 && isChatLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
                          <p>Initializing interview session...</p>
                        </div>
                      )}

                      {chatMessages?.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl p-6 shadow-lg backdrop-blur-sm ${msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-none'
                            : 'bg-zinc-800/80 border border-white/10 text-zinc-200 rounded-bl-none'
                            }`}>
                            <div className="flex items-center space-x-2 mb-2 opacity-60">
                              {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                              <span className="text-xs font-bold uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'Interviewer'}</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && chatMessages.length > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-800/80 border border-white/10 rounded-2xl rounded-bl-none p-6 shadow-lg flex items-center space-x-3">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span className="text-xs font-medium text-zinc-400">Interviewer is typing...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 bg-white/5 border-t border-white/5">
                      <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type your answer here..."
                          className="flex-1 p-4 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
                          disabled={isChatLoading}
                        />
                        {isSpeechRecognitionSupported && (
                          <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-4 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-slate-700'}`}
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isChatLoading}
                          className="bg-violet-600 text-white p-4 rounded-xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}


          </div>
        </main >
        {/* Render Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackModal
            userEmail={currentUserEmail || 'anonymous@user.com'}
            onClose={() => setShowFeedbackModal(false)}
          />
        )}
        {/* Profile Modal */}
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          currentUserEmail={currentUserEmail}
          analysis={analysis}
          resumeAnalysisResult={resumeAnalysisResult}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          setView={setView}
          handleLogout={handleLogout}
        />

        {/* Mobile Nav */}
        {
          isLoggedIn && (
            <MobileBottomNav
              currentView={view}
              onChangeView={setView}
              onLogout={handleLogout}
              onSwitchTrack={() => setView(AppView.ONBOARDING)}
              onResetData={handleResetData}
              onOpenFeedback={() => setShowFeedbackModal(true)}
              onOpenProfile={() => setShowProfileModal(true)}
            />
          )
        }

        {/* Confirm Reset Modal */}
        <ConfirmResetModal
          isOpen={showConfirmResetModal}
          onClose={() => setShowConfirmResetModal(false)}
          onConfirm={confirmResetData}
        />
      </div >
    </>
  );
};

export default App;
