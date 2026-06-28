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
    onSubmit
}) => {
    // Premium Full-Screen Loading State during Analysis
    if (isAnalyzing) {
        return (
            <div className="min-h-screen bg-[#f5f4f2] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Decorative Background Ambient Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] animate-[pulse_3s_ease-in-out_infinite_reverse]" />

                {/* Main Glassmorphism Loader Card */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full bg-white/60 backdrop-blur-2xl border border-white/60 p-12 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] animate-slide-up">
                    
                    {/* Rotating Scanner Orbital */}
                    <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                        {/* Outer rotating dashed ring */}
                        <div className="absolute inset-0 rounded-full border border-dashed border-zinc-300 animate-[spin_8s_linear_infinite]" />
                        {/* Inner rotating ring */}
                        <div className="absolute inset-2 rounded-full border border-zinc-200/50 animate-[spin_4s_linear_infinite_reverse]" />
                        
                        {/* Core Logo Container */}
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-900/20 flex items-center justify-center relative z-10 animate-[pulse_2s_ease-in-out_infinite]">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center justify-center gap-3">
                            Analyzing Profile
                            <span className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                            Deep-scanning your resume via AI to extract skills and build your custom roadmap.
                        </p>
                    </div>

                    {/* Premium Progress Indicator */}
                    <div className="w-full max-w-xs mx-auto mt-10">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                            <span>Processing Data</span>
                            <span className="text-zinc-900 animate-pulse">Running</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200/50 rounded-full overflow-hidden w-full relative">
                            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-zinc-800 to-zinc-500 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-[85%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Navigation Loading Overlay */}
            {isNavigating && (
                <div className="fixed inset-0 bg-zinc-900/10 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 border border-[#e3e1dc] shadow-xl animate-in fade-in duration-200">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-800 mx-auto" />
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#f5f4f2] flex items-center justify-center p-4">
                <div className="bg-white max-w-3xl w-full rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-10 border border-[#e3e1dc] relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0efeb]/40 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e3e1dc]/30 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Back to Login */}
                    <button
                        onClick={onLogout}
                        className="absolute top-8 right-8 text-zinc-500 hover:text-zinc-800 flex items-center text-xs font-semibold transition-colors border-0 bg-transparent cursor-pointer"
                    >
                        <User className="w-3.5 h-3.5 mr-2" />
                        {userProfile.name}
                        <span className="ml-1 text-zinc-350">|</span>
                        <span className="ml-1 hover:underline">Log out</span>
                    </button>

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-900/10 mx-auto mb-6 rotate-3">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">Configure Your Pilot</h1>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                            We'll analyze your profile to build a custom career roadmap, interview prep, and project portfolio.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-8">

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Column: Profile */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-zinc-900 mr-2"></span>
                                    Profile Details
                                </h3>

                                <div className="space-y-5">
                                    {/* Experience Level */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 transition-colors group-focus-within:text-zinc-800">Experience Level</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full pl-3 pr-10 py-3 bg-white border border-[#e3e1dc] text-zinc-900 rounded-xl focus:border-zinc-400 transition-all outline-none appearance-none text-sm cursor-pointer shadow-sm"
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
                                            <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Graduation Year */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 transition-colors group-focus-within:text-zinc-800">Graduation Year</label>
                                        <input
                                            type="number"
                                            required
                                            min="2020"
                                            max="2030"
                                            className="w-full p-3 bg-white border border-[#e3e1dc] text-zinc-900 rounded-xl focus:border-zinc-400 transition-all outline-none placeholder-zinc-400 text-sm shadow-sm"
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
                                    <span className="w-2 h-2 rounded-full bg-zinc-900 mr-2"></span>
                                    Career Goal
                                </h3>

                                <div className="space-y-5">
                                    {/* Target Role */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 transition-colors group-focus-within:text-zinc-800">
                                            Target Role <span className="text-red-500/80">*</span>
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-700 transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-10 pr-3 py-3 bg-white border border-[#e3e1dc] text-zinc-900 rounded-xl focus:border-zinc-400 transition-all outline-none placeholder-zinc-400 text-sm shadow-sm"
                                                placeholder="e.g. Frontend Engineer"
                                                value={userProfile.targetRole}
                                                onChange={e => setUserProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Target Companies */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 transition-colors group-focus-within:text-zinc-800">Target Companies</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400 font-serif italic text-xs flex items-center justify-center group-focus-within:text-zinc-700">@</div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-3 py-3 bg-white border border-[#e3e1dc] text-zinc-900 rounded-xl focus:border-zinc-400 transition-all outline-none placeholder-zinc-400 text-sm shadow-sm"
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
                        <div className="pt-6 border-t border-[#e3e1dc]">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center mb-6">
                                <span className="w-2 h-2 rounded-full bg-zinc-900 mr-2"></span>
                                Resume Data <span className="text-zinc-400 ml-1 font-normal lowercase">(Required)</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[220px]">
                                {/* File Upload */}
                                <div className={`relative border border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${userProfile.resumeFile
                                    ? 'border-zinc-900 bg-zinc-50/50'
                                    : 'border-[#e3e1dc] hover:border-zinc-400 hover:bg-[#fcfcfa]'
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
                                            <Loader2 className="w-10 h-10 text-zinc-800 mb-4 animate-spin" />
                                            <span className="text-sm font-bold text-zinc-900">Extracting Data...</span>
                                            <span className="text-xs text-zinc-500 mt-2">This may take a few seconds</span>
                                        </div>
                                    ) : userProfile.resumeFile ? (
                                        <div className="flex flex-col items-center p-4 animate-in fade-in zoom-in duration-300">
                                            <div className="w-12 h-12 bg-zinc-100 border border-[#e3e1dc] rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <Check className="w-6 h-6 text-zinc-900" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-900">Resume Attached</span>
                                            <span className="text-xs text-zinc-700 bg-white border border-[#e3e1dc] px-2 py-1 rounded-md mt-2 font-mono shadow-sm truncate max-w-[200px]">
                                                {userProfile.resumeFile.name || "resume.pdf"}
                                            </span>
                                            <p className="text-[10px] text-zinc-500 mt-4 group-hover:text-zinc-900 transition-colors">Click to replace</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center p-6">
                                            <div className="w-14 h-14 bg-zinc-50 border border-[#e3e1dc] rounded-full flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-[#fcfcfa] transition-all duration-300 shadow-sm">
                                                <UploadCloud className="w-7 h-7 text-zinc-400 group-hover:text-zinc-700" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-750 group-hover:text-zinc-900 transition-colors">Upload Resume</span>
                                            <p className="text-xs text-zinc-500 mt-2 max-w-[180px] leading-relaxed">
                                                PDF or TXT accepted. We extract skills & experience automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Text Paste Option */}
                                <div className="relative h-full flex flex-col">
                                    <div className={`flex-1 bg-[#fbfbfa] border border-[#e3e1dc] rounded-2xl overflow-hidden focus-within:border-zinc-400 transition-all shadow-sm`}>
                                        <div className="bg-white px-4 py-2 border-b border-[#e3e1dc] flex justify-between items-center h-10">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Resume Content</span>
                                            <span className="text-[10px] text-zinc-400 font-mono">{userProfile.resumeText?.length || 0} chars</span>
                                        </div>
                                        <textarea
                                            className="w-full h-[calc(100%-40px)] p-4 bg-transparent text-zinc-800 text-xs font-mono resize-none outline-none placeholder-zinc-400 leading-relaxed"
                                            placeholder="Paste your full resume text here (Work history, skills, projects)..."
                                            value={userProfile.resumeText || ''}
                                            onChange={e => setUserProfile(prev => ({ ...prev, resumeText: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validation & Actions */}
                        <div className="flex border-t border-[#e3e1dc] pt-8 gap-4 flex-col sm:flex-row items-center">
                            {/* Error Box */}
                            {validationError && (
                                <div className="flex-grow w-full bg-zinc-50/50 border border-[#e3e1dc] rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                                        <p className="text-xs text-zinc-700 font-medium">{validationError}</p>
                                    </div>
                                    {onBypass && (
                                        <button
                                            type="button"
                                            onClick={onBypass}
                                            className="text-xs bg-white hover:bg-zinc-50 text-zinc-800 font-bold py-1.5 px-3 rounded-lg transition-colors w-fit border border-[#e3e1dc] cursor-pointer shadow-sm"
                                        >
                                            Bypass & Enter Demo Mode
                                        </button>
                                    )}
                                </div>
                            )}

                            {!HAS_GEMINI_KEYS && !validationError && (
                                <div className="flex-1 w-full bg-[#fcfcfa] border border-[#e3e1dc] rounded-xl p-3 flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                    <p className="text-xs text-zinc-650 font-medium">
                                        Demo Mode Active: No Gemini key in <code>.env</code>. Mock data will be used.
                                    </p>
                                </div>
                            )}

                            {/* Primary Action */}
                            <button
                                type="submit"
                                disabled={isAnalyzing || (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole}
                                className="w-full sm:flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        <span>Processing...</span>
                                    </>
                                ) : (!userProfile.resumeFile && !userProfile.resumeText) || !userProfile.targetRole ? (
                                    <span className="text-zinc-400">Complete Steps to Launch</span>
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
