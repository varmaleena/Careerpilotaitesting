import React from 'react';
import { InterviewFeedback } from '../types';
import {
    Award, TrendingUp, Target, Clock, Zap, Brain,
    CheckCircle, AlertTriangle, BookOpen, User
} from 'lucide-react';

interface InterviewAnalysisViewProps {
    feedback: InterviewFeedback;
    onClose: () => void;
}

export const InterviewAnalysisView: React.FC<InterviewAnalysisViewProps> = ({ feedback, onClose }) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 75) return 'text-indigo-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 75) return 'bg-indigo-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const metrics = [
        { label: 'Communication', score: feedback.communication || 0, icon: User },
        { label: 'Technical Depth', score: feedback.technicalCompetence || 0, icon: Brain },
        { label: 'Problem Solving', score: feedback.problemSolving || 0, icon: Zap },
        { label: 'Confidence', score: feedback.confidenceUnderPressure || 0, icon: Target },
        { label: 'Time Management', score: feedback.timeManagement || 0, icon: Clock },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header & Decision Badge */}
                <div className="text-center relative">
                    <div className="inline-block p-4 rounded-full bg-indigo-500/10 mb-4 ring-4 ring-indigo-500/5">
                        <Award className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Interview Analysis</h2>
                    <p className="text-slate-400 max-w-lg mx-auto mb-6">{feedback.feedbackSummary}</p>

                    {feedback.decision && (
                        <div className={`inline-flex items-center px-6 py-2 rounded-full border ${feedback.decision === 'Strong Hire' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                                feedback.decision === 'Hire' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' :
                                    feedback.decision === 'Borderline' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                                        'bg-rose-500/20 border-rose-500/50 text-rose-400'
                            }`}>
                            <span className="text-lg font-black uppercase tracking-widest">{feedback.decision}</span>
                        </div>
                    )}
                </div>

                {/* 5-Point Performance Analysis */}
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-3 text-indigo-400" />
                        Performance Breakdown
                    </h3>
                    <div className="grid gap-6">
                        {metrics.map((metric, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                            <metric.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                                        </div>
                                        <span className="font-bold text-slate-300">{metric.label}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${getScoreColor(metric.score)}`}>{metric.score}/100</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${getScoreBg(metric.score)} transition-all duration-1000 ease-out`}
                                        style={{ width: `${metric.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed Feedback & Hiring Bar */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5">
                        <h4 className="text-lg font-bold text-slate-200 mb-4 uppercase tracking-widest text-xs">Hiring Bar Comparison</h4>
                        <p className="text-slate-300 italic leading-relaxed border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-500/5">
                            "{feedback.comparisonToHiringBar || "Performance aligns with typical mid-level expectations."}"
                        </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5">
                        <h4 className="text-lg font-bold text-slate-200 mb-4 uppercase tracking-widest text-xs">Detailed Assessment</h4>
                        <p className="text-slate-400 text-sm leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                            {feedback.detailedFeedback || (feedback.improvements?.join('. ') || "")}
                        </p>
                    </div>
                </div>

                {/* Roadmap */}
                {feedback.improvementRoadmap && (
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-3xl p-8 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-8 flex items-center">
                            <Target className="w-5 h-5 mr-3 text-emerald-400" />
                            Improvement Roadmap
                        </h3>

                        <div className="grid md:grid-cols-3 gap-6 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-500/30 via-indigo-500/30 to-purple-500/30 z-0"></div>

                            {/* Immediate */}
                            <div className="relative z-10 flex flex-col">
                                <div className="w-10 h-10 rounded-full bg-emerald-900 border-4 border-slate-950 flex items-center justify-center text-emerald-400 font-bold mb-4 shadow-xl ring-2 ring-emerald-500/30">1</div>
                                <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3">Immediate (This Week)</h4>
                                <ul className="space-y-2">
                                    {feedback.improvementRoadmap.immediate.map((item, i) => (
                                        <li key={i} className="flex items-start text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                            <CheckCircle className="w-3 h-3 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Short Term */}
                            <div className="relative z-10 flex flex-col">
                                <div className="w-10 h-10 rounded-full bg-indigo-900 border-4 border-slate-950 flex items-center justify-center text-indigo-400 font-bold mb-4 shadow-xl ring-2 ring-indigo-500/30">2</div>
                                <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-3">Short Term (30 Days)</h4>
                                <ul className="space-y-2">
                                    {feedback.improvementRoadmap.shortTerm.map((item, i) => (
                                        <li key={i} className="flex items-start text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                            <TrendingUp className="w-3 h-3 text-indigo-500 mr-2 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Long Term */}
                            <div className="relative z-10 flex flex-col">
                                <div className="w-10 h-10 rounded-full bg-purple-900 border-4 border-slate-950 flex items-center justify-center text-purple-400 font-bold mb-4 shadow-xl ring-2 ring-purple-500/30">3</div>
                                <h4 className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-3">Long Term (90 Days)</h4>
                                <ul className="space-y-2">
                                    {feedback.improvementRoadmap.longTerm.map((item, i) => (
                                        <li key={i} className="flex items-start text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                            <Target className="w-3 h-3 text-purple-500 mr-2 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Blocking Gaps Alert */}
                {feedback.blockingGaps && feedback.blockingGaps.length > 0 && (
                    <div className="bg-rose-900/10 border border-rose-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-rose-400 font-bold mb-1">Critical Hiring Blockers</h4>
                            <p className="text-rose-200/80 text-sm mb-3">These issues would likely prevent a hiring decision at this level.</p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {feedback.blockingGaps.map((gap, i) => (
                                    <span key={i} className="px-3 py-1 bg-rose-950 border border-rose-800 rounded-full text-rose-300 text-xs">{gap}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Action */}
                <div className="flex justify-center pt-8 pb-12">
                    <button
                        onClick={onClose}
                        className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                    >
                        <span className="flex items-center">
                            Close Analysis <CheckCircle className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
};
