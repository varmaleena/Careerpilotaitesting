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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-zinc-200/80 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Portfolio Builder</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">AI-generated projects for <span className="text-zinc-700 font-medium">{userProfile.targetRole}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Difficulty Selector */}
                    <select
                        value={generationDifficulty}
                        onChange={(e) => setGenerationDifficulty(e.target.value)}
                        className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg p-2.5 outline-none focus:border-zinc-450"
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>

                    <button
                        onClick={onGenerateProjects}
                        disabled={isGeneratingProjects}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border-0 cursor-pointer"
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 pb-24 md:pb-8">

                {/* Loading State - Full page centered */}
                {isGeneratingProjects && projects?.length === 0 && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-zinc-550">
                        {/* CSS Animation */}
                        <style>{`
              @keyframes iconPulse {
                0%, 100% { opacity: 0.3; transform: scale(1); color: #71717a; }
                50% { opacity: 1; transform: scale(1.15); color: #18181b; }
              }
              .portfolio-loader-icon {
                width: 48px;
                height: 48px;
                color: #71717a;
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

                        {/* Loading Text */}
                        <p className="text-zinc-600 text-sm tracking-wide font-medium">
                            Crafting Your Perfect Projects
                            <span className="inline-flex gap-1 ml-1">
                                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0s' }}></span>
                                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.15s' }}></span>
                                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: '0.3s' }}></span>
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
                            <div className="flex items-center gap-2 mb-6 bg-zinc-100 p-1 rounded-lg border border-zinc-200 w-fit">
                                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setProjectFilter(filter as any)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-0 cursor-pointer ${projectFilter === filter
                                            ? 'bg-white text-zinc-900 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-900 bg-transparent'
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
                                        className="group bg-zinc-50 rounded-xl border border-zinc-200/60 hover:border-zinc-350 transition-all flex flex-col h-full shadow-sm"
                                    >
                                        <div className="p-6 flex flex-col h-full">
                                            {/* Header Row */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold border ${project.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    project.difficulty === 'Intermediate' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-zinc-800 text-zinc-100 border-zinc-950'
                                                    }`}>
                                                    {project.difficulty}
                                                </div>
                                                <div className="p-2 bg-zinc-200/60 text-zinc-650 rounded-lg">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-base font-bold text-zinc-900 mb-2 line-clamp-2">
                                                {project.title}
                                            </h4>

                                            {/* Description */}
                                            <p className="text-xs text-zinc-500 mb-6 line-clamp-3 leading-relaxed">
                                                {project.description}
                                            </p>

                                            {/* Tech Stack */}
                                            <div className="mt-auto mb-6">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Tech Stack</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.techStack?.slice(0, 4).map(t => (
                                                        <span key={t} className="text-[11px] bg-white text-zinc-650 px-2 py-1 rounded border border-zinc-200 shadow-sm">
                                                            {t}
                                                        </span>
                                                    ))}
                                                    {project.techStack?.length > 4 && (
                                                        <span className="text-[11px] text-zinc-400 px-1 py-1 font-medium">
                                                            +{project.techStack.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-px bg-zinc-200 w-full mb-4"></div>

                                            {/* Resume Value */}
                                            <div className="flex items-start gap-2 mb-6">
                                                <TrendingUp className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-zinc-500 line-clamp-2">{project.resumeValue}</p>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => onSelectProject(project)}
                                                className="w-full bg-white hover:bg-zinc-50 text-zinc-800 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all border border-zinc-200 hover:border-zinc-350 shadow-sm cursor-pointer"
                                            >
                                                View Specs
                                                <ArrowRight className="w-3.5 h-3.5 ml-2 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleProjectStatus(project.id);
                                                }}
                                                className={`mt-2 w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all border cursor-pointer ${project.completed
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-850 hover:bg-zinc-50'
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
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
                <div
                    className="fixed inset-0 md:left-64 bg-zinc-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => onSelectProject(null)}
                >
                    <div
                        className="bg-white rounded-2xl border border-zinc-200/80 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200 px-6 py-4 z-10">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${selectedProject.difficulty === 'Beginner'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : selectedProject.difficulty === 'Intermediate'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-zinc-800 text-zinc-100 border-zinc-900'
                                            }`}>
                                            {selectedProject.difficulty}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-900 mb-1">{selectedProject.title}</h2>
                                    <p className="text-xs text-zinc-500 font-medium">{selectedProject.techStack?.join(' • ')}</p>
                                </div>
                                <button
                                    onClick={() => onSelectProject(null)}
                                    className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors shrink-0 border border-zinc-200/85 cursor-pointer"
                                >
                                    <X className="w-4 h-4 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <p className="text-sm text-zinc-600 leading-relaxed">{selectedProject.description}</p>
                            </div>

                            {/* User Stories Section */}
                            {selectedProject.userStories && selectedProject.userStories.length > 0 && (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/60">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-zinc-500" />
                                        User Stories
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedProject.userStories.map((story, idx) => (
                                            <li key={idx} className="text-xs text-zinc-600 flex items-start leading-relaxed">
                                                <span className="text-zinc-400 mr-2 font-bold">•</span>
                                                {story}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Key Features Section */}
                            {selectedProject.keyFeatures && selectedProject.keyFeatures.length > 0 && (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/60">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                                        Key Features
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedProject.keyFeatures.map((feature, idx) => (
                                            <li key={idx} className="text-xs text-zinc-600 flex items-start leading-relaxed">
                                                <span className="text-emerald-500 mr-2 font-bold">•</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Implementation Steps Section */}
                            {selectedProject.implementationFlow && selectedProject.implementationFlow.length > 0 && (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/60">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
                                        <List className="w-4 h-4 mr-2 text-zinc-500" />
                                        Implementation Steps
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedProject.implementationFlow.map((step, idx) => (
                                            <div key={idx} className="flex items-start text-xs text-zinc-600 leading-relaxed">
                                                <span className="text-zinc-400 font-bold mr-2 shrink-0">{idx + 1}.</span>
                                                <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* You'll Learn Section */}
                            {selectedProject.learningOutcomes && selectedProject.learningOutcomes.length > 0 && (
                                <div className="bg-zinc-50/50 rounded-xl p-5 border border-zinc-200/80">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center">
                                        <Award className="w-4 h-4 mr-2 text-zinc-400" />
                                        Skills You'll Master
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.learningOutcomes.map((outcome, idx) => (
                                            <span key={idx} className="text-xs bg-white text-zinc-650 px-3 py-1.5 rounded border border-zinc-200 shadow-sm font-medium">
                                                {outcome}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resume Value */}
                            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-zinc-200/60 text-zinc-650 rounded-lg shrink-0">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-900 mb-1">Why Build This?</h3>
                                        <p className="text-xs text-zinc-550 leading-relaxed">{selectedProject.resumeValue}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reference GitHub */}
                            {selectedProject.referenceGithubUrl && (
                                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
                                        <Github className="w-4 h-4 mr-2 text-zinc-900" />
                                        Reference Repository
                                    </h3>
                                    <p className="text-xs text-zinc-500 mb-3">
                                        Explore a similar project implementation or starter code to guide your development.
                                    </p>
                                    <a
                                        href={selectedProject.referenceGithubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/50 rounded-lg border border-zinc-200 transition-all group"
                                    >
                                        <span className="text-xs text-blue-600 group-hover:underline truncate max-w-[300px] font-semibold">
                                            {selectedProject.referenceGithubUrl}
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-800" />
                                    </a>
                                </div>
                            )}

                            {/* Implementation Resources */}
                            {selectedProject.implementationResources && selectedProject.implementationResources.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
                                        <ExternalLink className="w-4 h-4 mr-2 text-zinc-550" />
                                        Resources
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedProject.implementationResources.map((resource, idx) => (
                                            <a
                                                key={idx}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/50 rounded-lg border border-zinc-200 transition-all group shadow-sm"
                                            >
                                                <span className="text-xs text-zinc-650 group-hover:text-zinc-900 font-semibold">{resource.name}</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-800" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Source Paper */}
                            {selectedProject.sourcePaper && (
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                    <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Research Paper
                                    </h3>
                                    <p className="text-xs text-zinc-950 font-bold mb-1 leading-normal">{selectedProject.sourcePaper.title}</p>
                                    <p className="text-[10px] text-zinc-500 mb-2">{selectedProject.sourcePaper.authors.join(', ')}</p>
                                    <a
                                        href={selectedProject.sourcePaper.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-amber-700 hover:text-amber-800 font-semibold"
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
                                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center border border-zinc-200 transition-all cursor-pointer shadow-sm"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Specs
                                </button>
                                <button
                                    onClick={() => onSelectProject(null)}
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all shadow-sm border-0 cursor-pointer"
                                >
                                    Close
                                </button>

                                <button
                                    onClick={() => {
                                        onToggleProjectStatus(selectedProject.id);
                                        // Update the selected project local state to reflect change immediately in modal
                                        setSelectedProject(prev => prev ? ({ ...prev, completed: !prev.completed }) : null);
                                    }}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all border cursor-pointer ${selectedProject.completed
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-250'
                                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 shadow-sm text-zinc-650'
                                        }`}
                                >
                                    {selectedProject.completed ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                    ) : (
                                        <><Circle className="w-4 h-4 mr-2" /> Mark Done</>
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
