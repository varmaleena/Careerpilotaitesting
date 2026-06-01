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
        if (score >= 90) return 'text-zinc-900';
        if (score >= 75) return 'text-zinc-700';
        if (score >= 60) return 'text-zinc-600';
        return 'text-zinc-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-zinc-900';
        if (score >= 75) return 'bg-zinc-700';
        if (score >= 60) return 'bg-zinc-500';
        return 'bg-zinc-400';
    };

    const metrics = [
        { label: 'Communication', score: feedback.communication || 0, icon: User },
        { label: 'Technical Depth', score: feedback.technicalCompetence || 0, icon: Brain },
        { label: 'Problem Solving', score: feedback.problemSolving || 0, icon: Zap },
        { label: 'Confidence', score: feedback.confidenceUnderPressure || 0, icon: Target },
        { label: 'Time Management', score: feedback.timeManagement || 0, icon: Clock },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-transparent">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#e3e1dc] pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Interview Analysis Report</h2>
                            {feedback.decision && (
                                <span className={`px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${
                                    feedback.decision === 'Strong Hire' ? 'bg-zinc-900 text-white border-zinc-900' :
                                    feedback.decision === 'Hire' ? 'bg-zinc-100 text-zinc-800 border-[#e3e1dc]' :
                                    feedback.decision === 'Borderline' ? 'bg-[#fcfcfa] text-zinc-600 border-[#e3e1dc]' :
                                    'bg-zinc-50 text-zinc-500 border-[#e3e1dc]'
                                }`}>
                                    {feedback.decision}
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">{feedback.feedbackSummary}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Overall Score</p>
                            <div className="text-3xl font-bold text-zinc-900 font-mono">
                                {Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length)}/100
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Metrics */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-[#e3e1dc] overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <div className="px-5 py-4 border-b border-[#e3e1dc] flex items-center justify-between bg-[#fcfcfa]">
                                <h3 className="text-sm font-semibold text-zinc-900 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-zinc-500" />
                                    Performance Metrics
                                </h3>
                            </div>
                            <div className="p-2">
                                {metrics.map((metric, idx) => (
                                    <div key={idx} className="group p-3 hover:bg-[#fcfcfa] rounded-lg transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <metric.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                                                <span className="text-sm font-medium text-zinc-650">{metric.label}</span>
                                            </div>
                                            <span className={`text-sm font-mono font-bold ${getScoreColor(metric.score)}`}>{metric.score}</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-[#e3e1dc]/50">
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
                        <div className="bg-white rounded-xl border border-[#e3e1dc] p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Hiring Bar Assessment</h4>
                            <p className="text-sm text-zinc-700 leading-relaxed border-l-2 border-zinc-300 pl-3">
                                "{feedback.comparisonToHiringBar || "Performance aligns with expectations."}"
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Detailed Feedback & Roadmap */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Critical Blockers */}
                        {feedback.blockingGaps && feedback.blockingGaps.length > 0 && (
                            <div className="bg-white border border-[#e3e1dc] rounded-xl p-5 flex items-start gap-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                                <AlertTriangle className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 mb-1">Critical Hiring Blockers</h4>
                                    <p className="text-xs text-zinc-500 mb-3">These issues are significant concerns for this role level.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {feedback.blockingGaps.map((gap, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-[#fcfcfa] border border-[#e3e1dc] rounded text-zinc-700 text-xs font-medium">{gap}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detailed Assessment */}
                        <div className="bg-white rounded-xl border border-[#e3e1dc] overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <div className="px-6 py-4 border-b border-[#e3e1dc] bg-[#fcfcfa]">
                                <h4 className="text-sm font-semibold text-zinc-900 flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2 text-zinc-500" />
                                    Detailed Assessment
                                </h4>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                                    {feedback.detailedFeedback || (feedback.improvements?.join('\n') || "")}
                                </p>
                            </div>
                        </div>

                        {/* Roadmap - Clean Grid */}
                        {feedback.improvementRoadmap && (
                            <div className="bg-white rounded-xl border border-[#e3e1dc] overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                                <div className="px-6 py-4 border-b border-[#e3e1dc] bg-[#fcfcfa]">
                                    <h3 className="text-sm font-semibold text-zinc-900 flex items-center">
                                        <Target className="w-4 h-4 mr-2 text-zinc-500" />
                                        Improvement Plan
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e3e1dc]">
                                    {/* Immediate */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-zinc-900 text-white text-xs font-bold flex items-center justify-center border border-zinc-900">1</span>
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Immediate</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.immediate.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-650 leading-relaxed flex items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 mt-1.5 mr-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Short Term */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-zinc-200 text-zinc-850 text-xs font-bold flex items-center justify-center border border-zinc-300">2</span>
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">30 Days</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.shortTerm.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-650 leading-relaxed flex items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-550 mt-1.5 mr-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Long Term */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-6 rounded bg-zinc-100 text-zinc-650 text-xs font-bold flex items-center justify-center border border-[#e3e1dc]">3</span>
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">90 Days</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.improvementRoadmap.longTerm.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-650 leading-relaxed flex items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 mr-2 shrink-0"></span>
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
                <div className="flex justify-end pt-6 border-t border-[#e3e1dc]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors text-sm flex items-center shadow-sm border-0 cursor-pointer"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};
