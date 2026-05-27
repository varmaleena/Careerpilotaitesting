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
import { AuthModal } from "./components/AuthModal";
import { OnboardingView } from "./components/OnboardingView";
import { DashboardView } from "./components/DashboardView";
import { LearningPlanView } from "./components/LearningPlanView";
import { ProjectsView } from "./components/ProjectsView";
import { ResumeView } from "./components/ResumeView";
import { InterviewView } from "./components/InterviewView";
import { generateLatexDocument } from './utils/latexUtils';

import { AuthService } from './services/authService';
import { canStartNewInterview } from './services/interviewSessionManager';
import { generateLearningPlan, generateProjectIdeas } from './services/learningService';
import { calculatePlanStatistics, getProgressMessage, getCurrentWeek } from './services/planStatistics';
import { downloadLatexPdf, downloadResumeAsPdf } from './services/pdfExportService';
import { extractTextFromPdf } from './services/pdfService';
import { evaluatePremiumInterview, generatePremiumInterviewResponse } from './services/premiumInterviewService';
import { analyzeProfile, generateLatexData, optimizeResume, validateResumeContent } from './services/resumeService';
import { analytics, EVENTS, USER_PROPS } from './services/analytics';
import { updatePageSEO, checkUrlNormalization } from './services/seoService';
import {
  AppView,
  CareerAnalysis,
  ChatMessage,
  InterviewFeedback,
  LatexResumeData,
  LearningTask,
  PastInterview,
  ProjectIdea,
  ResumeOptimizationResult,
  Skill,
  UserProfile,
  WeeklyPlan
} from './types';

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

  // 3. SEO: Update canonical URLs and meta tags on route changes
  useEffect(() => {
    // Update page SEO (canonical, title, meta description, etc.)
    updatePageSEO(location.pathname);

    // Handle URL normalization (strip tracking params, trailing slashes, etc.)
    // This cleans the URL without a full page reload
    const currentUrl = window.location.href;
    const normalizedUrl = checkUrlNormalization(currentUrl);
    if (normalizedUrl) {
      window.history.replaceState(null, '', normalizedUrl);
    }
  }, [location.pathname, location.search]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserUid, setCurrentUserUid] = useState('');

  // Modals & UI State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'payments'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);


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
  const [projectFilter, setProjectFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [generationDifficulty, setGenerationDifficulty] = useState<string>('Intermediate');

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
    const savedUid = localStorage.getItem('careerPilot_session_uid');
    const savedEmail = localStorage.getItem('careerPilot_session_email');
    if (savedUid && savedEmail) {
      // Attempt auto-login using stored UID + email
      loginUser(savedUid, savedEmail).catch(err => {
        console.error("Session restoration failed", err);
        localStorage.removeItem('careerPilot_session_uid');
        localStorage.removeItem('careerPilot_session_email');
      });
    }
  }, []);

  // Save state on critical updates ONLY if logged in
  useEffect(() => {
    if (isLoggedIn && currentUserUid) {
      localStorage.setItem('careerPilot_session_uid', currentUserUid); // Keep session alive
      localStorage.setItem('careerPilot_session_email', currentUserEmail);

      AuthService.saveUserData(currentUserUid, {
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
    currentUserUid,
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

  // Sync difficulty with profile on load
  useEffect(() => {
    if (userProfile.experienceLevel) {
      const level = userProfile.experienceLevel.toLowerCase();
      if (['student', 'fresher', 'beginner'].includes(level)) setGenerationDifficulty('Beginner');
      else if (['junior', 'mid'].includes(level)) setGenerationDifficulty('Intermediate');
      else setGenerationDifficulty('Advanced');
    }
  }, [userProfile.experienceLevel]);

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

  // ... (existing state)

  const loginUser = async (uid: string, email: string) => {
    // Try by UID first (new users), then fall back to email (legacy users stored by email key)
    let userData = await AuthService.getUserData(uid);

    if (!userData && email) {
      console.warn('No data found by UID, trying email key (legacy user):', email);
      userData = await AuthService.getUserData(email);

      // Migrate legacy email-keyed data to UID-keyed data
      if (userData) {
        console.log('Migrating user data from email key to UID key...');
        await AuthService.saveUserData(uid, userData);
      }
    }

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

        // Persist immediately using UID
        await AuthService.saveUserData(uid, userData);
      }

      // Hydrate State
      setCurrentUserUid(uid);
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
      console.error("No user data found for uid:", uid, "or email:", email);
      // New user — send to onboarding instead of showing an error
      setCurrentUserUid(uid);
      setCurrentUserEmail(email);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      setView(AppView.ONBOARDING);
    }
  };


  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserUid('');
    setCurrentUserEmail('');
    localStorage.removeItem('careerPilot_session_uid'); // Clear persistent session
    localStorage.removeItem('careerPilot_session_email');

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
    if (!currentUserUid) return;
    setShowConfirmResetModal(true);
  };

  const confirmResetData = async () => {
    if (!currentUserUid) return;

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
      await AuthService.saveUserData(currentUserUid, emptyData);

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
    if (!plan || !analysis) return;

    let toggledTask: LearningTask | undefined;
    const newPlan = plan.map((week, idx) => {
      if (idx === weekIndex) {
        return {
          ...week,
          tasks: week.tasks.map(t => {
            if (t.id === taskId) {
              toggledTask = { ...t, completed: !t.completed };
              return toggledTask;
            }
            return t;
          })
        };
      }
      return week;
    });

    if (toggledTask) {
      const taskTitle = toggledTask.title.toLowerCase();
      const isNowCompleted = toggledTask.completed;

      // Update skills in analysis
      const newSkills = analysis.skills.map(skill => {
        const skillName = skill.name.toLowerCase();
        // Check if task title contains skill name or vice-versa
        if (taskTitle.includes(skillName) || skillName.includes(taskTitle)) {
          return { ...skill, status: isNowCompleted ? 'acquired' : 'missing' } as Skill;
        }
        return skill;
      });

      // Recalculate readiness score based on acquired skills
      const acquiredCount = newSkills.filter(s => s.status === 'acquired').length;
      const totalCount = newSkills.length;
      const baseScore = totalCount > 0 ? Math.round((acquiredCount / totalCount) * 100) : analysis.readinessScore;

      // Give a little boost for readiness if the score was lower
      const newScore = Math.min(100, Math.max(analysis.readinessScore, baseScore));

      setAnalysis({
        ...analysis,
        skills: newSkills,
        readinessScore: newScore
      });
    }

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


  const handleToggleProjectStatus = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, completed: !p.completed };
      }
      return p;
    }));
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

      // Determine difficulty: strict adherence to filter if set, otherwise dropdown preference
      const effectiveDifficulty = projectFilter !== 'All' ? projectFilter : generationDifficulty;

      // Generate highly tailored projects based on User's Dream Role & Company
      const standardProjects = await generateProjectIdeas(
        userProfile.targetRole,
        focusTopics,
        userProfile.targetCompanies || "Tech Company",
        effectiveDifficulty,
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
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={loginUser}
        />
      </>
    );
  }

  // --- Onboarding View ---
  if (view === AppView.ONBOARDING) {
    return (
      <OnboardingView
        userProfile={userProfile}
        isAnalyzing={isAnalyzing}
        isNavigating={isNavigating}
        isUploadingResume={isUploadingResume}
        validationError={validationError}
        setUserProfile={setUserProfile}
        onLogout={handleLogout}
        onFileUpload={handleFileUpload}
        onSubmit={handleOnboardingSubmit}
      />
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
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-violet-500/20 flex items-center justify-center">
                  <img src="/logo.png" alt="CareerPilot Logo" className="initial w-full h-full object-contain" />
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
              <DashboardView
                analysis={analysis}
                userProfile={userProfile}
                plan={plan}
                isGeneratingPlan={isGeneratingPlan}
                onShowShareModal={() => setShowShareModal(true)}
                onGeneratePlan={handleGeneratePlan}
                onNavigate={setView}
              />
            )}

            {/* Learning Plan View */}
            {view === AppView.PLAN && (
              <LearningPlanView
                userProfile={userProfile}
                plan={plan}
                isGeneratingPlan={isGeneratingPlan}
                addingTaskWeek={addingTaskWeek}
                newTaskTitle={newTaskTitle}
                onGeneratePlan={handleGeneratePlan}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                setAddingTaskWeek={setAddingTaskWeek}
                setNewTaskTitle={setNewTaskTitle}
              />
            )}

            {/* Projects Hub View */}
            {view === AppView.PROJECTS && (
              <ProjectsView
                userProfile={userProfile}
                projects={projects}
                selectedProject={selectedProject}
                isGeneratingProjects={isGeneratingProjects}
                generationDifficulty={generationDifficulty}
                projectFilter={projectFilter}
                onGenerateProjects={handleGenerateProjects}
                onSelectProject={setSelectedProject}
                onToggleProjectStatus={handleToggleProjectStatus}
                setGenerationDifficulty={setGenerationDifficulty}
                setProjectFilter={setProjectFilter}
                setSelectedProject={setSelectedProject}
              />
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
            {view === AppView.RESUME && (
              <ResumeView
                userProfile={userProfile}
                resumeAnalysisResult={resumeAnalysisResult}
                optimizedResume={optimizedResume}
                latexResume={latexResume}
                latexData={latexData}
                isOptimizingResume={isOptimizingResume}
                setUserProfile={setUserProfile}
                onOptimizeResume={handleOptimizeResume}
                onResumeUpload={handleResumeUpload}
              />
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
            {view === AppView.INTERVIEW && (
              <InterviewView
                userProfile={userProfile}
                isGeneratingFeedback={isGeneratingFeedback}
                interviewFeedback={interviewFeedback}
                isInterviewStarted={isInterviewStarted}
                showPastInterviewsDropdown={showPastInterviewsDropdown}
                setShowPastInterviewsDropdown={setShowPastInterviewsDropdown}
                setInterviewFeedback={setInterviewFeedback}
                setChatMessages={setChatMessages}
                startInterview={startInterview}
                interviewElapsedSeconds={interviewElapsedSeconds}
                isSpeakingEnabled={isSpeakingEnabled}
                setIsSpeakingEnabled={setIsSpeakingEnabled}
                handleEndInterview={handleEndInterview}
                chatMessages={chatMessages}
                isChatLoading={isChatLoading}
                messagesEndRef={messagesEndRef}
                handleSendMessage={handleSendMessage}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isSpeechRecognitionSupported={isSpeechRecognitionSupported}
                toggleListening={toggleListening}
                isListening={isListening}
              />
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
