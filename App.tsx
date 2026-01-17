import { Chat } from '@google/genai';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Briefcase,
  ChevronRight,
  Clock,
  Code,
  DollarSign,
  FileText,
  Globe,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  Newspaper,
  Play,
  PlayCircle,
  Plus,
  Send,
  Target,
  Trash2,
  TrendingUp,
  UploadCloud,
  User,
  Volume2,
  VolumeX,
  X,
  Youtube,
  Search,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Download,
  Copy,
  Check
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import LandingPage from './components/LandingPage';
import { ScoreGauge } from './components/ScoreGauge';
import Sidebar from './components/Sidebar';
import { SkillCard } from './components/SkillCard';
import { AuthService } from './services/authService';
import { createInterviewSession, generateInterviewFeedback } from './services/interviewService';
import { generateLearningPlan, generateProjectIdeas } from './services/learningService';
import { fetchMarketTrends, findMatchingJobs } from './services/marketService';
import { analyzeProfile, optimizeResume, generateLatexData } from './services/resumeService';
import { generateResearchBackedProjects } from './services/researchService';
import { downloadResumeAsPdf, downloadLatexPdf } from './services/pdfExportService';
import { extractTextFromPdf } from './services/pdfService';
import {
  AppView,
  CareerAnalysis,
  ChatMessage,
  InterviewFeedback,
  JobListing,
  MarketTrend,
  ProjectIdea,
  ResumeImprovement,
  ResumeOptimizationResult,
  UserProfile,
  WeeklyPlan,
  LatexResumeData
} from './types';

// LaTeX Character Escaping Function
const escapeLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

