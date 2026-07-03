import {
    Award,
    Briefcase,
    Check,
    Code,
    Edit2,
    Github,
    Linkedin,
    LogIn,
    Mail,
    MapPin,
    Plus,
    Save,
    Smartphone,
    Target,
    TrendingUp,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { AppView, CareerAnalysis, ResumeOptimizationResult, UserProfile } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    currentUserEmail: string;
    analysis: CareerAnalysis | null;
    resumeAnalysisResult: ResumeOptimizationResult | null;
    isEditingProfile: boolean;
    setIsEditingProfile: React.Dispatch<React.SetStateAction<boolean>>;
    setView: (view: AppView) => void;
    handleLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    userProfile,
    setUserProfile,
    currentUserEmail,
    analysis,
    resumeAnalysisResult,
    isEditingProfile,
    setIsEditingProfile,
    setView,
    handleLogout
}) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full shadow-xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Subtle Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 transition-colors z-10 bg-zinc-100 rounded-full p-1 hover:bg-zinc-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 custom-scrollbar max-h-[90vh] overflow-y-auto relative z-0">
                    {/* Header */}
                    <div className="flex items-start gap-6 pb-8 border-b border-zinc-200/80">
                        {/* Avatar - Monochrome & Clean */}
                        <div className="relative flex-shrink-0 group">
                            <div className="w-24 h-24 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-4xl font-bold shadow-md ring-4 ring-zinc-50 group-hover:scale-105 transition-transform duration-300">
                                {userProfile.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {userProfile.isPremium && (
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full p-1.5 shadow-md border-2 border-white">
                                    <Award className="w-4 h-4 text-white fill-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-3 mb-1">
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={userProfile.name}
                                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-2xl font-bold text-zinc-900 focus:border-zinc-900 outline-none w-full transition-all"
                                        placeholder="Your Name"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{userProfile.name}</h2>
                                )}

                                <button
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className="text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-100 p-1.5 rounded-lg hover:bg-zinc-200"
                                >
                                    {isEditingProfile ? <Save className="w-4 h-4 text-emerald-600" /> : <Edit2 className="w-4 h-4" />}
                                </button>
                            </div>

                            <p className="text-base text-zinc-900 font-semibold mb-4 flex items-center">
                                {userProfile.targetRole}
                                <span className="mx-2 text-zinc-300">•</span>
                                <span className="text-zinc-500 text-sm font-normal">Level {Math.floor((userProfile.xp || 0) / 1000) + 1} Explorer</span>
                            </p>

                            {/* Contact Chips */}
                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-xs font-medium text-zinc-600 border border-zinc-200/80 group hover:border-zinc-300 transition-colors">
                                    <Mail className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-700" />
                                    <span className="truncate max-w-[200px]">{currentUserEmail}</span>
                                </div>
                                {userProfile.experienceLevel && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-xs font-medium text-zinc-600 border border-zinc-200/80">
                                        <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                                        <span>{userProfile.experienceLevel}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats - Differentiated */}
                    <div className="grid grid-cols-3 gap-4 my-8">
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 text-center hover:bg-zinc-100/50 transition-all group relative overflow-hidden shadow-sm">
                            <div className="text-3xl font-bold text-zinc-900 mb-1 group-hover:scale-105 transition-transform origin-center inline-block">{userProfile.xp || 0}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-zinc-400" /> XP Points
                            </div>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 text-center hover:bg-zinc-100/50 transition-all group relative overflow-hidden shadow-sm">
                            <div className="text-3xl font-bold text-zinc-900 mb-1 group-hover:scale-105 transition-transform origin-center inline-block">{userProfile.streak || 0}</div>
                            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Target className="w-3 h-3 text-amber-500" /> Day Streak
                            </div>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 text-center hover:bg-zinc-100/50 transition-all group relative overflow-hidden shadow-sm">
                            <div className="text-3xl font-bold text-zinc-900 mb-1 group-hover:scale-105 transition-transform origin-center inline-block">{analysis?.readinessScore || 0}%</div>
                            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Award className="w-3 h-3 text-emerald-500" /> Readiness
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="py-2 border-b border-zinc-200/80 mb-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Contact Information</h3>

                        <div className="grid grid-cols-2 gap-3">
                            {isEditingProfile ? (
                                <>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Mobile</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-400 transition-colors">
                                            <Smartphone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-zinc-900 flex-1 placeholder:text-zinc-400"
                                                placeholder="Enter number"
                                                value={userProfile.mobileNumber || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-400 transition-colors">
                                            <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-zinc-900 flex-1 placeholder:text-zinc-400"
                                                placeholder="Enter location"
                                                value={userProfile.location || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">GitHub</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-400 transition-colors">
                                            <Github className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-zinc-900 flex-1 placeholder:text-zinc-400"
                                                placeholder="github.com/username"
                                                value={userProfile.githubProfile || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, githubProfile: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">LinkedIn</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-400 transition-colors">
                                            <Linkedin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-zinc-900 flex-1 placeholder:text-zinc-400"
                                                placeholder="linkedin.com/in/username"
                                                value={(!userProfile.linkedinProfile || userProfile.linkedinProfile === 'https://www.linkedin.com' || userProfile.linkedinProfile === 'www.linkedin.com' || userProfile.linkedinProfile === 'linkedin.com') ? '' : userProfile.linkedinProfile}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">LeetCode</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-400 transition-colors">
                                            <Code className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-zinc-900 flex-1 placeholder:text-zinc-400"
                                                placeholder="leetcode.com/username"
                                                value={(!userProfile.leetcodeProfile || userProfile.leetcodeProfile === 'https://leetcode.com' || userProfile.leetcodeProfile === 'leetcode.com') ? '' : userProfile.leetcodeProfile}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, leetcodeProfile: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {userProfile.mobileNumber && (
                                        <div className="flex items-center gap-3 text-sm text-zinc-700 p-2 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                                            <div className="p-1.5 bg-zinc-100 rounded-md">
                                                <Smartphone className="w-4 h-4 flex-shrink-0 text-zinc-600" />
                                            </div>
                                            <span className="font-medium">{userProfile.mobileNumber}</span>
                                        </div>
                                    )}
                                    {userProfile.location && (
                                        <div className="flex items-center gap-3 text-sm text-zinc-700 p-2 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                                            <div className="p-1.5 bg-zinc-100 rounded-md">
                                                <MapPin className="w-4 h-4 flex-shrink-0 text-zinc-600" />
                                            </div>
                                            <span className="font-medium">{userProfile.location}</span>
                                        </div>
                                    )}
                                    {userProfile.githubProfile && (
                                        <a href={userProfile.githubProfile.startsWith('http') ? userProfile.githubProfile : `https://${userProfile.githubProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                                            <div className="p-1.5 bg-zinc-100 rounded-md">
                                                <Github className="w-4 h-4 flex-shrink-0 text-zinc-800" />
                                            </div>
                                            <span className="font-medium">GitHub</span>
                                        </a>
                                    )}
                                    {userProfile.linkedinProfile && (
                                        <a href={userProfile.linkedinProfile.startsWith('http') ? userProfile.linkedinProfile : `https://${userProfile.linkedinProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                                            <div className="p-1.5 bg-blue-50 rounded-md">
                                                <Linkedin className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                            </div>
                                            <span className="font-medium">LinkedIn</span>
                                        </a>
                                    )}
                                    {userProfile.leetcodeProfile && (
                                        <a href={userProfile.leetcodeProfile.startsWith('http') ? userProfile.leetcodeProfile : `https://${userProfile.leetcodeProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                                            <div className="p-1.5 bg-amber-50 rounded-md">
                                                <Code className="w-4 h-4 flex-shrink-0 text-amber-600" />
                                            </div>
                                            <span className="font-medium">LeetCode</span>
                                        </a>
                                    )}
                                    {!userProfile.mobileNumber && !userProfile.location && !userProfile.githubProfile && !userProfile.linkedinProfile && !userProfile.leetcodeProfile && (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-8 bg-zinc-50 border border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl text-sm text-zinc-500 hover:text-zinc-750 transition-all hover:bg-zinc-100/50"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                            <span>Add contact details</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    {analysis?.skills && analysis.skills.length > 0 && (
                        <div className="py-6 border-b border-zinc-200/80">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Skills Progress</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {(showAllSkills ? analysis.skills : analysis.skills.slice(0, 8)).map((skill, idx) => (
                                    <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 flex flex-col justify-between h-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-zinc-700 truncate w-full">{skill.name}</span>
                                            {skill.status === 'acquired' && <Check className="w-3 h-3 text-emerald-600 flex-shrink-0 ml-1" />}
                                        </div>
                                        <div className="w-full bg-zinc-200 rounded-full h-1">
                                            <div
                                                className={`h-full rounded-full transition-all ${skill.status === 'acquired' ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                                                style={{ width: skill.status === 'acquired' ? '100%' : '40%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {analysis.skills.length > 8 && (
                                <button
                                    onClick={() => setShowAllSkills(!showAllSkills)}
                                    className="w-full text-xs text-zinc-600 hover:text-zinc-900 mt-4 text-center font-medium transition-colors py-2 hover:bg-zinc-100 rounded-lg border border-transparent hover:border-zinc-200/80"
                                >
                                    {showAllSkills ? 'Show Less' : `+${analysis.skills.length - 8} more skills`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Impact Report */}
                    <div className="py-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resume Impact</h3>

                        {resumeAnalysisResult?.atsScore ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
                                    <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Before</div>
                                    <div className="text-3xl font-bold text-zinc-400">{resumeAnalysisResult.atsScore.before}<span className="text-sm text-zinc-500 font-normal">/100</span></div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-zinc-300 shadow-sm">
                                    <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wider font-bold">Optimized</div>
                                    <div className="text-3xl font-bold text-zinc-900">{resumeAnalysisResult.atsScore.after}<span className="text-sm text-zinc-500 font-normal">/100</span></div>
                                    <div className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        +{resumeAnalysisResult.atsScore.after - resumeAnalysisResult.atsScore.before} points
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-zinc-200">
                                    <TrendingUp className="w-5 h-5 text-zinc-500" />
                                </div>
                                <p className="text-sm text-zinc-500 mb-4 font-medium">No impact data available yet.</p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        setView(AppView.RESUME);
                                    }}
                                    className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Optimize Resume
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-200/80">
                        <button
                            onClick={() => {
                                onClose();
                                setView(AppView.ONBOARDING);
                            }}
                            className="px-4 py-3 bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl font-medium text-sm hover:bg-zinc-100 hover:text-zinc-900 transition-all"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                handleLogout();
                            }}
                            className="px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium text-sm hover:bg-red-100 hover:text-red-700 transition-all flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
