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
    ArrowRight,
    X,
    AlertCircle
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
    const [showLinksModal, setShowLinksModal] = useState(false);
    const [tempGithub, setTempGithub] = useState(userProfile.githubProfile || '');
    const [tempLinkedin, setTempLinkedin] = useState(userProfile.linkedinProfile || '');

    const handlePolishClick = () => {
        if (!userProfile.githubProfile || !userProfile.linkedinProfile) {
            setTempGithub(userProfile.githubProfile || '');
            setTempLinkedin(userProfile.linkedinProfile || '');
            setShowLinksModal(true);
            return;
        }
        onOptimizeResume();
    };

    const handleSaveAndPolish = () => {
        if (!tempGithub.trim() || !tempLinkedin.trim()) {
            alert("Please provide both GitHub and LinkedIn profile URLs.");
            return;
        }
        setUserProfile(prev => ({
            ...prev,
            githubProfile: tempGithub.trim(),
            linkedinProfile: tempLinkedin.trim()
        }));
        setShowLinksModal(false);
        setTimeout(() => {
            onOptimizeResume();
        }, 100);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Required Social Profiles Popup Modal */}
            {showLinksModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative animate-scale-up">
                        <button
                            onClick={() => setShowLinksModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-zinc-900 mb-1">Social Profiles Required</h3>
                        <p className="text-sm text-zinc-500 mb-5">
                            To polish your resume for <span className="text-zinc-900 font-semibold">{userProfile.targetRole || 'your target role'}</span>, please provide your GitHub and LinkedIn profile links.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div className="relative">
                                <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="url"
                                    placeholder="GitHub Profile URL (e.g. https://github.com/username)"
                                    value={tempGithub}
                                    onChange={(e) => setTempGithub(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-3 py-3 text-zinc-900 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="url"
                                    placeholder="LinkedIn Profile URL (e.g. https://linkedin.com/in/username)"
                                    value={tempLinkedin}
                                    onChange={(e) => setTempLinkedin(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-3 py-3 text-zinc-900 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLinksModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAndPolish}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors shadow-sm"
                            >
                                Save & Polish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-[#e3e1dc] gap-4 sm:gap-0">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Resume Architect</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Transform your resume for <span className="text-zinc-800 font-medium">{userProfile.targetRole}</span></p>
                </div>
                <button
                    onClick={handlePolishClick}
                    disabled={isOptimizingResume}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border-0 cursor-pointer"
                >
                    {isOptimizingResume ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {optimizedResume ? 'Regenerate' : 'Polish Resume'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 pb-24 md:pb-8">

                {/* Profile Links - Compact Row */}
                <div className="bg-white rounded-xl border border-[#e3e1dc] p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="p-1.5 bg-zinc-100 text-zinc-500 rounded mr-3 border border-[#e3e1dc]">
                                <Link className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900">Social Profiles</h3>
                                <p className="text-xs text-zinc-500">Required for accurate personal branding</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative group">
                           <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                            <input
                                type="url"
                                placeholder="GitHub URL"
                                value={userProfile.githubProfile || ''}
                                onChange={(e) => setUserProfile(prev => ({ ...prev, githubProfile: e.target.value }))}
                                className="w-full bg-white border border-[#e3e1dc] rounded-lg pl-10 pr-3 py-2.5 text-zinc-900 text-sm outline-none focus:border-zinc-400 transition-all placeholder-zinc-400 shadow-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                            <input
                                type="url"
                                placeholder="LinkedIn URL"
                                value={userProfile.linkedinProfile || ''}
                                onChange={(e) => setUserProfile(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                                className="w-full bg-white border border-[#e3e1dc] rounded-lg pl-10 pr-3 py-2.5 text-zinc-900 text-sm outline-none focus:border-zinc-400 transition-all placeholder-zinc-400 shadow-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                            <input
                                type="url"
                                placeholder="LeetCode URL"
                                value={userProfile.leetcodeProfile || ''}
                                onChange={(e) => setUserProfile(prev => ({ ...prev, leetcodeProfile: e.target.value }))}
                                className="w-full bg-white border border-[#e3e1dc] rounded-lg pl-10 pr-3 py-2.5 text-zinc-900 text-sm outline-none focus:border-zinc-400 transition-all placeholder-zinc-400 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* ATS Score Impact - Only show after optimization */}
                {resumeAnalysisResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl border border-[#e3e1dc] p-5 flex items-center justify-between shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <div>
                                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">ATS Score</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-zinc-900">{resumeAnalysisResult.atsScore.after}</span>
                                    <span className="text-sm font-semibold text-emerald-600 flex items-center">
                                        <ArrowRight className="w-3 h-3 mr-1" />
                                        +{resumeAnalysisResult.atsScore.after - resumeAnalysisResult.atsScore.before} pts
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center border border-[#e3e1dc]">
                                <TrendingUp className="w-5 h-5 text-zinc-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-[#e3e1dc] p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Keywords Added</p>
                            <div className="flex flex-wrap gap-2">
                                {resumeAnalysisResult.missingKeywordsAdded.slice(0, 5).map(k => (
                                    <span key={k} className="px-2 py-1 rounded-md bg-[#fcfcfa] text-zinc-700 text-xs border border-[#e3e1dc] shadow-sm font-medium">{k}</span>
                                ))}
                                {resumeAnalysisResult.missingKeywordsAdded.length > 5 && (
                                    <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 text-xs border border-[#e3e1dc] shadow-sm font-medium">+{resumeAnalysisResult.missingKeywordsAdded.length - 5}</span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-[#e3e1dc] p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Optimization Stats</p>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">{resumeAnalysisResult.keyImprovements?.length || 0}</p>
                                    <p className="text-xs text-zinc-500">Fixes applied</p>
                                </div>
                                <div className="h-8 w-px bg-[#e3e1dc]"></div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">100%</p>
                                    <p className="text-xs text-zinc-500">Format check</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Side-by-Side Comparison */}
                <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-[500px]">
                    {/* Original */}
                    <div className="bg-white rounded-xl border border-[#e3e1dc] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#e3e1dc] bg-[#fcfcfa]">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Original Source</h3>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-zinc-50/50">
                            {userProfile.resumeText ? (
                                <pre className="text-xs text-zinc-700 font-mono whitespace-pre-wrap leading-relaxed">{userProfile.resumeText}</pre>
                            ) : userProfile.resumeFile ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <FileText className="w-8 h-8 text-zinc-400 mb-3" />
                                    <p className="text-sm text-zinc-800 font-bold">Resume file loaded</p>
                                    <p className="text-xs text-zinc-500 mt-1">Ready to analyze</p>
                                </div>
                            ) : (
                                <label className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100/30 transition-colors border-2 border-dashed border-[#e3e1dc] hover:border-zinc-400 p-8 rounded-lg group bg-[#fbfbfa]">
                                    <input type="file" accept=".pdf" className="hidden" onChange={onResumeUpload} />
                                    <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-zinc-600 transition-colors mb-3" />
                                    <p className="text-sm text-zinc-650 group-hover:text-zinc-900 transition-colors font-bold">Upload PDF Resume</p>
                                    <p className="text-xs text-zinc-500 mt-1">Drag & drop or click</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Optimized */}
                    <div className="bg-white rounded-xl border border-[#e3e1dc] flex flex-col overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                        <div className="px-4 py-3 border-b border-[#e3e1dc] bg-[#fcfcfa] flex justify-between items-center">
                            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center">
                                <Award className="w-3.5 h-3.5 mr-2 text-zinc-500" /> Professional Draft
                            </h3>
                            {optimizedResume && (
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-zinc-100 rounded-lg p-0.5 border border-[#e3e1dc]">
                                        <button
                                            onClick={() => setResumeFormat('text')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border-0 ${resumeFormat === 'text' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 bg-transparent'}`}
                                        >Text</button>
                                        <button
                                            onClick={() => setResumeFormat('latex')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border-0 ${resumeFormat === 'latex' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 bg-transparent'}`}
                                        >LaTeX</button>
                                    </div>
                                    <div className="h-4 w-px bg-[#e3e1dc] mx-1"></div>
                                    <button
                                        onClick={() => {
                                            const contentToCopy = resumeFormat === 'latex' ? latexResume : optimizedResume;
                                            navigator.clipboard.writeText(contentToCopy);
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 2000);
                                        }}
                                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors cursor-pointer border-0 bg-transparent"
                                        title="Copy to Clipboard"
                                    >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-zinc-800" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (latexData) downloadLatexPdf(latexData);
                                            else if (resumeAnalysisResult) downloadResumeAsPdf(resumeAnalysisResult, userProfile.name);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded text-xs font-bold transition-all border-0 shadow-sm cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Export</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-zinc-50/50 text-zinc-800 rounded-b-xl border border-[#e3e1dc]">
                            {optimizedResume ? (
                                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{resumeFormat === 'latex' ? latexResume : optimizedResume}</pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Bot className="w-8 h-8 text-zinc-500 mb-3" />
                                    <p className="text-sm text-zinc-500">Optimization pending</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Improvements List - Clean Document Style */}
                {resumeAnalysisResult && resumeAnalysisResult.keyImprovements && resumeAnalysisResult.keyImprovements.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#e3e1dc] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-[#e3e1dc] flex items-center gap-2 bg-[#fcfcfa]">
                            <Sparkles className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-sm font-bold text-zinc-900">Suggested Improvements</h3>
                        </div>
                        <div className="divide-y divide-[#e3e1dc] bg-transparent">
                            {resumeAnalysisResult.keyImprovements.map((imp, idx) => (
                                <div key={idx} className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 text-xs font-bold text-zinc-650 border border-[#e3e1dc]">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md border bg-zinc-100 text-zinc-600 border-[#e3e1dc]">{imp.category}</span>
                                        <p className="text-sm text-zinc-900 font-bold">{imp.suggestion}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 pl-9">
                                        {/* Original */}
                                        <div className="relative group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-300 rounded-full"></div>
                                            <div className="pl-4">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center">
                                                    Before
                                                </p>
                                                <p className="text-xs text-zinc-550 bg-zinc-50/50 p-3 rounded-lg border border-[#e3e1dc] transition-colors leading-relaxed">
                                                    "{imp.originalSnippet}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Optimized */}
                                        <div className="relative group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 rounded-full"></div>
                                            <div className="pl-4">
                                                <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider mb-1.5 flex items-center">
                                                    Optimized
                                                </p>
                                                <p className="text-xs text-[#18181b] leading-relaxed bg-[#fbfbfa] p-3 rounded-lg border border-[#e3e1dc] transition-colors shadow-sm font-medium">
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
