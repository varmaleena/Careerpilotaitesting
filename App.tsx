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
  Flame,
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
  Calendar,
  Activity
} from 'lucide-react';

// ── Critical path: always included in initial bundle ────────────────────────
import LandingPage from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { DashboardView } from "./components/DashboardView";
import { ScoreGauge } from "./components/ScoreGauge";
import Sidebar from "./components/Sidebar";
import MobileBottomNav from "./components/MobileBottomNav";
import { DailyQuest } from "./components/DailyQuest";
import { ConfirmResetModal } from "./components/ConfirmResetModal";
import { EmptyState } from "./components/EmptyState";
import { ShareSuccessModal } from "./components/ShareSuccessModal";
import { ViewLoadingFallback } from "./components/ViewLoadingFallback";

// ── Lazy-loaded: split into separate async chunks ────────────────────────────
// These are large views never needed on initial render (landing / login page)
const FeedbackModal     = React.lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const InterviewAnalysisView = React.lazy(() => import('./components/InterviewAnalysisView').then(m => ({ default: m.InterviewAnalysisView })));
const ProfileModal      = React.lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const OnboardingView    = React.lazy(() => import('./components/OnboardingView').then(m => ({ default: m.OnboardingView })));
const LearningPlanView  = React.lazy(() => import('./components/LearningPlanView').then(m => ({ default: m.LearningPlanView })));
const ProjectsView      = React.lazy(() => import('./components/ProjectsView').then(m => ({ default: m.ProjectsView })));
const ResumeView        = React.lazy(() => import('./components/ResumeView').then(m => ({ default: m.ResumeView })));
const InterviewView     = React.lazy(() => import('./components/InterviewView').then(m => ({ default: m.InterviewView })));
const JobsView          = React.lazy(() => import('./components/JobsView').then(m => ({ default: m.JobsView })));
import { generateLatexDocument } from './utils/latexUtils';

import { AuthService } from './services/authService';
import { clearAICache } from './services/aiCache';
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
  PaymentTransaction,
  ProjectIdea,
  ResumeOptimizationResult,
  Skill,
  UserProfile,
  WeeklyPlan,
  JobApplication,
  PastInterview
} from './types';
import { VerifiedJob } from './services/jobFetchers';

