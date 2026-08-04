import React from 'react';
import {
    Share2,
    TrendingUp,
    Target,
    Award,
    ChevronRight,
    Sparkles,
    Check,
    Layers,
    Flame,
    Briefcase,
    Loader2
} from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { SkillCard } from './SkillCard';
import { AppView, CareerAnalysis, UserProfile, WeeklyPlan } from '../types';

interface DashboardViewProps {
    analysis: CareerAnalysis;
    userProfile: UserProfile;
    plan: WeeklyPlan[] | null;
    isGeneratingPlan: boolean;
    onShowShareModal: () => void;
    onGeneratePlan: () => void;
    onNavigate: (view: AppView) => void;
    mlMatches?: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    analysis,
    userProfile,
    plan,
    isGeneratingPlan,
    onShowShareModal,
    onGeneratePlan,
    onNavigate,
    mlMatches = []
}) => {
    // Calculate skills progress stats
    const totalSkills = analysis.skills?.length || 0;
    const acquiredSkillsCount = analysis.skills?.filter(s => s.status === 'acquired').length || 0;
    const skillsPercent = totalSkills > 0 ? Math.round((acquiredSkillsCount / totalSkills) * 100) : 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-white">
            {/* Minimalist Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-8 py-8 border-b border-[#e3e1dc] gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                        Welcome back, {userProfile.name}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1.5 font-medium">
                        {userProfile.experienceLevel || 'Fresher'} Track • Here's your career readiness overview
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onShowShareModal}
                        className="px-4 py-2.5 bg-white hover:bg-zinc-50 rounded-lg text-zinc-700 font-semibold text-sm transition-all flex items-center border border-[#e3e1dc] shadow-sm cursor-pointer"
                    >
                        <Share2 className="w-4 h-4 mr-2.5 text-zinc-500" />
                        Share Report
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-8">

                {/* Clean KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {/* KPI 1: Target Role */}
                    <div className="p-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Target Role</span>
                        </div>
                        <span className="text-lg font-bold text-zinc-900 block truncate">{userProfile.targetRole}</span>
                        <span className="text-xs text-zinc-400 block mt-1 truncate">
                            Companies: {userProfile.targetCompanies || 'Any'}
                        </span>
                    </div>

                    {/* KPI 2: Skills Mastery */}
                    <div className="p-1 border-l border-zinc-100 pl-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Skills Mastery</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-zinc-900">{acquiredSkillsCount}</span>
                            <span className="text-xs text-zinc-400 font-medium">/ {totalSkills} Acquired</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-3 max-w-[140px]">
                            <div className="bg-gradient-to-r from-zinc-800 to-zinc-500 h-full rounded-full" style={{ width: `${skillsPercent}%` }} />
                        </div>
                    </div>

                    {/* KPI 3: Readiness Score */}
                    <div className="p-1 border-l border-zinc-100 pl-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Readiness</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-zinc-900">{analysis.readinessScore}%</span>
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {analysis.readinessScore >= 80 ? 'Elite' : analysis.readinessScore >= 60 ? 'Competitive' : 'Developing'}
                            </span>
                        </div>
                        <span className="text-xs text-zinc-400 block mt-1">Based on industry match</span>
                    </div>

                    {/* KPI 4: Active Streak */}
                    <div className="p-1 border-l border-zinc-100 pl-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Streak</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-zinc-900">{userProfile.streak || 1} Days</span>
                        </div>
                        <span className="text-xs text-zinc-400 block mt-1">{userProfile.xp || 150} XP Earned</span>
                    </div>
                </div>

                {/* Minimalist Bento Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">

                    {/* Strengths */}
                    <div className="bg-white rounded-2xl border border-[#e3e1dc] p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2.5 text-zinc-400" />
                            Core Capabilities
                        </h3>
                        <div className="space-y-4">
                            {analysis.strengths?.slice(0, 4).map((strength, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-zinc-700 font-medium leading-relaxed">{strength}</p>
                                </div>
                            ))}
                            {(!analysis.strengths || analysis.strengths.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                                    <TrendingUp className="w-6 h-6 text-zinc-300 mb-2" />
                                    <p className="text-xs text-zinc-500 font-medium">No capabilities parsed yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gaps */}
                    <div className="bg-white rounded-2xl border border-[#e3e1dc] p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '300ms' }}>
                        <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center">
                            <Target className="w-4 h-4 mr-2.5 text-zinc-400" />
                            Critical Skill Gaps
                        </h3>
                        <div className="space-y-4">
                            {analysis.weaknesses?.slice(0, 4).map((gap, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                                    <p className="text-sm text-zinc-700 font-medium leading-relaxed">{gap}</p>
                                </div>
                            ))}
                            {(!analysis.weaknesses || analysis.weaknesses.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                                    <Target className="w-6 h-6 text-zinc-300 mb-2" />
                                    <p className="text-xs text-zinc-500 font-medium">No critical gaps detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Role Compatibility */}
                    <div className="bg-white rounded-2xl border border-[#e3e1dc] p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <h3 className="text-sm font-bold text-zinc-900 mb-8 text-center flex items-center justify-center">
                            <Award className="w-4 h-4 mr-2 text-zinc-400" />
                            Role Compatibility
                        </h3>
                        <div className="scale-110 mb-4">
                            <ScoreGauge score={analysis.readinessScore} />
                        </div>
                    </div>

                    {/* Flat Skills Matrix (Full Width) */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e3e1dc] p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '500ms' }}>
                        <h3 className="text-sm font-bold text-zinc-900 mb-2">Capabilities Matrix</h3>
                        <p className="text-sm text-zinc-500 mb-8">Keywords matched against standard industry roles</p>

                        <div className="space-y-8">
                            <div>
                                <p className="text-xs font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                    Acquired Skills
                                    <span className="text-zinc-400 font-normal">({analysis.skills?.filter(s => s.status === 'acquired').length || 0})</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(analysis.skills || []).filter(s => s.status === 'acquired').map(s => <SkillCard key={s.name} skill={s} />)}
                                    {(analysis.skills || []).filter(s => s.status === 'acquired').length === 0 && (
                                        <span className="text-sm text-zinc-400 italic">No skills detected.</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-zinc-100">
                                <p className="text-xs font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                    Skills to Develop
                                    <span className="text-zinc-400 font-normal">({analysis.skills?.filter(s => s.status === 'missing').length || 0})</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(analysis.skills || []).filter(s => s.status === 'missing').map(s => <SkillCard key={s.name} skill={s} />)}
                                    {(analysis.skills || []).filter(s => s.status === 'missing').length === 0 && (
                                        <span className="text-sm text-zinc-400 italic">No target gaps.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Local NLP Matching Analytics Section */}
                    {mlMatches && mlMatches.length > 0 && (
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e3e1dc] p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '600ms' }}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 flex items-center">
                                        <Briefcase className="w-4 h-4 mr-2.5 text-zinc-400" />
                                        Local NLP Career Matching Engine
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Term Frequency-Inverse Document Frequency (TF-IDF) & Cosine Similarity computed on FastAPI server
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-md uppercase tracking-wider">
                                    scikit-learn Pipeline
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {mlMatches.slice(0, 4).map((match, idx) => (
                                    <div key={idx} className="p-5 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-all bg-zinc-50/30">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-zinc-800">{match.title}</h4>
                                            <span className="text-xs font-bold text-zinc-900 bg-white border border-[#e3e1dc] px-2.5 py-1 rounded-full shadow-sm">
                                                {match.match_score}% Match
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{match.description}</p>
                                        
                                        {/* Score Bar */}
                                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-4">
                                            <div 
                                                className="bg-zinc-800 h-full rounded-full transition-all duration-1000" 
                                                style={{ width: `${match.match_score}%` }} 
                                            />
                                        </div>

                                        {/* Skill Tags */}
                                        <div className="space-y-3">
                                            {match.matched_skills?.length > 0 && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">Matched Keywords</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {match.matched_skills.map((skill: string) => (
                                                            <span key={skill} className="text-[11px] font-medium text-emerald-800 bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-100/50">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {match.missing_skills?.length > 0 && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1.5">Target Skill Gaps</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {match.missing_skills.map((skill: string) => (
                                                            <span key={skill} className="text-[11px] font-medium text-amber-800 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-100/50">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
