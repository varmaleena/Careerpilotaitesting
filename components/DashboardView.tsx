import React from 'react';
import {
    BookOpen,
    Loader2,
    Share2,
    Target,
    TrendingUp
} from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { SkillCard } from './SkillCard';
import { DailyQuest } from './DailyQuest';
import { AppView, CareerAnalysis, UserProfile, WeeklyPlan } from '../types';

interface DashboardViewProps {
    analysis: CareerAnalysis;
    userProfile: UserProfile;
    plan: WeeklyPlan[] | null;
    isGeneratingPlan: boolean;
    onShowShareModal: () => void;
    onGeneratePlan: () => void;
    onNavigate: (view: AppView) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    analysis,
    userProfile,
    plan,
    isGeneratingPlan,
    onShowShareModal,
    onGeneratePlan,
    onNavigate
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <div>
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Target: <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                </div>
                <button
                    onClick={onShowShareModal}
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
                    onNavigate={onNavigate}
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
                                {(analysis.skills || []).filter(s => s.status === 'acquired').map(s => <SkillCard key={s.name} skill={s} />)}
                                {(analysis.skills || []).filter(s => s.status === 'acquired').length === 0 && (
                                    <span className="text-sm text-zinc-500 italic">No exact matches found yet.</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Missing / To Learn</p>
                            <div className="flex flex-wrap gap-2">
                                {(analysis.skills || []).filter(s => s.status === 'missing').map(s => <SkillCard key={s.name} skill={s} />)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                        <button
                            onClick={onGeneratePlan}
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
    );
};
