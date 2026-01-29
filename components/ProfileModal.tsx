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
import React from 'react';
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 custom-scrollbar max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-start gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                                {userProfile.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {userProfile.isPremium && (
                                <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1 shadow-md">
                                    <Award className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={userProfile.name}
                                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="Your Name"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{userProfile.name}</h2>
                                )}

                                <button
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {isEditingProfile ? <Save className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4" />}
                                </button>
                            </div>

                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">{userProfile.targetRole}</p>

                            {/* Contact Chips */}
                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px]">{currentUserEmail}</span>
                                </div>
                                {userProfile.experienceLevel && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span>{userProfile.experienceLevel}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 py-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{userProfile.xp || 0}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">XP Points</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{userProfile.streak || 0}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Day Streak</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{analysis?.readinessScore || 0}%</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Readiness</div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="py-6 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>

                        <div className="grid grid-cols-2 gap-3">
                            {isEditingProfile ? (
                                <>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mobile</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white flex-1 placeholder:text-slate-400"
                                                placeholder="Enter number"
                                                value={userProfile.mobileNumber || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Location</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white flex-1 placeholder:text-slate-400"
                                                placeholder="Enter location"
                                                value={userProfile.location || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">GitHub</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <Github className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white flex-1 placeholder:text-slate-400"
                                                placeholder="github.com/username"
                                                value={userProfile.githubProfile || ''}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, githubProfile: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">LinkedIn</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <Linkedin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white flex-1 placeholder:text-slate-400"
                                                placeholder="linkedin.com/in/username"
                                                value={(!userProfile.linkedinProfile || userProfile.linkedinProfile === 'https://www.linkedin.com' || userProfile.linkedinProfile === 'www.linkedin.com' || userProfile.linkedinProfile === 'linkedin.com') ? '' : userProfile.linkedinProfile}
                                                onChange={(e) => setUserProfile(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">LeetCode</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <Code className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white flex-1 placeholder:text-slate-400"
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
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Smartphone className="w-4 h-4 flex-shrink-0" />
                                            <span>{userProfile.mobileNumber}</span>
                                        </div>
                                    )}
                                    {userProfile.location && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span>{userProfile.location}</span>
                                        </div>
                                    )}
                                    {userProfile.githubProfile && (
                                        <a href={userProfile.githubProfile.startsWith('http') ? userProfile.githubProfile : `https://${userProfile.githubProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            <Github className="w-4 h-4 flex-shrink-0" />
                                            <span>GitHub</span>
                                        </a>
                                    )}
                                    {userProfile.linkedinProfile && (
                                        <a href={userProfile.linkedinProfile.startsWith('http') ? userProfile.linkedinProfile : `https://${userProfile.linkedinProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            <Linkedin className="w-4 h-4 flex-shrink-0" />
                                            <span>LinkedIn</span>
                                        </a>
                                    )}
                                    {userProfile.leetcodeProfile && (
                                        <a href={userProfile.leetcodeProfile.startsWith('http') ? userProfile.leetcodeProfile : `https://${userProfile.leetcodeProfile}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            <Code className="w-4 h-4 flex-shrink-0" />
                                            <span>LeetCode</span>
                                        </a>
                                    )}
                                    {!userProfile.mobileNumber && !userProfile.location && !userProfile.githubProfile && !userProfile.linkedinProfile && !userProfile.leetcodeProfile && (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add contact details</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    {analysis?.skills && analysis.skills.length > 0 && (
                        <div className="py-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Skills Progress</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {analysis.skills.slice(0, 8).map((skill, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{skill.name}</span>
                                            {skill.status === 'acquired' && <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 ml-1" />}
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className={`h-full rounded-full transition-all ${skill.status === 'acquired' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                                style={{ width: skill.status === 'acquired' ? '100%' : '40%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {analysis.skills.length > 8 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">+{analysis.skills.length - 8} more skills</p>
                            )}
                        </div>
                    )}

                    {/* Impact Report */}
                    <div className="py-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Resume Impact</h3>

                        {resumeAnalysisResult?.atsScore ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Before</div>
                                    <div className="text-3xl font-semibold text-slate-900 dark:text-white">{resumeAnalysisResult.atsScore.before}<span className="text-sm text-slate-500">/100</span></div>
                                </div>
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">After</div>
                                    <div className="text-3xl font-semibold text-indigo-600 dark:text-indigo-400">{resumeAnalysisResult.atsScore.after}<span className="text-sm text-indigo-500">/100</span></div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+{resumeAnalysisResult.atsScore.after - resumeAnalysisResult.atsScore.before} points</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">No impact data yet</p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        setView(AppView.RESUME);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Optimize Resume
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => {
                                onClose();
                                setView(AppView.ONBOARDING);
                            }}
                            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                handleLogout();
                            }}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
