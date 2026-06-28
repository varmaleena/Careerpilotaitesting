import React from 'react';
import {
    AlertCircle,
    ArrowRight,
    Briefcase,
    Check,
    ChevronRight,
    Loader2,
    TrendingUp,
    UploadCloud,
    User
} from 'lucide-react';
import { UserProfile } from '../types';
import { HAS_GEMINI_KEYS } from '../services/geminiClient';

interface OnboardingViewProps {
    // State
    userProfile: UserProfile;
    isAnalyzing: boolean;
    isNavigating: boolean;
    isUploadingResume: boolean;
    validationError: string;

    // Handlers
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    onLogout: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onBypass?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
    userProfile,
    isAnalyzing,
    isNavigating,
    isUploadingResume,
    validationError,
    setUserProfile,
    onLogout,
    onFileUpload,
    onSubmit,
    onBypass
}) => {
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

            <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
                <div className="bg-[#0c0c0e] max-w-3xl w-full rounded-3xl shadow-2xl shadow-black/80 p-10 border border-white/5 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Back to Login */}
                    <button
                        onClick={onLogout}
                        className="absolute top-8 right-8 text-zinc-600 hover:text-white flex items-center text-xs font-medium transition-colors"
                    >
                        <User className="w-3.5 h-3.5 mr-2" />
                        {userProfile.name}
                        <span className="ml-1 text-zinc-700">|</span>
                        <span className="ml-1 hover:underline">Log out</span>
                    </button>

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-6 rotate-3">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Configure Your Pilot</h1>
                        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                            We'll analyze your profile to build a custom career roadmap, interview prep, and project portfolio.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-8">

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Column: Profile */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-violet-500 mr-2"></span>
                                    Profile Details
                                </h3>

                                <div className="space-y-5">
                                    {/* Experience Level */}
                                    <div className="group">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 transition-colors group-focus-within:text-violet-400">Experience Level</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full pl-3 pr-10 py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:border-violet-500 focus:bg-zinc-900 transition-all outline-none appearance-none text-sm"
                                                value={userProfile.experienceLevel || ''}
                                                onChange={e => setUserProfile(prev => ({ ...prev, experienceLevel: e.target.value }))}
                                            >
                                                <option value="">Select Level...</option>
                                                <option value="student">Student (Currently Enrolled)</option>
                                                <option value="fresher">Fresher (0-1 Years)</option>
                                                <option value="junior">Junior (1-3 Years)</option>
                                                <option value="mid">Mid-Level (3-5 Years)</option>
                                                <option value="senior">Senior (5+ Years)</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Graduation Year */}
                                    <div className="group">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 transition-colors group-focus-within:text-violet-400">Graduation Year</label>
                                        <input
                                            type="number"
                                            required
                                            min="2020"
                                            max="2030"
                                            className="w-full p-3 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl focus:ring-1 focus:ring-violet-500 focus:border-violet-500 focus:bg-zinc-900 transition-all outline-none placeholder-zinc-700 text-sm"
                                            placeholder="YYYY"
                                            value={userProfile.graduationYear || ''}
                                            onChange={e => setUserProfile(prev => ({ ...prev, graduationYear: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Target */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                    Career Goal
                                </h3>

                                <div className="space-y-5">
                                    {/* Target Role */}
                                    <div className="group">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 transition-colors group-focus-within:text-emerald-400">
                                            Target Role <span className="text-red-500/80">*</span>
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-10 pr-3 py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-zinc-900 transition-all outline-none placeholder-zinc-700 text-sm"
                                                placeholder="e.g. Frontend Engineer"
                                                value={userProfile.targetRole}
                                                onChange={e => setUserProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Target Companies */}
                                    <div className="group">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 transition-colors group-focus-within:text-emerald-400">Target Companies</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 w-4 h-4 text-zinc-600 font-serif italic text-xs flex items-center justify-center group-focus-within:text-emerald-500">@</div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-3 py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-zinc-900 transition-all outline-none placeholder-zinc-700 text-sm"
                                                placeholder="e.g. Google, Microsoft..."
                                                value={userProfile.targetCompanies || ''}
                                                onChange={e => setUserProfile(prev => ({ ...prev, targetCompanies: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resume Section */}
                        <div className="pt-6 border-t border-white/5">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center mb-6">
                                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                Resume Data <span className="text-zinc-600 ml-1 font-normal lowercase">(Required)</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[220px]">
                                {/* File Upload - Enhanced Visuals */}
                                <div className={`relative border border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${userProfile.resumeFile
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-800/50'
                                    }`}>
                                    <input
                                        type="file"
                                        accept=".pdf,.txt,.md"
                                        onChange={onFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="resume-upload"
                                    />

                                    {isUploadingResume ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Loader2 className="w-10 h-10 text-violet-400 mb-4 animate-spin" />
                                            <span className="text-sm font-semibold text-white">Extracting Data...</span>
                                            <span className="text-xs text-zinc-500 mt-2">This may take a few seconds</span>
                                        </div>
                                    ) : userProfile.resumeFile ? (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-emerald-500/5">
                                                <Check className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <span className="text-sm font-bold text-white">Resume Attached</span>
                                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full mt-2 font-mono">
                                                {userProfile.resumeFile.name || "resume.pdf"}
                                            </span>
                                            <p className="text-[10px] text-zinc-500 mt-4 group-hover:text-emerald-400 transition-colors">Click to replace</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center p-6">
                                            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-all duration-300">
                                                <UploadCloud className="w-7 h-7 text-zinc-400 group-hover:text-violet-400" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Upload Resume</span>
                                            <p className="text-xs text-zinc-500 mt-2 max-w-[180px]">
                                                PDF or TXT accepted. We extract skills & experience automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Text Paste Option */}
                                <div className="relative h-full flex flex-col">
                                    <div className={`flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all ${userProfile.resumeText ? 'border-zinc-700' : ''
                                        }`}>
                                        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center h-10">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Resume Content</span>
                                            <span className="text-[10px] text-zinc-600 font-mono">{userProfile.resumeText?.length || 0} chars</span>
                                        </div>
                                        <textarea
                                            className="w-full h-[calc(100%-40px)] p-4 bg-transparent text-zinc-300 text-xs font-mono resize-none outline-none placeholder-zinc-700 leading-relaxed"
                                            placeholder="Paste your full resume text here (Work history, skills, projects)..."
                                            value={userProfile.resumeText || ''}
                                            onChange={e => setUserProfile(prev => ({ ...prev, resumeText: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validation & Actions */}
                        <div className="flex border-t border-white/5 pt-8 gap-4 flex-col sm:flex-row items-center">
                            {/* Error Box */}
                            {validationError && (
                                <div className="flex-grow w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className="text-xs text-red-300 font-medium">{validationError}</p>
                                    </div>
                                    {onBypass && (
                                        <button
                                            type="button"
                                            onClick={onBypass}
                                            className="text-xs bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors w-fit border border-white/10"
                                        >
                                            Bypass & Enter Demo Mode
                                        </button>
                                    )}
                                </div>
                            )}

                            {!HAS_GEMINI_KEYS && !validationError && (
                                <div className="flex-1 w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    <p className="text-xs text-amber-300 font-medium">
                                        Demo Mode Active: No Gemini key in <code>.env</code>. Mock data will be used.
                                    </p>
                                </div>
                            )}

                            {/* Primary Action */}
                            <button
                                type="submit"
                                disabled={isAnalyzing || (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole}
                                className="w-full sm:flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-xl shadow-white/5 hover:shadow-white/10 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole ? (
                                    <span className="text-zinc-500">Complete Steps to Launch</span>
                                ) : (
                                    <>
                                        <span>Launch Pilot</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
};
