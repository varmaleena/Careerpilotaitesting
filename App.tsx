import { Chat } from '@google/genai';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Briefcase,
  Check,
  ChevronRight,
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
  Save
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from "react";
import LandingPage from "./components/LandingPage";
import FeedbackFloating from './components/FeedbackFloating';
import { ScoreGauge } from "./components/ScoreGauge";
import Sidebar from "./components/Sidebar";
import { SkillCard } from "./components/SkillCard";
import { AuthService } from './services/authService';
import { canStartNewInterview } from './services/interviewSessionManager';
import { generateLearningPlan, generateProjectIdeas } from './services/learningService';
import { downloadLatexPdf, downloadResumeAsPdf } from './services/pdfExportService';
import { extractTextFromPdf } from './services/pdfService';
import { evaluatePremiumInterview, generatePremiumInterviewResponse } from './services/premiumInterviewService';
import { analyzeProfile, generateLatexData, optimizeResume } from './services/resumeService';
import { analytics, EVENTS, USER_PROPS } from './services/analytics';
import {
  AppView,
  CareerAnalysis,
  ChatMessage,
  InterviewFeedback,
  LatexResumeData,
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
  const [view, setView] = useState<AppView>(AppView.LANDING);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Auth Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Profile Modal State
  const [profileTab, setProfileTab] = useState<'profile' | 'payments'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // User Data State
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', targetRole: '' });
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  // --- Persistence Effects ---

  // Save state on critical updates ONLY if logged in
  useEffect(() => {
    if (isLoggedIn && currentUserEmail) {
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
      const msg = "The AI system reached its daily limit (Quota Exceeded). \n\nFIX: Please wait a moment, or add a second Gemini API Key to your .env.local file as VITE_GEMINI_API_KEY_2 to double your capacity!";
      alert(msg);
    } else {
      alert(`${defaultMsg}: ${error.message || "Unknown error"}.`);
    }
  };

  // --- Auth Handlers ---

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Validation
    if (!AuthService.isValidEmail(emailInput)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!AuthService.isValidPassword(passwordInput)) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

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

  const loginUser = async (email: string) => {
    const userData = await AuthService.getUserData(email);
    if (userData) {
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
        setView(AppView.DASHBOARD);
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

  const handleResetData = async () => {
    if (!currentUserEmail) return;
    if (window.confirm("Are you sure? This will delete your resume, learning plan, and progress PERMANENTLY.")) {
      // Create fresh empty data
      const emptyData = {
        userProfile: { name: userProfile.name, targetRole: '' },
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
      setUserProfile(emptyData.userProfile);
      setAnalysis(null);
      setPlan(null);
      setProjects([]);
      setSeenProjectTitles([]);

      setChatMessages([]);
      setInterviewFeedback(null);
      setView(AppView.ONBOARDING);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Please upload a PDF smaller than 2MB.");
        return;
      }
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userProfile?.resumeText && !userProfile?.resumeFile) || !userProfile?.targetRole) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeProfile(
        { text: userProfile.resumeText, file: userProfile.resumeFile },
        userProfile.targetRole
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
    if (chatMessages.length < 2) {
      setIsInterviewStarted(false);
      setChatMessages([]);
      setInterviewStartTime(null);
      setInterviewElapsedSeconds(0);
      return;
    }

    window.speechSynthesis.cancel();
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
        score: evaluation.overallScore / 10, // Convert 0-100 to 0-10
        feedbackSummary: evaluation.detailedFeedback,
        strengths: evaluation.strengths,
        improvements: evaluation.blockingGaps,
        recommendedFocus: evaluation.nextSteps[0] || 'Continue practicing'
      };

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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };


  // --- Landing View ---
  if (view === AppView.LANDING) {
    return (
      <>
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setEmailInput('');
                  setPasswordInput('');
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {authMode === 'login'
                    ? 'Enter your credentials to access your career plan.'
                    : 'Join CareerPilot to start your journey.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                      placeholder="••••••••"
                    />
                  </div>
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
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                >
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl transition-all hover:bg-slate-200 flex items-center justify-center space-x-2"
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

              <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                  }}
                  className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 max-w-2xl w-full rounded-2xl shadow-2xl shadow-black/50 p-8 border border-slate-800 relative">
          {/* Back to Login if stuck */}
          <button
            onClick={handleLogout}
            className="absolute top-6 right-6 text-slate-500 hover:text-white flex items-center text-sm"
          >
            <User className="w-4 h-4 mr-2" /> {userProfile.name} (Logout)
          </button>

          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Setup your Pilot</h1>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-6">
            {/* Career Stage Section */}
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Compass className="w-5 h-5 mr-2 text-indigo-400" />
                Where are you in your journey?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Experience Level</label>
                  <select
                    required
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
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
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Graduation Year</label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                    placeholder="e.g. 2024, 2025..."
                    value={userProfile.graduationYear || ''}
                    onChange={e => setUserProfile(prev => ({ ...prev, graduationYear: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Career Goals Section */}
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-emerald-400" />
                What's your career goal?
              </h3>

              {/* Target Role */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Target Role <span className="text-slate-500 font-normal">(What job do you want?)</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                  placeholder="e.g. Software Engineer, Data Analyst, Product Manager..."
                  value={userProfile.targetRole}
                  onChange={e => setUserProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Not sure? Try: "Software Developer", "Frontend Engineer", "Data Scientist"
                </p>
              </div>

              {/* Target Companies */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Dream Companies <span className="text-slate-500 font-normal">(Optional - helps us tailor advice)</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                  placeholder="e.g. Google, Microsoft, Amazon, Startup..."
                  value={userProfile.targetCompanies || ''}
                  onChange={e => setUserProfile(prev => ({ ...prev, targetCompanies: e.target.value }))}
                />
                <p className="text-xs text-slate-500 mt-1">
                  We'll optimize your resume and learning path for these companies
                </p>
              </div>
            </div>

            {/* Resume Upload Section */}
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-amber-400" />
                Upload Your Resume
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload Option */}
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${userProfile.resumeFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800'}`}>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    {userProfile.resumeFile ? (
                      <>
                        <FileText className="w-8 h-8 text-emerald-400 mb-2" />
                        <span className="text-sm font-medium text-emerald-300">Resume Uploaded ✓</span>
                        <span className="text-xs text-emerald-500/70 mt-1">Ready to analyze</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-sm font-medium text-slate-300">Upload PDF / TXT</span>
                        <span className="text-xs text-slate-500 mt-1">Drag & drop or click</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Or Text Paste Option */}
                <div className="relative">
                  <textarea
                    className="w-full h-full min-h-[140px] p-4 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none font-mono text-xs placeholder-slate-600"
                    placeholder="Or paste resume text here..."
                    value={userProfile.resumeText || ''}
                    onChange={e => setUserProfile(prev => ({ ...prev, resumeText: e.target.value }))}
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">
                    {userProfile.resumeText?.length || 0} chars
                  </div>
                </div>
              </div>


            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Profile...</span>
                </>
              ) : (
                <>
                  <span>Launch Career Analysis</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main App Layout ---
  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      <Sidebar
        currentView={view}
        onChangeView={setView}
        onLogout={handleLogout}
        onSwitchTrack={handleSwitchTrack}
        onResetData={handleResetData}
      />

      <main className="flex-1 md:ml-64 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto max-h-screen bg-slate-950 relative">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-purple-900/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {view === AppView.DASHBOARD && 'Dashboard'}
                {view === AppView.PLAN && 'Learning Plan'}
                {view === AppView.INTERVIEW && 'Interview Simulator'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Target Role: <span className="text-indigo-400 font-medium">{userProfile.targetRole}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform cursor-pointer"
              >
                {userProfile.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </div>
          </header>

          {/* Dashboard View */}
          {view === AppView.DASHBOARD && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 col-span-1 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Match Potential</h3>
                  <ScoreGauge score={analysis.readinessScore} />
                  <p className="text-center text-sm text-slate-300 mt-4 leading-relaxed">
                    {analysis.readinessScore > 75
                      ? "You're a strong candidate! Focus on polishing your advanced skills."
                      : "Great foundation. Completing your plan can boost this significantly."}
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 col-span-2 flex flex-col justify-between shadow-xl">
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-emerald-400 mb-4 uppercase tracking-widest flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" /> Top Strengths
                    </h3>
                    <div className="space-y-3">
                      {analysis.strengths?.map((s, i) => (
                        <div key={i} className="flex items-start text-sm text-slate-200 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                          <span className="mr-2 text-emerald-500 font-bold">•</span> {s}
                        </div>
                      ))}
                      {(!analysis.strengths || analysis.strengths.length === 0) && <div className="text-slate-500 text-sm">No strengths detected yet.</div>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest flex items-center">
                      <Target className="w-4 h-4 mr-2" /> Key Gaps
                    </h3>
                    <div className="space-y-3">
                      {analysis.weaknesses?.map((w, i) => (
                        <div key={i} className="flex items-start text-sm text-slate-200 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                          <span className="mr-2 text-amber-500 font-bold">•</span> {w}
                        </div>
                      ))}
                      {(!analysis.weaknesses || analysis.weaknesses.length === 0) && <div className="text-slate-500 text-sm">No gaps detected yet.</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Matrix */}
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-white">Skills Breakdown</h3>
                  <span className="text-xs font-bold px-3 py-1 bg-white/10 border border-white/10 rounded-full text-slate-300">
                    {analysis.skills?.length || 0} skills tracked
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm text-slate-400 mb-4 font-bold uppercase tracking-wider">Acquired</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills?.filter(s => s.status === 'acquired').map(s => <SkillCard key={s.name} skill={s} />)}
                      {analysis.skills?.filter(s => s.status === 'acquired').length === 0 && <span className="text-sm text-slate-500 italic">No exact matches found yet.</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-400 mb-4 font-bold uppercase tracking-wider">Missing / To Learn</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills?.filter(s => s.status === 'missing').map(s => <SkillCard key={s.name} skill={s} />)}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isGeneratingPlan}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all flex items-center space-x-2 text-sm font-bold disabled:opacity-70"
                  >
                    {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    <span>{plan ? 'Regenerate Roadmap' : 'Generate Career Roadmap'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Learning Plan View */}
          {view === AppView.PLAN && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!plan && !isGeneratingPlan && (
                <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Plan Generated Yet</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">Create a personalized curriculum based on your skill gaps using our AI architect.</p>
                  <button
                    onClick={handleGeneratePlan}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Generate Plan Now
                  </button>
                </div>
              )}

              {isGeneratingPlan && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="text-slate-300 font-medium text-lg">Designing your curriculum...</p>
                </div>
              )}

              {plan && (
                <div className="space-y-8">
                  {plan?.map((week, idx) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                      <div className="bg-white/5 px-8 py-5 border-b border-white/5 flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-bold text-white">Week {idx + 1}</h3>
                          <p className="text-sm text-indigo-300 mt-1 font-medium">{week.theme}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-white/5">
                        {week.tasks?.map((task) => (
                          <div key={task.id} className="p-8 hover:bg-white/5 transition-colors group relative">
                            <div className="flex items-start space-x-6">
                              <div className={`p-3 rounded-xl shrink-0 ${task.type === 'project' ? 'bg-purple-500/20 text-purple-300' :
                                task.type === 'course' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-amber-500/20 text-amber-300'
                                }`}>
                                {task.type === 'project' ? <Briefcase className="w-6 h-6" /> :
                                  task.type === 'course' ? <PlayCircle className="w-6 h-6" /> :
                                    <BookOpen className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start pr-8">
                                  <h4 className={`text-lg font-bold mb-2 transition-all ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                                    {task.title}
                                  </h4>
                                  <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded text-slate-400 flex items-center shrink-0">
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    {task.estimatedHours}h
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{task.description}</p>

                                <div className="flex items-center space-x-4 mt-2">
                                  {/* Video Resource Link */}
                                  {task.videoQuery && (
                                    <a
                                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.videoQuery)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                                    >
                                      <Youtube className="w-3 h-3 mr-2" /> Watch Tutorial
                                    </a>
                                  )}

                                  <button
                                    onClick={() => handleToggleTask(idx, task.id)}
                                    className={`text-xs font-bold transition-all inline-flex items-center ${task.completed
                                      ? 'text-emerald-400'
                                      : 'text-indigo-400 opacity-0 group-hover:opacity-100'
                                      } hover:text-indigo-300`}
                                  >
                                    {task.completed ? (
                                      <><Check className="w-3 h-3 mr-1" /> Done</>
                                    ) : (
                                      <>Mark Done <ChevronRight className="w-3 h-3 ml-1" /></>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(idx, task.id)}
                                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add Task UI */}
                        <div className="p-4 bg-white/5">
                          {addingTaskWeek === idx ? (
                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
                              <div className="space-y-4">
                                <input
                                  type="text"
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  placeholder="Task title..."
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <div className="flex space-x-3">
                                  <select
                                    value={newTaskType}
                                    onChange={(e) => setNewTaskType(e.target.value as any)}
                                    className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 outline-none"
                                  >
                                    <option value="reading">Reading</option>
                                    <option value="course">Course</option>
                                    <option value="project">Project</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={newTaskHours}
                                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                                    min={0.5}
                                    step={0.5}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none"
                                  />
                                  <div className="flex-1"></div>
                                  <button
                                    onClick={() => setAddingTaskWeek(null)}
                                    className="p-3 text-slate-400 hover:text-white"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleAddTask(idx)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl"
                                  >
                                    Add Task
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingTaskWeek(idx)}
                              className="w-full py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-indigo-400 border border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl transition-all"
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Custom Task
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Hub View */}
          {view === AppView.PROJECTS && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Section with Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/40 rounded-3xl border border-indigo-500/20 p-8 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2 flex items-center">
                      <Code className="w-8 h-8 mr-3 text-indigo-400" />
                      Portfolio Builder
                    </h3>
                    <p className="text-slate-300 text-sm max-w-2xl">
                      AI-powered project ideas tailored to <span className="text-indigo-400 font-semibold">{userProfile.targetRole}</span> at your target companies
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateProjects}
                    disabled={isGeneratingProjects}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingProjects ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Generate New Ideas
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading State with Skeleton */}
              {isGeneratingProjects && projects?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 bg-gradient-to-br from-white/5 to-indigo-500/5 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)] animate-pulse" />
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                    <p className="text-slate-300 text-lg font-medium mb-2">Crafting Your Perfect Projects...</p>
                    <p className="text-slate-500 text-sm">Analyzing your skills and target role</p>
                  </div>
                </div>
              )}

              {/* Projects Grid */}
              {projects?.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects?.map((project, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1"
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300" />

                      {/* Card Content */}
                      <div className="relative p-6 flex flex-col h-full">
                        {/* Header with Difficulty Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-lg ${project.difficulty === 'Beginner'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-emerald-500/20'
                            : project.difficulty === 'Intermediate'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-blue-500/20'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-purple-500/20'
                            }`}>
                            {project.difficulty}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                            <Layers className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>

                        {/* Project Title */}
                        <h4 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors leading-tight">
                          {project.title}
                        </h4>

                        {/* Description */}
                        <p className="text-slate-400 text-sm mb-4 flex-1 leading-relaxed line-clamp-3">
                          {project.description}
                        </p>

                        {/* Tech Stack */}
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                            <Code className="w-3 h-3 mr-1.5" />
                            Tech Stack
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {project.techStack?.slice(0, 4).map(t => (
                              <span
                                key={t}
                                className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                              >
                                {t}
                              </span>
                            ))}
                            {project.techStack?.length > 4 && (
                              <span className="text-xs bg-slate-800/80 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
                                +{project.techStack.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Key Features - Collapsible */}
                        {project.keyFeatures && project.keyFeatures.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1.5" />
                              Key Features
                            </h5>
                            <ul className="space-y-1.5">
                              {project.keyFeatures.slice(0, 3).map((feature, fIdx) => (
                                <li key={fIdx} className="text-xs text-slate-400 flex items-start">
                                  <ChevronRight className="w-3 h-3 mr-1 mt-0.5 text-indigo-400 shrink-0" />
                                  <span className="line-clamp-1">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Resume Value Highlight */}
                        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 p-4 rounded-xl border border-indigo-500/30 mb-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl" />
                          <div className="relative flex items-start space-x-2">
                            <TrendingUp className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-indigo-300 mb-1">Resume Impact</p>
                              <p className="text-xs text-indigo-200/90 italic leading-relaxed">"{project.resumeValue}"</p>
                            </div>
                          </div>
                        </div>

                        {/* Learning Outcomes */}
                        {project.learningOutcomes && project.learningOutcomes.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-slate-700/50">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                              <Award className="w-3 h-3 mr-1.5" />
                              You'll Learn
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {project.learningOutcomes.slice(0, 3).map((outcome, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20"
                                >
                                  {outcome}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Implementation Steps Preview */}
                        {project.implementationFlow && project.implementationFlow.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                              <List className="w-3 h-3 mr-1.5" />
                              Implementation Steps
                            </h5>
                            <div className="space-y-1.5">
                              {project.implementationFlow.slice(0, 2).map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start text-xs text-slate-400">
                                  <span className="text-indigo-400 font-bold mr-2 shrink-0">{sIdx + 1}.</span>
                                  <span className="line-clamp-1">{step}</span>
                                </div>
                              ))}
                              {project.implementationFlow.length > 2 && (
                                <p className="text-xs text-slate-500 italic ml-5">+{project.implementationFlow.length - 2} more steps...</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="w-full mt-auto bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 group-hover:scale-[1.02]"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Full Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isGeneratingProjects && projects?.length === 0 && (
                <div className="text-center py-24 bg-gradient-to-br from-white/5 to-indigo-500/5 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)]" />
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                      <Code className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Build Your Portfolio</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Stuck on what to build? Get 3 tailored project ideas (Beginner to Advanced) designed to impress recruiters at <span className="text-indigo-400 font-semibold">{userProfile.targetCompanies || 'top companies'}</span>.
                    </p>
                    <button
                      onClick={handleGenerateProjects}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-base flex items-center mx-auto transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
                    >
                      <Code className="w-5 h-5 mr-2" />
                      Generate Projects Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Details Modal */}
          {selectedProject && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
              onClick={() => setSelectedProject(null)}
            >
              <div
                className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-indigo-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-indigo-500/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/40 backdrop-blur-xl border-b border-indigo-500/20 p-6 z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-lg ${selectedProject.difficulty === 'Beginner'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : selectedProject.difficulty === 'Intermediate'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}>
                          {selectedProject.difficulty}
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">{selectedProject.title}</h2>
                      <p className="text-slate-400 text-sm leading-relaxed">{selectedProject.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="ml-4 w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Tech Stack */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-indigo-400" />
                      Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack?.map(t => (
                        <span
                          key={t}
                          className="text-sm bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  {selectedProject.keyFeatures && selectedProject.keyFeatures.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                        Key Features
                      </h3>
                      <ul className="space-y-2">
                        {selectedProject.keyFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-slate-300">
                            <ChevronRight className="w-4 h-4 mr-2 mt-1 text-indigo-400 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Implementation Flow */}
                  {selectedProject.implementationFlow && selectedProject.implementationFlow.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <List className="w-5 h-5 mr-2 text-purple-400" />
                        Implementation Steps
                      </h3>
                      <div className="space-y-3">
                        {selectedProject.implementationFlow.map((step, idx) => (
                          <div key={idx} className="flex items-start bg-white/5 p-4 rounded-xl border border-white/10">
                            <span className="text-indigo-400 font-bold text-lg mr-3 shrink-0">{idx + 1}.</span>
                            <span className="text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Outcomes */}
                  {selectedProject.learningOutcomes && selectedProject.learningOutcomes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-400" />
                        What You'll Learn
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.learningOutcomes.map((outcome, idx) => (
                          <span
                            key={idx}
                            className="text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20"
                          >
                            {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Value */}
                  <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <h3 className="text-lg font-bold text-indigo-300 mb-2 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Resume Impact
                      </h3>
                      <p className="text-indigo-200 italic leading-relaxed">"{selectedProject.resumeValue}"</p>
                    </div>
                  </div>

                  {/* Implementation Resources */}
                  {selectedProject.implementationResources && selectedProject.implementationResources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <ExternalLink className="w-5 h-5 mr-2 text-blue-400" />
                        Helpful Resources
                      </h3>
                      <div className="space-y-2">
                        {selectedProject.implementationResources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all group"
                          >
                            <span className="text-slate-300 group-hover:text-white transition-colors">{resource.name}</span>
                            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Paper (if available) */}
                  {selectedProject.sourcePaper && (
                    <div className="bg-amber-900/20 p-6 rounded-2xl border border-amber-500/20">
                      <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Research Paper Source
                      </h3>
                      <div className="space-y-2">
                        <p className="text-white font-semibold">{selectedProject.sourcePaper.title}</p>
                        <p className="text-slate-400 text-sm">{selectedProject.sourcePaper.authors.join(', ')}</p>
                        <p className="text-slate-500 text-xs mb-3">{selectedProject.sourcePaper.publishedDate}</p>
                        <p className="text-slate-300 text-sm mb-4">{selectedProject.sourcePaper.abstractSummary}</p>
                        <a
                          href={selectedProject.sourcePaper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-amber-400 hover:text-amber-300 text-sm font-medium"
                        >
                          Read Full Paper <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${selectedProject.title}\n\n${selectedProject.description}\n\nTech Stack: ${selectedProject.techStack?.join(', ')}`);
                        alert('Project details copied to clipboard!');
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all border border-slate-700 hover:border-indigo-500/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Details
                    </button>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                    >
                      Got It!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume View - Payment Gate */}
          {/* {view === AppView.RESUME && !userProfile.isResumePremium && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative text-center px-4">
              <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-600/10">
                <FileText className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Resume Architect Pro</h2>
              <p className="text-slate-400 max-w-lg mb-8 text-lg">
                Unlock professional resume optimization and LaTeX downloads. Land 3x more interviews with an ATS-optimized resume for just <span className="text-white font-bold">₹1</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-lg w-full">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ATS Optimization</h4>
                    <p className="text-xs text-slate-400">Keyword injection & metric focus</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <Code className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">LaTeX Export</h4>
                    <p className="text-xs text-slate-400">Get professional PDF versions</p>
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
              <p className="mt-4 text-xs text-slate-500 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Secure payment via Razorpay
              </p>
              <button
                onClick={() => setUserProfile(p => ({ ...p, isResumePremium: true }))}
                className="mt-8 text-[10px] text-slate-700 hover:text-emerald-400 transition-colors"
                title="Dev Bypass"
              >
                [Dev Bypass]
              </button>
            </div>
          )} */}

          {/* Resume View */}
          {view === AppView.RESUME && /*userProfile.isResumePremium &&*/ (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Resume Architect</h2>
                    <p className="text-slate-400">Transform your resume into an ATS-beating machine for {userProfile.targetRole}.</p>
                  </div>
                </div>

                {/* Profile URLs Section - REQUIRED BEFORE OPTIMIZATION */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/30 mb-8">
                  <div className="flex items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-4 shrink-0">
                      <Link className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Profile Links (Required)</h3>
                      <p className="text-slate-400 text-sm">Add your professional profile URLs to include them in your optimized resume.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GitHub - Syncs with Profile */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">
                        <Github className="w-3 h-3 inline mr-1" />
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/yourname"
                        value={userProfile.githubProfile || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserProfile(prev => ({ ...prev, githubProfile: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                      />
                    </div>

                    {/* LinkedIn - Syncs with Profile */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">
                        <Linkedin className="w-3 h-3 inline mr-1" />
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/yourname"
                        value={userProfile.linkedinProfile || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserProfile(prev => ({ ...prev, linkedinProfile: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                      />
                    </div>

                    {/* LeetCode - Syncs with Profile */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">
                        <Code className="w-3 h-3 inline mr-1" />
                        LeetCode Profile (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://leetcode.com/yourname"
                        value={userProfile.leetcodeProfile || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserProfile(prev => ({ ...prev, leetcodeProfile: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* Warning if URLs missing */}
                  {(!userProfile.githubProfile || !userProfile.linkedinProfile) && (
                    <div className="mt-4 flex items-start space-x-2 text-amber-400 text-sm bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Please add at least GitHub and LinkedIn URLs for a complete professional resume.</p>
                    </div>
                  )}
                </div>

                {/* Optimize Button */}
                <div className="flex justify-end mb-8">
                  <button
                    onClick={handleOptimizeResume}
                    disabled={isOptimizingResume || !userProfile.githubProfile || !userProfile.linkedinProfile}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOptimizingResume ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                    {optimizedResume ? 'Regenerate Version' : 'Polish My Resume'}
                  </button>
                </div>

                {/* New Feature: ATS Score & Improvements Dashboard */}
                {resumeAnalysisResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    {/* Score Card */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-indigo-500/30 flex items-center justify-between relative overflow-hidden group">
                      <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">ATS Score Impact</p>
                        <div className="flex items-baseline space-x-3">
                          <span className="text-slate-400 text-2xl font-bold line-through opacity-50">{resumeAnalysisResult.atsScore.before}</span>
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                          <span className="text-4xl font-bold text-white text-shadow-glow">{resumeAnalysisResult.atsScore.after}</span>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Keywords Added</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeAnalysisResult.missingKeywordsAdded.slice(0, 4).map(k => (
                          <span key={k} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">{k}</span>
                        ))}
                        {resumeAnalysisResult.missingKeywordsAdded.length > 4 && (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">+{resumeAnalysisResult.missingKeywordsAdded.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Optimization Focus</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Enhanced impact metrics, standardized formatting, and injected {resumeAnalysisResult.missingKeywordsAdded.length} missing keywords for {userProfile.targetRole}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8 h-[600px]">
                  {/* Original / Source */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Original Content</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed opacity-70">
                      {userProfile.resumeText ? (
                        userProfile.resumeText
                      ) : userProfile.resumeFile ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                            <FileText className="w-8 h-8 text-emerald-500" />
                          </div>
                          <p className="font-medium text-slate-300">Resume File Uploaded</p>
                          <p className="text-xs text-slate-500 mt-1">PDF / DOCX ready for analysis</p>
                          <p className="text-xs text-slate-600 mt-4 max-w-[200px] text-center">
                            Click "Polish My Resume" to extract text and optimize.
                          </p>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full text-slate-500 cursor-pointer hover:bg-white/5 rounded-xl transition-all border-2 border-dashed border-slate-700 hover:border-indigo-500">
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleResumeUpload}
                          />
                          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                            <Download className="w-8 h-8 text-indigo-500 rotate-180" />
                          </div>
                          <p className="font-medium text-slate-300">Upload Resume (PDF)</p>
                          <p className="text-xs text-slate-500 mt-1">We will extract the text automatically.</p>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Optimized Result */}
                  <div className="bg-indigo-900/10 p-6 rounded-2xl border border-indigo-500/20 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center">
                        <Award className="w-4 h-4 mr-2" /> AI Optimized Version
                      </h3>
                      {optimizedResume && (
                        <div className="flex gap-3 items-center">
                          {/* Format Toggle */}
                          <div className="flex bg-slate-700/50 rounded-lg border border-slate-600 p-1">
                            <button
                              onClick={() => setResumeFormat('text')}
                              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${resumeFormat === 'text'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:text-white'
                                }`}
                            >
                              Text
                            </button>
                            <button
                              onClick={() => setResumeFormat('latex')}
                              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${resumeFormat === 'latex'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:text-white'
                                }`}
                            >
                              LaTeX
                            </button>
                          </div>

                          {/* Copy Button - Symbol Only */}
                          <button
                            onClick={() => {
                              const contentToCopy = resumeFormat === 'latex' ? latexResume : optimizedResume;
                              navigator.clipboard.writeText(contentToCopy);
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                            title={resumeFormat === 'latex' ? 'Copy LaTeX code' : 'Copy resume text'}
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>

                          {/* Download Button - Symbol Only */}
                          <button
                            onClick={() => {
                              // Always prefer the professional LaTeX format if available
                              if (latexData) {
                                downloadLatexPdf(latexData);
                              } else if (resumeAnalysisResult) {
                                downloadResumeAsPdf(resumeAnalysisResult, userProfile.name);
                              }
                            }}
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                            title="Download as PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {optimizedResume ? (
                      <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                        {resumeFormat === 'latex' ? latexResume : optimizedResume}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                        <FileText className="w-16 h-16 mb-4" />
                        <p>Click "Polish My Resume" to generate the improved version.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Improvements List */}
                {resumeAnalysisResult && resumeAnalysisResult.keyImprovements && (
                  <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Detailed Improvements</h3>
                    <div className="grid gap-4">
                      {resumeAnalysisResult.keyImprovements.map((imp, idx) => (
                        <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded mr-3 uppercase tracking-wider ${imp.category === 'Impact' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              imp.category === 'Keywords' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              }`}>
                              {imp.category}
                            </span>
                            <p className="text-slate-200 font-medium text-sm">{imp.suggestion}</p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-xs font-mono mt-3">
                            <div className="bg-red-900/10 p-3 rounded text-red-300 border border-red-500/10">
                              <p className="mb-1 text-[10px] uppercase opacity-50">Before</p>
                              "{imp.originalSnippet}"
                            </div>
                            <div className="bg-emerald-900/10 p-3 rounded text-emerald-300 border border-emerald-500/10">
                              <p className="mb-1 text-[10px] uppercase opacity-50">After</p>
                              "{imp.improvedSnippet}"
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
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative text-center px-4">
              <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-indigo-600/10">
                <Lock className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Premium Feature</h2>
              <p className="text-slate-400 max-w-lg mb-8 text-lg">
                Unlock unlimited AI Mock Interviews with personalized feedback and scoring. Master your interviews for just <span className="text-white font-bold">₹1</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-lg w-full">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Real-time Simulation</h4>
                    <p className="text-xs text-slate-400">Voice-enabled AI interviewer</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Detailed Scoring</h4>
                    <p className="text-xs text-slate-400">Get rated on 1-10 scale</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1 flex items-center"
              >
                Unlock Now for ₹1
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <p className="mt-4 text-xs text-slate-500 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Secure payment via Razorpay
              </p>
              <button
                onClick={() => setUserProfile(p => ({ ...p, isPremium: true }))}
                className="mt-8 text-[10px] text-slate-700 hover:text-indigo-400 transition-colors"
                title="Dev Bypass"
              >
                [Dev Bypass]
              </button>
            </div>
          )} */}

          {/* Interview View */}
          {view === AppView.INTERVIEW && /*userProfile.isPremium &&*/ (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative">

              {isGeneratingFeedback ? (
                /* Feedback Loading State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Analyzing Performance</h3>
                  <p className="text-slate-400 max-w-md">Our AI is reviewing your answers, tone, and technical accuracy to generate a personalized report.</p>
                </div>
              ) : interviewFeedback ? (
                /* Feedback Report */
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center mb-8">
                      <div className="inline-block p-4 rounded-full bg-indigo-500/10 mb-4">
                        <Award className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">Interview Summary</h2>
                      <p className="text-slate-400">Here is how you performed in your mock session.</p>
                    </div>

                    {/* Score & Summary */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2">Overall Score</span>
                        <div className={`text-5xl font-bold mb-2 ${interviewFeedback.score >= 8 ? 'text-emerald-400' :
                          interviewFeedback.score >= 6 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                          {interviewFeedback.score}<span className="text-2xl text-slate-600">/10</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/10">
                        <span className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Executive Summary</span>
                        <p className="text-slate-200 leading-relaxed">{interviewFeedback.feedbackSummary}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="bg-emerald-900/10 rounded-2xl p-6 border border-emerald-500/20">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" /> Key Strengths
                        </h4>
                        <ul className="space-y-3">
                          {interviewFeedback.strengths?.map((s, i) => (
                            <li key={i} className="flex items-start text-sm text-emerald-100/80">
                              <span className="mr-2 text-emerald-500">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="bg-amber-900/10 rounded-2xl p-6 border border-amber-500/20">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-amber-400" /> Areas to Improve
                        </h4>
                        <ul className="space-y-3">
                          {interviewFeedback.improvements?.map((s, i) => (
                            <li key={i} className="flex items-start text-sm text-amber-100/80">
                              <span className="mr-2 text-amber-500">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/20 flex items-start space-x-4">
                      <div className="p-3 bg-indigo-500/20 rounded-xl shrink-0">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Recommended Focus</h4>
                        <p className="text-indigo-200 text-sm">{interviewFeedback.recommendedFocus}</p>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          setInterviewFeedback(null);
                          setChatMessages([]);
                        }}
                        className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg"
                      >
                        Done & Return to Menu
                      </button>
                    </div>
                  </div>
                </div>
              ) : !isInterviewStarted ? (
                /* Start Screen */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 to-slate-900/50 z-0"></div>
                  <div className="relative z-10 max-w-lg">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(79,70,229,0.4)] transform rotate-3">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Mock Interview Simulator</h3>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                      Ready to practice? I'll act as a hiring manager for the <span className="text-indigo-400 font-semibold">{userProfile.targetRole}</span> role. I'll ask questions and provide feedback on your answers.
                    </p>
                    <button
                      onClick={startInterview}
                      className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all transform hover:scale-105 shadow-xl flex items-center mx-auto"
                    >
                      <Play className="w-5 h-5 mr-2 fill-indigo-900" /> Start Session
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat Interface */
                <>
                  <div className="bg-white/5 p-5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                      <span className="font-bold text-slate-200">AI Interviewer <span className="text-slate-500 font-normal">| {userProfile.targetRole}</span></span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                        className={`transition-colors ${isSpeakingEnabled ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                        title="Toggle Text-to-Speech"
                      >
                        {isSpeakingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={handleEndInterview}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider border border-red-500/30 px-3 py-1 rounded-full hover:bg-red-500/10 transition-all"
                      >
                        End Session
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Only show 'Connecting' if truly loading and no messages yet */}
                    {chatMessages?.length === 0 && isChatLoading && (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                        <p>Initializing interview session...</p>
                      </div>
                    )}

                    {chatMessages?.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-6 shadow-lg backdrop-blur-sm ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-800/80 border border-white/10 text-slate-200 rounded-bl-none'
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
                        <div className="bg-slate-800/80 border border-white/10 rounded-2xl rounded-bl-none p-6 shadow-lg flex items-center space-x-3">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          <span className="text-xs font-medium text-slate-400">Interviewer is typing...</span>
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
                        className="flex-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
                        disabled={isChatLoading}
                      />
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-4 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
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
      {isLoggedIn && currentUserEmail && <FeedbackFloating userEmail={currentUserEmail} />}

      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowProfileModal(false)}>
          <div
            className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Glass Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full -ml-20 -mb-20 pointer-events-none" />

            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white bg-white/5 p-2 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 custom-scrollbar max-h-[85vh] overflow-y-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl relative border border-white/20">
                    {userProfile.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-2xl font-black text-white w-full md:w-auto"
                        placeholder="Your Name"
                      />
                    ) : (
                      <h2 className="text-4xl font-black text-white">{userProfile.name}</h2>
                    )}

                    {userProfile.isPremium && (
                      <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center">
                        <Award className="w-3 h-3 mr-1" /> Premium Pilot
                      </span>
                    )}

                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="ml-2 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
                    >
                      {isEditingProfile ? <Save className="w-5 h-5 text-emerald-400" /> : <Edit2 className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xl text-indigo-400 font-medium mb-4">{userProfile.targetRole}</p>

                  <div className="space-y-4">
                    {/* Row 1: Read-Only Info */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <Mail className="w-4 h-4 mr-2 text-indigo-400" /> {currentUserEmail}
                      </div>
                      <div className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <Target className="w-4 h-4 mr-2 text-emerald-400" /> {userProfile.experienceLevel}
                      </div>
                    </div>

                    {/* Row 2: Editable Socials & Contact */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      {isEditingProfile ? (
                        <>
                          <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Smartphone className="w-4 h-4 mr-2 text-blue-400" />
                            <input
                              className="bg-transparent border-none outline-none text-slate-300 text-sm w-32 placeholder:text-slate-600"
                              placeholder="Mobile Number"
                              value={userProfile.mobileNumber || ''}
                              onChange={(e) => setUserProfile(prev => ({ ...prev, mobileNumber: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <MapPin className="w-4 h-4 mr-2 text-rose-400" />
                            <input
                              className="bg-transparent border-none outline-none text-slate-300 text-sm w-32 placeholder:text-slate-600"
                              placeholder="Location"
                              value={userProfile.location || ''}
                              onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Github className="w-4 h-4 mr-2 text-white" />
                            <input
                              className="bg-transparent border-none outline-none text-slate-300 text-sm w-48 placeholder:text-slate-600"
                              placeholder="github.com/username"
                              value={userProfile.githubProfile || ''}
                              onChange={(e) => setUserProfile(prev => ({ ...prev, githubProfile: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Linkedin className="w-4 h-4 mr-2 text-blue-500" />
                            <input
                              className="bg-transparent border-none outline-none text-slate-300 text-sm w-48 placeholder:text-slate-600"
                              placeholder="linkedin.com/in/user"
                              value={(!userProfile.linkedinProfile || userProfile.linkedinProfile === 'https://www.linkedin.com' || userProfile.linkedinProfile === 'www.linkedin.com' || userProfile.linkedinProfile === 'linkedin.com') ? '' : userProfile.linkedinProfile}
                              onChange={(e) => setUserProfile(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Code className="w-4 h-4 mr-2 text-amber-500" />
                            <input
                              className="bg-transparent border-none outline-none text-slate-300 text-sm w-48 placeholder:text-slate-600"
                              placeholder="leetcode.com/username"
                              value={(!userProfile.leetcodeProfile || userProfile.leetcodeProfile === 'https://leetcode.com' || userProfile.leetcodeProfile === 'leetcode.com') ? '' : userProfile.leetcodeProfile}
                              onChange={(e) => setUserProfile(prev => ({ ...prev, leetcodeProfile: e.target.value }))}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {userProfile.mobileNumber && (
                            <div className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                              <Smartphone className="w-4 h-4 mr-2 text-blue-400" /> {userProfile.mobileNumber}
                            </div>
                          )}
                          {userProfile.location && (
                            <div className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                              <MapPin className="w-4 h-4 mr-2 text-rose-400" /> {userProfile.location}
                            </div>
                          )}
                          {userProfile.githubProfile && (
                            <a href={userProfile.githubProfile.startsWith('http') ? userProfile.githubProfile : `https://${userProfile.githubProfile}`} target="_blank" rel="noreferrer" className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                              <Github className="w-4 h-4 mr-2 text-white" /> GitHub
                            </a>
                          )}
                          {userProfile.linkedinProfile && (
                            <a href={userProfile.linkedinProfile.startsWith('http') ? userProfile.linkedinProfile : `https://${userProfile.linkedinProfile}`} target="_blank" rel="noreferrer" className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                              <Linkedin className="w-4 h-4 mr-2 text-blue-500" /> LinkedIn
                            </a>
                          )}
                          {userProfile.leetcodeProfile && (
                            <a href={userProfile.leetcodeProfile.startsWith('http') ? userProfile.leetcodeProfile : `https://${userProfile.leetcodeProfile}`} target="_blank" rel="noreferrer" className="flex items-center text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                              <Code className="w-4 h-4 mr-2 text-amber-500" /> LeetCode
                            </a>
                          )}
                        </>
                      )}

                      {/* Add Details Prompt if fields missing and not editing */}
                      {!isEditingProfile && (!userProfile.githubProfile || !userProfile.linkedinProfile || !userProfile.mobileNumber) && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center text-indigo-400 text-sm bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Missing Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-4 mb-8 border-b border-white/10 padding-b-4">
                <button
                  onClick={() => setProfileTab('profile')}
                  className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${profileTab === 'profile' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Profile Overview
                  {profileTab === 'profile' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
                </button>
                {/* <button
                  onClick={() => setProfileTab('payments')}
                  className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${profileTab === 'payments' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Payment History
                  {profileTab === 'payments' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
                </button> */}
              </div>

              {profileTab === 'profile' ? (
                /* Profile Tab Content */
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Impact / Validation Section */}
                    <div className="bg-gradient-to-br from-indigo-900/20 via-slate-900/50 to-purple-900/20 p-8 rounded-3xl border border-white/10 md:col-span-2 relative overflow-hidden">
                      {/* Background Glow */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center relative z-10">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" /> CareerPilot Impact Report
                      </h3>

                      {resumeAnalysisResult?.atsScore ? (
                        <div className="relative z-10">
                          <p className="text-slate-400 text-sm mb-6">Measuring your validation progress from initial resume upload.</p>

                          <div className="grid grid-cols-2 gap-8 items-center">
                            {/* Before */}
                            <div className="relative p-6 bg-slate-950/50 rounded-2xl border border-white/5 group transition-all hover:border-red-500/30">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Standing</p>
                              <div className="text-4xl font-black text-slate-300 group-hover:text-red-400 transition-colors">
                                {resumeAnalysisResult.atsScore.before}
                                <span className="text-lg text-slate-600 ml-1">/100</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-2">Baseline Score</p>
                            </div>

                            {/* Arrow */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-full border border-indigo-500/30 shadow-lg shadow-indigo-500/20 z-20">
                              <ArrowRight className="w-5 h-5 text-indigo-400" />
                            </div>

                            {/* After */}
                            <div className="relative p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 group transition-all hover:bg-indigo-500/20 ring-1 ring-transparent hover:ring-indigo-400/50">
                              <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase py-1 px-3 rounded-full shadow-lg">
                                +{resumeAnalysisResult.atsScore.after - resumeAnalysisResult.atsScore.before} Points
                              </div>
                              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Current Potential</p>
                              <div className="text-4xl font-black text-white text-shadow-glow">
                                {resumeAnalysisResult.atsScore.after}
                                <span className="text-lg text-indigo-300/60 ml-1">/100</span>
                              </div>
                              <p className="text-xs text-indigo-300/80 mt-2">Optimized by AI</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 relative z-10">
                          <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                            <TrendingUp className="w-8 h-8 text-slate-500" />
                          </div>
                          <p className="text-slate-300 font-medium mb-2">No Impact Data Yet</p>
                          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                            Run the "Resume Architect" to measure your profile's improvement score.
                          </p>
                          <button
                            onClick={() => {
                              setShowProfileModal(false);
                              setView(AppView.RESUME);
                            }}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all"
                          >
                            Start Optimization
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setView(AppView.ONBOARDING);
                      }}
                      className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm transition-all hover:bg-slate-200 shadow-xl"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        handleLogout();
                      }}
                      className="flex-1 bg-red-500/10 hover:bg-500/20 text-red-500 py-4 rounded-2xl font-black text-sm transition-all border border-red-500/20"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              ) : (
                /* Payments Tab Content */
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 min-h-[400px]">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
                    <Receipt className="w-4 h-4 mr-2 text-indigo-400" /> Transaction History
                  </h3>

                  {userProfile.paymentHistory && userProfile.paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {userProfile.paymentHistory.map((tx) => (
                        <div key={tx.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm bg-transparent">{tx.item}</p>
                              <p className="text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">₹{tx.amount}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
                        <Receipt className="w-8 h-8" />
                      </div>
                      <p className="text-slate-300 font-bold mb-1">No Transactions Found</p>
                      <p className="text-slate-500 text-sm">You haven't made any purchases yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