const App = () => {
  // --- Global State ---
  const [view, setView] = useState<AppView>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/onboarding')) return AppView.ONBOARDING;
    if (path.startsWith('/dashboard')) return AppView.DASHBOARD;
    if (path.startsWith('/plan')) return AppView.PLAN;
    if (path.startsWith('/projects')) return AppView.PROJECTS;
    if (path.startsWith('/resumearchitect')) return AppView.RESUME;
    if (path.startsWith('/mockinterview')) return AppView.INTERVIEW;
    if (path.startsWith('/jobs') || path.startsWith('/jobhub')) return AppView.JOBS;
    return AppView.LANDING;
  });

  // --- Routing Sync ---
  const navigate = useNavigate();
  const location = useLocation();

  // 1. URL -> View Sync
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let newView = AppView.LANDING;

    if (path === '/' || path === '') newView = AppView.LANDING;
    else if (path.startsWith('/onboarding')) newView = AppView.ONBOARDING;
    else if (path.startsWith('/dashboard')) newView = AppView.DASHBOARD;
    else if (path.startsWith('/plan')) newView = AppView.PLAN;
    else if (path.startsWith('/projects')) newView = AppView.PROJECTS;
    else if (path.startsWith('/resumearchitect')) newView = AppView.RESUME;
    else if (path.startsWith('/mockinterview')) newView = AppView.INTERVIEW;
    else if (path.startsWith('/jobs') || path.startsWith('/jobhub')) newView = AppView.JOBS;

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
      case AppView.JOBS: targetPath = '/JobHub'; break;
      default: targetPath = '/';
    }

    if (location.pathname.toLowerCase() !== targetPath.toLowerCase()) {
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
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', targetRole: '', isPremium: true });
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [mlMatches, setMlMatches] = useState<any[]>([]);

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
  const [generationDifficulty, setGenerationDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [projectFilter, setProjectFilter] = useState<'all' | 'completed' | 'in-progress'>('all');



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
      loginUser(savedUid, savedEmail).catch(() => {
        localStorage.removeItem('careerPilot_session_uid');
        localStorage.removeItem('careerPilot_session_email');
      });
    }
  }, []);

  // PERF: Keep session tokens alive (no Firestore write needed here)
  useEffect(() => {
    if (isLoggedIn && currentUserUid) {
      localStorage.setItem('careerPilot_session_uid', currentUserUid);
      localStorage.setItem('careerPilot_session_email', currentUserEmail);
    }
  }, [isLoggedIn, currentUserUid, currentUserEmail]);

  // PERF: Granular save — analysis only (fires when analysis changes)
  useEffect(() => {
    if (isLoggedIn && currentUserUid && analysis) {
      AuthService.saveAnalysis(currentUserUid, analysis);
    }
  }, [analysis, isLoggedIn, currentUserUid]);

  // PERF: Granular save — plan only
  useEffect(() => {
    if (isLoggedIn && currentUserUid && plan) {
      AuthService.savePlan(currentUserUid, plan);
    }
  }, [plan, isLoggedIn, currentUserUid]);

  // PERF: Granular save — projects + seen titles
  useEffect(() => {
    if (isLoggedIn && currentUserUid) {
      AuthService.saveProjects(currentUserUid, projects, seenProjectTitles);
    }
  }, [projects, seenProjectTitles, isLoggedIn, currentUserUid]);

  // PERF: Granular save — profile with 1s debounce (avoids write per keystroke)
  useEffect(() => {
    if (!isLoggedIn || !currentUserUid) return;
    const timer = setTimeout(() => {
      AuthService.saveProfile(currentUserUid, userProfile);
    }, 1000);
    return () => clearTimeout(timer);
  }, [userProfile, isLoggedIn, currentUserUid]);

  // PERF: Granular save — interview feedback
  useEffect(() => {
    if (isLoggedIn && currentUserUid && interviewFeedback) {
      AuthService.saveInterviewFeedback(currentUserUid, interviewFeedback);
    }
  }, [interviewFeedback, isLoggedIn, currentUserUid]);

  // PERF: Granular save — resume analysis result
  useEffect(() => {
    if (isLoggedIn && currentUserUid && resumeAnalysisResult) {
      AuthService.saveResumeAnalysis(currentUserUid, resumeAnalysisResult);
    }
  }, [resumeAnalysisResult, isLoggedIn, currentUserUid]);

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
        [USER_PROPS.SKILLS_ACQUIRED]: analysis?.skills?.filter(s => s.status === 'acquired')?.length || 0,
        [USER_PROPS.SKILLS_MISSING]: analysis?.skills?.filter(s => s.status === 'missing')?.length || 0
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

    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      const msg = "🚦 AI System Busy\n\nAll API keys have reached their rate limit. This typically resets within a few minutes.\n\n✅ What to do:\n• Wait 2-3 minutes and try again\n• The system is automatically retrying with backup keys\n\nIf this persists, the daily quota may have been reached. Quotas reset at midnight Pacific Time.";
      alert(msg);
    } else {
      alert(`${defaultMsg}: ${error.message || "Unknown error"}.`);
    }
  };

  // --- Gated View Switching ---
  const handleViewChange = (newView: AppView) => {
    if (newView === AppView.LANDING || newView === AppView.DASHBOARD || newView === AppView.ONBOARDING) {
      setView(newView);
    } else {
      if (isLoggedIn) {
        setView(newView);
      } else {
        setAuthMode('signup');
        setShowAuthModal(true);
      }
    }
  };

  const handleLandingPageUpload = async (file: File, targetRole: string) => {
    setIsAnalyzing(true);
    setValidationError('');
    try {
      // 1. Extract Text
      const text = await extractTextFromPdf(file);

      // 2. Convert to Base64 (Using Promise for unified error handling)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(',')[1];
          resolve(b64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      
      const profileUpdates = {
        resumeText: text,
        resumeFile: {
          data: base64,
          mimeType: file.type
        },
        targetRole: targetRole
      };

      // 3. Validate
      const validation = await validateResumeContent({ text: profileUpdates.resumeText, file: profileUpdates.resumeFile });
      if (!validation.isValid) {
        setValidationError(validation.reason || 'The document does not appear to be a valid resume.');
        setView(AppView.ONBOARDING);
        setIsAnalyzing(false);
        return;
      }

      // 4. Analyze
      const result = await analyzeProfile(
        { text: profileUpdates.resumeText, file: profileUpdates.resumeFile },
        targetRole,
        "",
        "Student/Fresher"
      );

      setAnalysis(result.analysis);
      setUserProfile(prev => ({
        ...prev,
        ...result.extractedProfile,
        resumeText: text,
        resumeFile: {
          data: base64,
          mimeType: file.type
        },
        targetRole: targetRole
      }));

      // Fetch local ML matches
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
        const matchResponse = await fetch(`${backendUrl}/api/jobs/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_text: text })
        });
        if (matchResponse.ok) {
          const matchResult = await matchResponse.json();
          if (matchResult.success) {
            setMlMatches(matchResult.matches);
          }
        }
      } catch (err) {
        console.warn("ML Matcher skipped (backend not reachable):", err);
      }

      setView(AppView.DASHBOARD);
      setIsAnalyzing(false);
    } catch (error: any) {
      handleApiError(error, "Resume analysis failed");
      setIsAnalyzing(false);
    }
  };

  // ... (existing state)

  const loginUser = async (uid: string, email: string) => {
    // PERF: Set auth state and close modal immediately — don't block on data fetch
    setCurrentUserUid(uid);
    setCurrentUserEmail(email);
    setIsLoggedIn(true);
    setShowAuthModal(false);

    // Try by UID first (new users), then fall back to email (legacy users stored by email key)
    let userData = await AuthService.getUserData(uid);

    if (!userData && email) {
      userData = await AuthService.getUserData(email);
      // Migrate legacy email-keyed data to UID-keyed data
      if (userData) {
        AuthService.saveUserData(uid, userData); // fire-and-forget migration
      }
    }

    // Save guest progress to database for new users
    if (!userData && analysis) {
      userData = {
        userProfile: {
          ...userProfile,
          lastLoginDate: new Date().toISOString(),
          streak: 1,
          xp: 10
        },
        analysis,
        plan,
        projects,
        chatMessages,
        interviewFeedback,
        resumeAnalysisResult,
        seenProjectTitles
      };
      await AuthService.saveUserData(uid, userData);
    }

    if (userData) {
      // Calculate Streak
      const today = new Date().toDateString();
      const lastDatestr = userData.userProfile.lastLoginDate;
      const lastLogin = lastDatestr ? new Date(lastDatestr).toDateString() : null;

      let newStreak = userData.userProfile.streak || 1;
      let newXp = userData.userProfile.xp || 0;

      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastLogin === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
        userData.userProfile.lastLoginDate = new Date().toISOString();
        userData.userProfile.streak = newStreak;
        userData.userProfile.xp = newXp + 10;

        // PERF: Save streak update with granular method — fire-and-forget
        AuthService.saveProfile(uid, userData.userProfile);
      }

      // Hydrate local ML matches if resumeText is present
      if (userData.userProfile?.resumeText) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
        fetch(`${backendUrl}/api/jobs/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_text: userData.userProfile.resumeText })
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data?.success) {
            setMlMatches(data.matches);
          }
        })
        .catch(err => console.warn("ML Matcher hydration skipped (backend not reachable):", err));
      }

      // Hydrate State — all in one batch
      setUserProfile({ ...userData.userProfile, isPremium: true });
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

      // Route Logic — navigate instantly
      if (userData.analysis) {
        const lastView = localStorage.getItem('careerPilot_last_view') as AppView;
        const validViews = [AppView.DASHBOARD, AppView.PLAN, AppView.PROJECTS, AppView.RESUME, AppView.INTERVIEW, AppView.JOBS];
        setView(lastView && validViews.includes(lastView) ? lastView : AppView.DASHBOARD);
      } else {
        setView(AppView.ONBOARDING);
      }
    } else {
      // New user — send to onboarding
      setView(AppView.ONBOARDING);
    }
  };


  const handleLogout = () => {
    const uidToEvict = currentUserUid;

    // PERF: Clear session AI cache so stale data isn't served to a new user
    clearAICache();

    // PERF: Evict this user from the in-memory AuthService cache
    if (uidToEvict) AuthService.clearUserCache(uidToEvict);

    setIsLoggedIn(false);
    setCurrentUserUid('');
    setCurrentUserEmail('');
    localStorage.removeItem('careerPilot_session_uid');
    localStorage.removeItem('careerPilot_session_email');
    sessionStorage.removeItem('careerPilot_session_jobs_generated');

    setUserProfile({ name: 'User', targetRole: '', isPremium: true });
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

        alert("Failed to upload file. Please try again.");
        setIsUploadingResume(false);
      }
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userProfile?.resumeText && !userProfile?.resumeFile) || !userProfile?.targetRole) return;

    setIsAnalyzing(true);
    setValidationError('');
    try {
      // Step 1: Validate document is a real resume
      const validation = await validateResumeContent({
        text: userProfile.resumeText,
        file: userProfile.resumeFile
      });

      if (!validation.isValid) {
        setValidationError(validation.reason || 'The uploaded document does not appear to be a valid resume. Please upload a professional CV.');
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Run profile analysis (cached — same resume+role returns instantly on retry)
      const result = await analyzeProfile(
        { text: userProfile.resumeText, file: userProfile.resumeFile },
        userProfile.targetRole,
        userProfile.targetCompanies,
        userProfile.experienceLevel
      );

      // PERF: Update state and navigate to dashboard IMMEDIATELY
      // Plan + projects will generate in the background
      const updatedProfile = { ...userProfile, ...result.extractedProfile };
      setAnalysis(result.analysis);
      setUserProfile(prev => ({ ...prev, ...result.extractedProfile }));
      setView(AppView.DASHBOARD);
      setIsAnalyzing(false);

      // PERF: Fire plan + project generation in PARALLEL, non-blocking
      // UI is already on dashboard — user sees analysis results while these generate
      const missingSkills = result.analysis.skills
        ?.filter(s => s.status === 'missing')
        ?.map(s => s.name) || [];

      Promise.all([
        // Generate learning plan in background
        (async () => {
          try {
            setIsGeneratingPlan(true);
            const generatedPlan = await generateLearningPlan(updatedProfile.targetRole, missingSkills);
            const uniquePlan = generatedPlan.reduce((acc, current) => {
              const isDuplicate = acc.find(w => w.theme.toLowerCase() === current.theme.toLowerCase());
              if (!isDuplicate && current.tasks?.length > 0 && current.theme?.trim().length > 2) {
                acc.push(current);
              }
              return acc;
            }, [] as WeeklyPlan[]);
            if (uniquePlan.length > 0) setPlan(uniquePlan);
          } catch (err) {
            // Plan generation failure is non-blocking — user can retry from dashboard
          } finally {
            setIsGeneratingPlan(false);
          }
        })(),

        // Generate projects in background
        (async () => {
          try {
            setIsGeneratingProjects(true);
            const focusTopics = missingSkills.slice(0, 3);
            const standardProjects = await generateProjectIdeas(
              updatedProfile.targetRole,
              focusTopics,
              updatedProfile.targetCompanies || 'Tech Company',
              generationDifficulty,
              seenProjectTitles
            );
            const newProjects = standardProjects.slice(0, 3);
            setProjects(newProjects);
            setSeenProjectTitles(prev => [...prev, ...newProjects.map(p => p.title)]);
          } catch (err) {
            // Project generation failure is non-blocking
          } finally {
            setIsGeneratingProjects(false);
          }
        })()
      ]);

      return; // Analysis done, background tasks running, function exits
    } catch (error: any) {
      handleApiError(error, "Analysis failed");
      setIsAnalyzing(false);
    }
  };

  const handleOnboardingBypass = () => {
    setValidationError('');
    setAnalysis({
      readinessScore: 75,
      summary: `Candidate profile initialized in local Demo/Bypass Mode against target role: "${userProfile.targetRole || 'Software Engineer'}".`,
      skills: [
        { name: "JavaScript", category: "technical", status: "acquired" },
        { name: "TypeScript", category: "technical", status: "acquired" },
        { name: "React", category: "technical", status: "acquired" },
        { name: "Node.js", category: "technical", status: "acquired" },
        { name: "System Design", category: "technical", status: "missing" },
        { name: "Docker", category: "technical", status: "missing" },
        { name: "Kubernetes", category: "technical", status: "missing" },
        { name: "CI/CD", category: "technical", status: "missing" },
        { name: "AWS", category: "technical", status: "missing" }
      ],
      strengths: ["Strong Frontend Skills", "Good Problem Solving", "Quick Learner"],
      weaknesses: ["Lacks production DevOps experience", "No prior backend role", "Needs system design depth"]
    });
    setUserProfile(prev => ({
      ...prev,
      name: prev.name || "Demo User",
      mobileNumber: prev.mobileNumber || "+1 234 567 890",
      location: prev.location || "New York, USA",
      githubProfile: prev.githubProfile || "https://github.com/demo",
      linkedinProfile: prev.linkedinProfile || "https://linkedin.com/in/demo",
      leetcodeProfile: prev.leetcodeProfile || "https://leetcode.com/demo"
    }));
    setView(AppView.DASHBOARD);
  };

  const handleGeneratePlan = async () => {
    if (!isLoggedIn) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    if (!analysis || !userProfile) return;
    setIsGeneratingPlan(true);
    try {
      // Safe access: analysis.skills might be missing if AI failed partially
      const missingSkills = analysis.skills?.filter(s => s.status === 'missing')?.map(s => s.name) || [];
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

    if (toggledTask && analysis) {
      const taskTitle = toggledTask.title.toLowerCase();
      const isNowCompleted = toggledTask.completed;

      // Update skills in analysis
      const newSkills = (analysis.skills || []).map(skill => {
        const skillName = skill.name.toLowerCase();
        // Check if task title contains skill name or vice-versa
        if (taskTitle.includes(skillName) || skillName.includes(taskTitle)) {
          return { ...skill, status: isNowCompleted ? 'acquired' : 'missing' } as Skill;
        }
        return skill;
      });

      // Recalculate readiness score dynamically based on acquired skills
      const acquiredCount = newSkills.filter(s => s.status === 'acquired').length;
      const totalCount = newSkills.length;
      const newScore = totalCount > 0 ? Math.round((acquiredCount / totalCount) * 100) : analysis.readinessScore;

      setAnalysis({
        ...analysis,
        skills: newSkills,
        readinessScore: Math.min(100, Math.max(0, newScore))
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
      const effectiveDifficulty = projectFilter !== 'all' ? projectFilter : generationDifficulty;

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

  // Job Hub Integration Handlers
  const handleSaveJob = (job: VerifiedJob) => {
    const newApp: JobApplication = {
      id: Math.random().toString(36).substring(2, 9),
      jobId: job.id,
      company: job.company,
      title: job.title,
      location: job.location,
      salary: job.salary,
      applyLink: job.applyLink,
      status: 'Saved',
      dateAdded: Date.now(),
      dateUpdated: Date.now()
    };
    setUserProfile(prev => ({
      ...prev,
      jobApplications: [...(prev.jobApplications || []), newApp]
    }));
  };

  const handleUpdateJobStatus = (appId: string, status: JobApplication['status']) => {
    setUserProfile(prev => ({
      ...prev,
      jobApplications: (prev.jobApplications || []).map(j => 
        j.id === appId ? { ...j, status, dateUpdated: Date.now() } : j
      )
    }));
  };

  const handleDeleteJob = (appId: string) => {
    setUserProfile(prev => ({
      ...prev,
      jobApplications: (prev.jobApplications || []).filter(j => j.id !== appId)
    }));
  };

  const handlePayment = async () => {};
  const handleResumePayment = async () => {};

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
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore InvalidStateError if already stopping
      }
      setIsListening(false);
      recognitionRef.current = null;
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
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onresult = (event: any) => {
        if (recognitionStoppedRef.current) {
          return;
        }
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setChatInput(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }
        setIsListening(false);
        recognitionRef.current = null;

        if (event.error === 'not-allowed') {
          alert("Microphone access blocked. Please enable permissions in your browser settings.");
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        setIsListening(false);
        recognitionRef.current = null;
      }
    } catch (e) {
      setIsListening(false);
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
          onUploadResume={handleLandingPageUpload}
          isAnalyzing={isAnalyzing}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={loginUser}
          hasGuestAnalysis={!!analysis && !isLoggedIn}
        />
      </>
    );
  }

  // --- Onboarding View ---
  if (view === AppView.ONBOARDING) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      }>
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
          onBypass={handleOnboardingBypass}
        />
      </React.Suspense>
    );
  }

  // --- Main App Layout ---
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    }>
    <>
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-zinc-900/10 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 border border-[#e3e1dc] shadow-xl animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-800 mx-auto" />
          </div>
        </div>
      )}

      <div className="min-h-screen flex text-zinc-800 font-sans bg-[#f5f4f2]">
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
          onChangeView={handleViewChange}
          onLogout={handleLogout}
          onSwitchTrack={handleSwitchTrack}
          onResetData={handleResetData}
          onOpenFeedback={() => setShowFeedbackModal(true)}
        />

        <MobileBottomNav
          currentView={view}
          onChangeView={handleViewChange}
          onLogout={handleLogout}
          onSwitchTrack={handleSwitchTrack}
          onResetData={handleResetData}
          onOpenFeedback={() => setShowFeedbackModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />
        <main className="flex-1 md:ml-64 p-4 md:p-6 pb-28 md:pb-6 pt-4 md:pt-6 bg-transparent relative flex flex-col">

          <div className="flex-1 flex flex-col">
            {/* Top Bar - Profile */}
            <header className="flex justify-between md:justify-end items-center px-4 md:px-6 py-3">
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white border border-[#e3e1dc]">
                  <img src="/logo.png" alt="CareerPilot Logo" className="initial w-full h-full object-contain" />
                </div>
                <span className="font-bold text-lg text-zinc-900 tracking-tight">CareerPilot</span>
              </div>
              {isLoggedIn && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-2 px-3 py-1 md:py-1.5 bg-white border border-[#e3e1dc] rounded-full shadow-sm hover:shadow hover:border-zinc-400 transition-all group cursor-default">
                    <div className="bg-amber-500/10 p-1 rounded-full group-hover:bg-amber-500/20 transition-colors">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-xs md:text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                        {userProfile.streak || 1} <span className="text-amber-600">Days</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-10 h-10 rounded-full bg-white border border-[#e3e1dc] flex items-center justify-center text-zinc-800 font-bold text-sm shadow-sm hover:bg-zinc-50 hover:scale-105 transition-all cursor-pointer"
                    title="View Profile"
                  >
                    {userProfile.name?.[0]?.toUpperCase() || 'U'}
                  </button>
                </div>
              )}
            </header>

            {/* Main Content Area in Clean Floating Panel */}
            <div className="flex-1 bg-white border border-[#e3e1dc] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
              <React.Suspense fallback={<ViewLoadingFallback />}>
                {/* Dashboard View */}
                {view === AppView.DASHBOARD && analysis && (
                  <DashboardView
                    analysis={analysis}
                    userProfile={userProfile}
                    plan={plan}
                    isGeneratingPlan={isGeneratingPlan}
                    onShowShareModal={() => setShowShareModal(true)}
                    onGeneratePlan={handleGeneratePlan}
                    onNavigate={handleViewChange}
                    mlMatches={mlMatches}
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

                {/* Jobs View */}
                {view === AppView.JOBS && (
                  <JobsView 
                    userProfile={userProfile}
                    uid={currentUserUid || 'guest'}
                    onSaveJob={handleSaveJob}
                    onUpdateJobStatus={handleUpdateJobStatus}
                    onDeleteJob={handleDeleteJob}
                  />
                )}

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
              </React.Suspense>
            </div>
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
              onChangeView={handleViewChange}
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

        {/* Auth Modal for Gated Dashboard Views */}
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={loginUser}
          hasGuestAnalysis={!!analysis && !isLoggedIn}
        />
      </div >
    </>
    </React.Suspense>
  );
};

export default App;