// Convert Structured Resume Data to LaTeX Format
const generateLatexDocument = (data: LatexResumeData): string => {
  const { personalInfo, summary, skills, experience, education, projects, certifications } = data;

  // Header
  const header = `
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName)}} \\\\ \\vspace{1pt}
    \\small ${personalInfo.phone ? escapeLatex(personalInfo.phone) + " $|$ " : ""}${personalInfo.email ? `\\href{mailto:${personalInfo.email}}{\\underline{${escapeLatex(personalInfo.email)}}}` + " $|$ " : ""}${escapeLatex(personalInfo.location)}
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
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
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
      return `    \\resumeSubheading
      {${escapeLatex(edu.degree)}}{${escapeLatex(edu.dates)}}
      {${escapeLatex(edu.university)}}{${escapeLatex(edu.location)}}`;
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
      return `\\item
          \\textbf{${escapeLatex(cert.name)}}{: ${escapeLatex(cert.issuer)} -- ${escapeLatex(cert.date)}}`;
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Auth Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

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

  // Jobs
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isScanningJobs, setIsScanningJobs] = useState(false);
  const [scannerStep, setScannerStep] = useState<string>('');

  // Resume Optimizer
  const [optimizedResume, setOptimizedResume] = useState<string>('');
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<ResumeOptimizationResult | null>(null);
  const [isOptimizingResume, setIsOptimizingResume] = useState(false);
  const [resumeFormat, setResumeFormat] = useState<'text' | 'latex'>('text');
  const [latexResume, setLatexResume] = useState<string>('');
  const [latexData, setLatexData] = useState<LatexResumeData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Projects
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false);

  // Trends
  const [trends, setTrends] = useState<MarketTrend | null>(null);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);

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
        jobs,
        projects,
        trends,
        chatMessages,
        interviewFeedback,
        resumeAnalysisResult
      });
    }
  }, [
    isLoggedIn,
    currentUserEmail,
    userProfile,
    analysis,
    plan,
    jobs,
    projects,
    trends,
    chatMessages,
    interviewFeedback,
    resumeAnalysisResult
  ]);

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

  // Initial scan when entering views
  useEffect(() => {
    if (view === AppView.JOBS && jobs?.length === 0) {
      handleScanJobs();
    }
    if (view === AppView.PROJECTS && projects?.length === 0) {
      handleGenerateProjects();
    }
    if (view === AppView.TRENDS && !trends) {
      handleFetchTrends();
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

  const loginUser = async (email: string) => {
    const userData = await AuthService.getUserData(email);
    if (userData) {
      // Hydrate State
      setCurrentUserEmail(email);
      setIsLoggedIn(true);
      setShowAuthModal(false);

      setUserProfile(userData.userProfile);
      setAnalysis(userData.analysis);
      setPlan(userData.plan);
      setJobs(userData.jobs || []);
      setProjects(userData.projects || []);
      setTrends(userData.trends);
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
    setJobs([]);
    setProjects([]);
    setTrends(null);
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
        jobs: [],
        projects: [],
        trends: null,
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
      setJobs([]);
      setProjects([]);
      setTrends(null);
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
      setJobs([]);
      setProjects([]);
      setTrends(null);
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
      setAnalysis(result);
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
      setPlan(generatedPlan);
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
    const newPlan = [...plan];
    newPlan[weekIndex].tasks = newPlan[weekIndex].tasks.filter(t => t.id !== taskId);
    setPlan(newPlan);
  };

  const handleAddTask = (weekIndex: number) => {
    if (!plan || !newTaskTitle.trim()) return;
    const newPlan = [...plan];
    newPlan[weekIndex].tasks.push({
      id: Date.now().toString(),
      title: newTaskTitle,
      description: 'Manually added task',
      type: newTaskType,
      estimatedHours: newTaskHours,
      completed: false
    });
    setPlan(newPlan);
    setAddingTaskWeek(null);
    setNewTaskTitle('');
    setNewTaskHours(1);
  };

  const handleScanJobs = async () => {
    if (!analysis || !userProfile) return;
    setIsScanningJobs(true);
    setScannerStep('Initializing scan...');

    // Simulate loading steps to improve UX
    const steps = ['Searching global job boards...', 'Filtering for your skills...', 'Analyzing salary data...', 'Finalizing matches...'];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setScannerStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const allSkills = analysis.skills?.map(s => s.name) || [];
      const foundJobs = await findMatchingJobs(userProfile.targetRole, allSkills);
      setJobs(foundJobs);
    } catch (error: any) {
      handleApiError(error, "Failed to scan jobs");
    } finally {
      clearInterval(interval);
      setIsScanningJobs(false);
    }
  };

  const handleGenerateProjects = async () => {
    if (!userProfile?.targetRole) return;
    setIsGeneratingProjects(true);
    setProjects([]); // Clear previous

    try {
      // 1. Try to get Research-Backed Projects first (High Value)
      let researchProjects: ProjectIdea[] = [];
      try {
        researchProjects = await generateResearchBackedProjects(userProfile.targetRole);
      } catch (e) {
        console.warn("Research fetch failed, falling back to standard.", e);
      }

      // 2. If we have enough, great. If not (or if failed), fill with standard AI ideas.
      if (researchProjects.length < 3) {
        const standardProjects = await generateProjectIdeas(userProfile.targetRole);
        // Combine: Research ones first, then fill rest
        setProjects([...researchProjects, ...standardProjects].slice(0, 3));
      } else {
        setProjects(researchProjects);
      }

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
      // Prefer AI-extracted name if available, otherwise fallback to profile name
      latexData.personalInfo.fullName = latexData.personalInfo.fullName || userProfile.name;
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

  const handleFetchTrends = async () => {
    if (!userProfile?.targetRole) return;
    setIsFetchingTrends(true);
    try {
      const data = await fetchMarketTrends(userProfile.targetRole);
      setTrends(data);
    } catch (error) {
      handleApiError(error, "Failed to fetch trends");
    } finally {
      setIsFetchingTrends(false);
    }
  };

  const handlePayment = async () => {
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
        // alert(response.razorpay_payment_id);
        // alert(response.razorpay_order_id);
        // alert(response.razorpay_signature)
        setUserProfile(prev => ({ ...prev, isPremium: true }));
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
      // Prepare context: Use raw resume text if available, otherwise use the analysis summary/skills
      let context = userProfile.resumeText || "";

      if (!context && analysis) {
        context = `
           Candidate Summary: ${analysis.summary}
           Identified Skills: ${analysis.skills?.map(s => s.name).join(', ')}
           Strengths: ${analysis.strengths?.join(', ')}
           Weaknesses: ${analysis.weaknesses?.join(', ')}
         `;
      }

      const chat = createInterviewSession(userProfile.targetRole, context);
      setChatInstance(chat);

      // Send a hidden system-like prompt to kickstart the model
      const response = await chat.sendMessage({ message: "Start the interview now. Introduce yourself." });
      const text = response.text || "Hello. I'm the hiring manager for this role. Let's begin.";

      setChatMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: text,
        timestamp: Date.now()
      }]);

      if (isSpeakingEnabled) speakText(text);
    } catch (err: any) {
      setIsInterviewStarted(false);
      setChatInstance(null);
      handleApiError(err, "Failed to start interview");
    } finally {
      setIsChatLoading(false);
    }
  }, [userProfile, isSpeakingEnabled]);

  const handleEndInterview = async () => {
    if (chatMessages.length < 2) {
      setIsInterviewStarted(false);
      setChatMessages([]);
      return;
    }

    window.speechSynthesis.cancel();
    setIsInterviewStarted(false);
    setIsGeneratingFeedback(true);

    try {
      const feedback = await generateInterviewFeedback(chatMessages, userProfile.targetRole);
      setInterviewFeedback(feedback);
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
    if (!chatInput.trim() || !chatInstance) return;

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
      const result = await chatInstance.sendMessage({ message: userMsg.text });
      const text = result.text || "I didn't catch that. Could you please repeat?";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, botMsg]);
      if (isSpeakingEnabled) speakText(text);
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

          <form onSubmit={handleOnboardingSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Target Role</label>
              <input
                type="text"
                required
                className="w-full p-4 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-600"
                placeholder="e.g. Senior Frontend Engineer, Product Manager..."
                value={userProfile.targetRole}
                onChange={e => setUserProfile(prev => ({ ...prev, targetRole: e.target.value }))}
              />
            </div>

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
                      <span className="text-sm font-medium text-emerald-300">Resume Stored</span>
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
                  placeholder="Or paste text directly here..."
                  value={userProfile.resumeText || ''}
                  onChange={e => setUserProfile(prev => ({ ...prev, resumeText: e.target.value }))}
                />
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

      <main className="flex-1 md:ml-64 p-6 md:p-10 overflow-y-auto max-h-screen bg-slate-950 relative">
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
                {view === AppView.PROJECTS && 'Build Portfolio'}
                {view === AppView.TRENDS && 'Market Insights'}
                {view === AppView.INTERVIEW && 'Interview Simulator'}
                {view === AppView.JOBS && 'Market Scanner'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Target Role: <span className="text-indigo-400 font-medium">{userProfile.targetRole}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                {userProfile.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </header>

          {/* Dashboard View */}
          {view === AppView.DASHBOARD && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Score Card */}
                <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 col-span-1 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Match Potential</h3>
                  <ScoreGauge score={analysis.readinessScore} />
                  <p className="text-center text-sm text-slate-300 mt-4 leading-relaxed">
                    {analysis.readinessScore > 75
                      ? "You're a strong candidate! Focus on polishing your advanced skills."
                      : "Great foundation. Completing your plan can boost this significantly."}
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 col-span-2 flex flex-col justify-between shadow-xl">
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
              <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl">
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
                          <h3 className="text-xl font-bold text-white">Week {week.weekNumber}</h3>
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
                                <div className="flex justify-between items-start">
                                  <h4 className="text-lg font-bold text-white mb-2">{task.title}</h4>
                                  <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded text-slate-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    {task.estimatedHours}h
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{task.description}</p>

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

                                <button className="ml-4 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center hover:text-indigo-300">
                                  Mark Done <ChevronRight className="w-3 h-3 ml-1" />
                                </button>
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
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Portfolio Builder</h3>
                <button
                  onClick={handleGenerateProjects}
                  disabled={isGeneratingProjects}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isGeneratingProjects ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                  Generate Ideas
                </button>
              </div>

              {isGeneratingProjects && projects?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-3xl border border-white/10">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-slate-300">Crafting project ideas based on your skills...</p>
                </div>
              )}



              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col hover:border-indigo-500/50 transition-all group relative overflow-hidden">

                    {/* Research Badge */}
                    {project.sourcePaper && (
                      <div className="absolute top-0 right-0 bg-blue-600/90 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl shadow-lg z-10">
                        Research Backed
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${project.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        project.difficulty === 'Intermediate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                        {project.difficulty}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>

                    <h4
                      className="text-lg font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors leading-tight line-clamp-2"
                      title={project.title}
                    >
                      {project.title}
                    </h4>

                    <p className="text-slate-400 text-sm mb-4 flex-1 line-clamp-4">{project.description}</p>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tech Stack</h5>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack?.map(t => (
                            <span key={t} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Implementation Resources */}
                      {project.implementationResources && project.implementationResources.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Build Resources</h5>
                          <div className="space-y-1">
                            {project.implementationResources.map((res, i) => (
                              <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors group/link">
                                <ExternalLink className="w-3 h-3 mr-1.5 opacity-70 group-hover/link:opacity-100" />
                                <span className="truncate">{res.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20">
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-indigo-200 italic">"{project.resumeValue}"</p>
                        </div>
                      </div>

                      {/* Source Paper Verification */}
                      {project.sourcePaper && (
                        <div className="pt-3 border-t border-white/5">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" /> Based on Research
                          </h5>
                          <a href={project.sourcePaper.url} target="_blank" rel="noreferrer" className="block group/link">
                            <p className="text-xs text-blue-300 truncate font-medium group-hover/link:underline">{project.sourcePaper.title}</p>
                            <p className="text-[10px] text-slate-500">{project.sourcePaper.authors.join(', ')} • {project.sourcePaper.publishedDate}</p>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isGeneratingProjects && projects?.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                  <Code className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Build Your Portfolio</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    Stuck on what to build? Get 3 tailored project ideas (Beginner to Advanced) to demonstrate your skills to recruiters.
                  </p>
                  <button onClick={handleGenerateProjects} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold">
                    Generate Projects
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resume View */}
          {view === AppView.RESUME && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Resume Architect</h2>
                    <p className="text-slate-400">Transform your resume into an ATS-beating machine for {userProfile.targetRole}.</p>
                  </div>
                  <button
                    onClick={handleOptimizeResume}
                    disabled={isOptimizingResume}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center disabled:opacity-50"
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
                              if (resumeFormat === 'latex' && latexData) {
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

          {/* Market Trends View (Added Missing View) */}
          {view === AppView.TRENDS && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Market Intelligence</h3>
                <button
                  onClick={handleFetchTrends}
                  disabled={isFetchingTrends}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all"
                >
                  {isFetchingTrends ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Data
                </button>
              </div>

              {isFetchingTrends && !trends && (
                <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-3xl border border-white/10">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-slate-300">Analyzing live market data...</p>
                </div>
              )}

              {trends && (
                <div className="space-y-6">
                  {/* Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                      <div className="flex items-center mb-2 text-emerald-400">
                        <DollarSign className="w-5 h-5 mr-2" />
                        <span className="font-bold text-sm uppercase tracking-wider">Salary Range</span>
                      </div>
                      <div className="text-3xl font-bold text-white">{trends.salaryRange}</div>
                      <div className="text-emerald-500/60 text-sm mt-1">Based on current listings</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                      <div className="flex items-center mb-2 text-amber-400">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        <span className="font-bold text-sm uppercase tracking-wider">Demand Level</span>
                      </div>
                      <div className="text-3xl font-bold text-white">{trends.demandLevel}</div>
                      <div className="text-amber-500/60 text-sm mt-1">Market competitiveness</div>
                    </div>
                  </div>

                  {/* Hot Tech */}
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-indigo-400" />
                      Top Technologies in Demand
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {trends.hotTechnologies.map((tech, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col">
                          <span className="font-bold text-indigo-300 mb-1">{tech.name}</span>
                          <span className="text-xs text-slate-500">{tech.growthReason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Industry News */}
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <Newspaper className="w-5 h-5 mr-2 text-indigo-400" />
                      Industry News & Impact
                    </h3>
                    <div className="space-y-4">
                      {trends.industryNews.map((news, idx) => (
                        <div key={idx} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <h4 className="font-bold text-slate-200 mb-2">{news.headline}</h4>
                          <p className="text-sm text-slate-400 mb-2">{news.summary}</p>
                          <div className="text-xs text-indigo-400 font-medium flex items-start">
                            <span className="mr-1">👉</span> Impact: {news.impact}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interview View - Payment Gate */}
          {view === AppView.INTERVIEW && !userProfile.isPremium && (
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
          )}

          {/* Interview View */}
          {view === AppView.INTERVIEW && userProfile.isPremium && (
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

          {/* Jobs View */}
          {view === AppView.JOBS && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Live Opportunities</h3>
                <button
                  onClick={handleScanJobs}
                  disabled={isScanningJobs}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Refresh Scanner
                </button>
              </div>

              {isScanningJobs && jobs?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-3xl border border-white/10 animate-pulse">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                    <div className="relative bg-slate-900 p-4 rounded-full mb-6 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                      <Search className="w-8 h-8 text-indigo-400 animate-bounce" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Scanning Market</h4>
                  <p className="text-indigo-300 font-medium">{scannerStep}</p>
                  <p className="text-slate-500 text-sm mt-2">This usually takes about 10-15 seconds.</p>
                </div>
              )}

              <div className="grid gap-6">
                {jobs?.map((job, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all group shadow-lg flex flex-col md:flex-row gap-6">

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{job.title}</h4>
                          <p className="text-slate-400 font-medium text-lg">{job.company}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 whitespace-nowrap">
                          <Target className="w-3 h-3 mr-1" />
                          <span>{job.matchScore}% Match</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-5">
                        {job.location && (
                          <div className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-indigo-400" /> {job.location}</div>
                        )}
                        {job.salary && (
                          <div className="flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-emerald-400" /> {job.salary}</div>
                        )}
                        {job.postedAt && (
                          <div className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-slate-500" /> {job.postedAt}</div>
                        )}
                      </div>

                      <p className="text-slate-300 text-sm mb-5 leading-relaxed">{job.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {job.skillsMatched?.slice(0, 5).map(skill => (
                          <span key={skill} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-white/5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end items-end gap-3 min-w-[140px]">
                      <a
                        href={job.applyLink || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
                      >
                        Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                      <button className="w-full text-xs text-slate-500 hover:text-slate-300 py-2">
                        Save for later
                      </button>
                    </div>
                  </div>
                ))}
                {!isScanningJobs && jobs?.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Job Market Scanner</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      Find active job listings that match your skills.
                    </p>
                    <button onClick={handleScanJobs} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold">
                      Scan Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main >
    </div >
  );
};

export default App;