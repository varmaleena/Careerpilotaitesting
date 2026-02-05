import React from 'react';
import {
    ArrowRight,
    Award,
    CheckCircle,
    Circle,
    Code,
    Copy,
    ExternalLink,
    FileText,
    Github,
    Layers,
    List,
    Loader2,
    RefreshCw,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { ProjectIdea, UserProfile } from '../types';

interface ProjectsViewProps {
    userProfile: UserProfile;
    projects: ProjectIdea[];
    selectedProject: ProjectIdea | null;
    isGeneratingProjects: boolean;
    generationDifficulty: string;
    projectFilter: 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

    onGenerateProjects: () => void;
    onSelectProject: (project: ProjectIdea | null) => void;
    onToggleProjectStatus: (projectId: string) => void;
    setGenerationDifficulty: (difficulty: string) => void;
    setProjectFilter: (filter: 'All' | 'Beginner' | 'Intermediate' | 'Advanced') => void;
    setSelectedProject: React.Dispatch<React.SetStateAction<ProjectIdea | null>>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
    userProfile,
    projects,
    selectedProject,
    isGeneratingProjects,
    generationDifficulty,
    projectFilter,
    onGenerateProjects,
    onSelectProject,
    onToggleProjectStatus,
    setGenerationDifficulty,
    setProjectFilter,
    setSelectedProject
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-white/5 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-xl font-bold text-white">Portfolio Builder</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">AI-generated projects for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Difficulty Selector */}
                    <select
                        value={generationDifficulty}
                        onChange={(e) => setGenerationDifficulty(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg p-2.5 outline-none focus:border-violet-500"
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>

                    <button
                        onClick={onGenerateProjects}
                        disabled={isGeneratingProjects}
                        className="bg-white hover:bg-zinc-200 text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                    >
                        {isGeneratingProjects ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                        ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" /> Generate Ideas</>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                {/* Loading State - Full page centered */}
                {isGeneratingProjects && projects?.length === 0 && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-zinc-500">
                        {/* CSS Animation */}
                        <style>{`
              @keyframes iconPulse {
                0%, 100% { opacity: 0.3; transform: scale(1); color: #52525b; }
                50% { opacity: 1; transform: scale(1.15); color: #ffffff; }
              }
              .portfolio-loader-icon {
                width: 48px;
                height: 48px;
                color: #52525b;
                animation: iconPulse 1.5s ease-in-out infinite;
              }
              @keyframes dotBounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(-6px); opacity: 1; }
              }
            `}</style>

                        {/* Career Icons Animation */}
                        <div className="flex items-center gap-6 mb-8">
                            <svg className="portfolio-loader-icon" style={{ animationDelay: '0s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <line x1="10" y1="9" x2="8" y2="9"></line>
                            </svg>
                            <svg className="portfolio-loader-icon" style={{ animationDelay: '0.15s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                            <svg className="portfolio-loader-icon" style={{ animationDelay: '0.3s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                            <svg className="portfolio-loader-icon" style={{ animationDelay: '0.45s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                            </svg>
                            <svg className="portfolio-loader-icon" style={{ animationDelay: '0.6s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                            </svg>
                        </div>

                        {/* Projects Filter - only show when projects exist */}
                        {!isGeneratingProjects && projects.length > 0 && (
                            <div className="flex items-center gap-2 mb-6 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-fit">
                                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setProjectFilter(filter as any)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectFilter === filter
                                            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading Text */}
                        <p className="text-zinc-400 text-sm tracking-wide">
                            Crafting Your Perfect Projects
                            <span className="inline-flex gap-1 ml-1">
                                <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0s' }}></span>
                                <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.15s' }}></span>
                                <span className="w-1 h-1 bg-indigo-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.3s' }}></span>
                            </span>
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!isGeneratingProjects && (!projects || projects.length === 0) && (
                    <EmptyState
                        icon={Code}
                        title="No Projects Yet"
                        description="Generate your first portfolio project tailored to your target role. We'll give you the tech stack, features, and difficulty level."
                        actionLabel="Generate New Ideas"
                        onAction={onGenerateProjects}
                        color="indigo"
                    />
                )}

                {/* Projects Grid */}
                {projects?.length > 0 && (
                    <>
                        {/* Projects Filter */}
                        {!isGeneratingProjects && (
                            <div className="flex items-center gap-2 mb-6 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-fit">
                                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setProjectFilter(filter as any)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectFilter === filter
                                            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects
                                .filter(p => projectFilter === 'All' || p.difficulty === projectFilter)
                                .map((project, idx) => (
                                    <div
                                        key={idx}
                                        className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-violet-500/50 transition-all flex flex-col h-full"
                                    >
                                        <div className="p-6 flex flex-col h-full">
                                            {/* Header Row */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium border ${project.difficulty === 'Beginner' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                                                    project.difficulty === 'Intermediate' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                                                        'bg-purple-500/5 text-purple-400 border-purple-500/20'
                                                    }`}>
                                                    {project.difficulty}
                                                </div>
                                                <div className="p-2 bg-zinc-800 rounded-lg">
                                                    <Layers className="w-4 h-4 text-zinc-400" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
                                                {project.title}
                                            </h4>

                                            {/* Description */}
                                            <p className="text-sm text-zinc-400 mb-6 line-clamp-3 leading-relaxed">
                                                {project.description}
                                            </p>

                                            {/* Tech Stack */}
                                            <div className="mt-auto mb-6">
                                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Tech Stack</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.techStack?.slice(0, 4).map(t => (
                                                        <span key={t} className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                                            {t}
                                                        </span>
                                                    ))}
                                                    {project.techStack?.length > 4 && (
                                                        <span className="text-[11px] text-zinc-500 px-1 py-1">
                                                            +{project.techStack.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-px bg-zinc-800 w-full mb-4"></div>

                                            {/* Resume Value */}
                                            <div className="flex items-start gap-2 mb-6">
                                                <TrendingUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-zinc-400 line-clamp-2">{project.resumeValue}</p>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => onSelectProject(project)}
                                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center transition-colors border border-zinc-700 hover:border-zinc-600"
                                            >
                                                View Specs
                                                <ArrowRight className="w-4 h-4 ml-2 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleProjectStatus(project.id);
                                                }}
                                                className={`mt-2 w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center transition-all border ${project.completed
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                                                    }`}
                                            >
                                                {project.completed ? (
                                                    <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                                ) : (
                                                    <><Circle className="w-4 h-4 mr-2" /> Mark as Done</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                )}

                {/* Empty State (alternative) */}
                {!isGeneratingProjects && projects?.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Code className="w-7 h-7 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Build Your Portfolio</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                            Get 3 project ideas (Beginner to Advanced) designed to impress recruiters.
                        </p>
                        <button
                            onClick={onGenerateProjects}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center mx-auto transition-all"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Generate Projects
                        </button>
                    </div>
                )}
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
                <div
                    className="fixed inset-0 md:left-64 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => onSelectProject(null)}
                >
                    <div
                        className="bg-zinc-900 rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 z-10">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${selectedProject.difficulty === 'Beginner'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : selectedProject.difficulty === 'Intermediate'
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {selectedProject.difficulty}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">{selectedProject.title}</h2>
                                    <p className="text-sm text-zinc-400 line-clamp-1">{selectedProject.techStack?.join(' • ')}</p>
                                </div>
                                <button
                                    onClick={() => onSelectProject(null)}
                                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0 border border-zinc-700"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <p className="text-sm text-zinc-300 leading-relaxed">{selectedProject.description}</p>
                            </div>

                            {/* User Stories Section */}
                            {selectedProject.userStories && selectedProject.userStories.length > 0 && (
                                <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-violet-400" />
                                        User Stories
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedProject.userStories.map((story, idx) => (
                                            <li key={idx} className="text-sm text-zinc-300 flex items-start">
                                                <span className="text-violet-400 mr-2">•</span>
                                                {story}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Key Features Section */}
                            {selectedProject.keyFeatures && selectedProject.keyFeatures.length > 0 && (
                                <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                                        Key Features
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedProject.keyFeatures.map((feature, idx) => (
                                            <li key={idx} className="text-sm text-zinc-300 flex items-start">
                                                <span className="text-emerald-400 mr-2">•</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Implementation Steps Section */}
                            {selectedProject.implementationFlow && selectedProject.implementationFlow.length > 0 && (
                                <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                                        <List className="w-4 h-4 mr-2 text-violet-400" />
                                        Implementation Steps
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedProject.implementationFlow.map((step, idx) => (
                                            <div key={idx} className="flex items-start text-sm text-zinc-300">
                                                <span className="text-violet-400 font-bold mr-2 shrink-0">{idx + 1}.</span>
                                                <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* You'll Learn Section */}
                            {selectedProject.learningOutcomes && selectedProject.learningOutcomes.length > 0 && (
                                <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                                        <Award className="w-4 h-4 mr-2 text-zinc-400" />
                                        Skills You'll Master
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.learningOutcomes.map((outcome, idx) => (
                                            <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700">
                                                {outcome}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resume Value */}
                            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-zinc-800 rounded-lg shrink-0">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Why Build This?</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{selectedProject.resumeValue}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reference GitHub */}
                            {selectedProject.referenceGithubUrl && (
                                <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                                        <Github className="w-4 h-4 mr-2 text-white" />
                                        Reference Repository
                                    </h3>
                                    <p className="text-xs text-zinc-500 mb-3">
                                        Explore a similar project implementation or starter code to guide your development.
                                    </p>
                                    <a
                                        href={selectedProject.referenceGithubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-white/5 transition-all group"
                                    >
                                        <span className="text-sm text-blue-400 group-hover:underline truncate max-w-[300px]">
                                            {selectedProject.referenceGithubUrl}
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
                                    </a>
                                </div>
                            )}

                            {/* Implementation Resources */}
                            {selectedProject.implementationResources && selectedProject.implementationResources.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                                        <ExternalLink className="w-4 h-4 mr-2 text-blue-400" />
                                        Resources
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedProject.implementationResources.map((resource, idx) => (
                                            <a
                                                key={idx}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-white/5 transition-all group"
                                            >
                                                <span className="text-sm text-zinc-300 group-hover:text-white">{resource.name}</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Source Paper */}
                            {selectedProject.sourcePaper && (
                                <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/10">
                                    <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Research Paper
                                    </h3>
                                    <p className="text-sm text-white font-medium mb-1">{selectedProject.sourcePaper.title}</p>
                                    <p className="text-xs text-zinc-400 mb-2">{selectedProject.sourcePaper.authors.join(', ')}</p>
                                    <a
                                        href={selectedProject.sourcePaper.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-medium"
                                    >
                                        Read Paper <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${selectedProject.title}\n\n${selectedProject.description}\n\nTech Stack: ${selectedProject.techStack?.join(', ')}`);
                                        alert('Project details copied to clipboard!');
                                    }}
                                    className="flex-1 bg-zinc-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </button>
                                <button
                                    onClick={() => onSelectProject(null)}
                                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                                >
                                    Close
                                </button>

                                <button
                                    onClick={() => {
                                        onToggleProjectStatus(selectedProject.id);
                                        // Update the selected project local state to reflect change immediately in modal
                                        setSelectedProject(prev => prev ? ({ ...prev, completed: !prev.completed }) : null);
                                    }}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${selectedProject.completed
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                        }`}
                                >
                                    {selectedProject.completed ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                    ) : (
                                        <><Circle className="w-4 h-4 mr-2" /> Mark as Done</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
