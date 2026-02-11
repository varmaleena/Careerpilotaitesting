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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Interview Analysis Report</h2>
                            {feedback.decision && (
                                <span className={`px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${feedback.decision === 'Strong Hire' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        feedback.decision === 'Hire' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            feedback.decision === 'Borderline' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                    {feedback.decision}
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">{feedback.feedbackSummary}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Overall Score</p>
                            <div className="text-3xl font-bold text-white font-mono">
                                {Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length)}/100
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Metrics */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                <h3 className="text-sm font-semibold text-white flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-zinc-400" />
                                    Performance Metrics
                                </h3>
                            </div>
                            <div className="p-2">
                                {metrics.map((metric, idx) => (
                                    <div key={idx} className="group p-3 hover:bg-zinc-800/50 rounded-lg transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <metric.icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                                <span className="text-sm font-medium text-zinc-300">{metric.label}</span>
                                            </div>
                                            <span className={`text-sm font-mono font-bold ${getScoreColor(metric.score)}`}>{metric.score}</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getScoreBg(metric.score)}`}
                                                style={{ width: `${metric.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hiring Bar Box - Moved to sidebar for nice fit */}
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Hiring Bar Assessment</h4>
                            <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-indigo-500 pl-3">
                                "{feedback.comparisonToHiringBar || "Performance aligns with expectations."}"
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Detailed Feedback & Roadmap */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Critical Blockers */}
                        {feedback.blockingGaps && feedback.blockingGaps.length > 0 && (
                            <div className="bg-rose-950/10 border border-rose-900/30 rounded-xl p-5 flex items-start gap-4">
                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-rose-400 mb-1">Critical Hiring Blockers</h4>
                                    <p className="text-xs text-rose-300/70 mb-3">These issues are significant concerns for this role level.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {feedback.blockingGaps.map((gap, i) => (
                                            <span key={i} className="px-2 py-1 bg-rose-900/20 border border-rose-900/50 rounded text-rose-300 text-xs font-medium">{gap}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detailed Assessment */}
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                                <h4 className="text-sm font-semibold text-white flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2 text-zinc-400" />
                                    Detailed Assessment
                                </h4>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                                    {feedback.detailedFeedback || (feedback.improvements?.join('\n') || "")}
                                </p>
                            </div>
                        </div>

                        {/* Roadmap - Clean Grid */}
                        {feedback.improvementRoadmap && (
                            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                                    <h3 className="text-sm font-semibold text-white flex items-center">
                                        <Target className="w-4 h-4 mr-2 text-zinc-400" />
                                        Improvement Plan
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                                    {/* Immediate */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/20">1</span>
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Immediate</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.immediate.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 mr-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Short Term */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">2</span>
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">30 Days</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.shortTerm.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 mr-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Long Term */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 text-xs font-bold flex items-center justify-center border border-purple-500/20">3</span>
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">90 Days</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.longTerm.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start">
                                                    <span className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 mr-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-6 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-sm flex items-center"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};
