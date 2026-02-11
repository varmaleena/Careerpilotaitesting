import React, { useState } from 'react';
import {
    Award,
    Bot,
    Check,
    Code,
    Copy,
    Download,
    FileText,
    Github,
    Link,
    Linkedin,
    Loader2,
    RefreshCw,
    Sparkles,
    TrendingUp,
    UploadCloud,
    ArrowRight
} from 'lucide-react';
import { UserProfile, ResumeOptimizationResult } from '../types';
import { downloadLatexPdf, downloadResumeAsPdf } from '../services/pdfExportService';

interface ResumeViewProps {
    userProfile: UserProfile;
    resumeAnalysisResult: ResumeOptimizationResult | null;
    optimizedResume: string | null;
    latexResume: string;
    latexData: any;
    isOptimizingResume: boolean;

    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    onOptimizeResume: () => void;
    onResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
    userProfile,
    resumeAnalysisResult,
    optimizedResume,
    latexResume,
    latexData,
    isOptimizingResume,
    setUserProfile,
    onOptimizeResume,
    onResumeUpload
}) => {
    const [resumeFormat, setResumeFormat] = useState<'text' | 'latex'>('text');
    const [isCopied, setIsCopied] = useState(false);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-white/5 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-xl font-bold text-white">Resume Architect</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Transform your resume for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                </div>
                <button
                    onClick={onOptimizeResume}
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
                                    <input type="file" accept=".pdf" className="hidden" onChange={onResumeUpload} />
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
    );
};
