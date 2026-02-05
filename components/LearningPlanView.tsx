import React from 'react';
import {
    Activity,
    BookOpen,
    Briefcase,
    Calendar,
    Check,
    CheckCircle,
    Circle,
    Clock,
    Loader2,
    PlayCircle,
    Plus,
    RefreshCw,
    Sparkles,
    Trash2,
    Youtube
} from 'lucide-react';
import { UserProfile, WeeklyPlan } from '../types';
import { calculatePlanStatistics, getCurrentWeek, getProgressMessage } from '../services/planStatistics';

interface LearningPlanViewProps {
    userProfile: UserProfile;
    plan: WeeklyPlan[] | null;
    isGeneratingPlan: boolean;
    addingTaskWeek: number | null;
    newTaskTitle: string;

    onGeneratePlan: () => void;
    onToggleTask: (weekIdx: number, taskId: string) => void;
    onDeleteTask: (weekIdx: number, taskId: string) => void;
    onAddTask: (weekIdx: number) => void;
    setAddingTaskWeek: (week: number | null) => void;
    setNewTaskTitle: (title: string) => void;
}

export const LearningPlanView: React.FC<LearningPlanViewProps> = ({
    userProfile,
    plan,
    isGeneratingPlan,
    addingTaskWeek,
    newTaskTitle,
    onGeneratePlan,
    onToggleTask,
    onDeleteTask,
    onAddTask,
    setAddingTaskWeek,
    setNewTaskTitle
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <div>
                    <h1 className="text-xl font-bold text-white">Learning Plan</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Roadmap for <span className="text-zinc-300">{userProfile.targetRole}</span></p>
                </div>
                {plan && (
                    <button
                        onClick={onGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                    >
                        {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Regenerate
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {!plan && !isGeneratingPlan && (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                            <BookOpen className="w-7 h-7 text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No Learning Plan Yet</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                            Create a personalized curriculum based on your skill gaps.
                        </p>
                        <button
                            onClick={onGeneratePlan}
                            className="bg-white hover:bg-zinc-200 text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center mx-auto transition-all shadow-lg shadow-white/5"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Generate Plan
                        </button>
                    </div>
                )}

                {isGeneratingPlan && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="w-10 h-10 text-zinc-500 animate-spin mb-4" />
                        <p className="text-zinc-400 text-sm">Designing your curriculum...</p>
                    </div>
                )}

                {plan && (
                    <>
                        {/* Statistics Panel */}
                        {(() => {
                            const stats = calculatePlanStatistics(plan, 2);
                            const currentWeek = getCurrentWeek(plan);
                            const progressMessage = getProgressMessage(stats.progressPercentage);

                            console.log(`[UI] Plan Stats Updated - Hours: ${stats.completedHours}/${stats.totalHours}`);

                            return (
                                <div className="bg-gradient-to-br from-[#09090b] via-zinc-900 to-indigo-950/30 rounded-2xl border border-zinc-800/60 p-8 shadow-xl relative overflow-hidden group">
                                    {/* Ambient Glow */}
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                    {/* Top Row - Progress */}
                                    <div className="flex items-end justify-between mb-8 relative z-10">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
                                                Course Progress
                                                {stats.progressPercentage >= 100 && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />}
                                            </h2>
                                            <p className="text-base font-medium text-indigo-200/70">{progressMessage}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{stats.progressPercentage}%</div>
                                        </div>
                                    </div>

                                    {/* Professional Progress Bar */}
                                    <div className="h-4 bg-zinc-900/50 rounded-full overflow-hidden mb-8 border border-white/5 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                            style={{ width: `${stats.progressPercentage}%` }}
                                        />
                                    </div>

                                    {/* Stats Grid - Vibrant & Clean */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5 relative z-10">
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500/70" /> Tasks
                                            </p>
                                            <p className="text-2xl font-bold text-white group-hover/stat:text-emerald-400 transition-colors">
                                                {stats.completedTasks} <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalTasks}</span>
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-blue-500/70" /> Hours
                                            </p>
                                            <p className="text-2xl font-bold text-white group-hover/stat:text-blue-400 transition-colors">
                                                {stats.completedHours}<span className="text-sm">h</span> <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalHours}<span className="text-sm">h</span></span>
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-violet-500/70" /> Est. Completion
                                            </p>
                                            <p className="text-lg font-bold text-white group-hover/stat:text-violet-400 transition-colors truncate">
                                                {stats.estimatedCompletionDate}
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Activity className="w-3.5 h-3.5 text-amber-500/70" /> Current Week
                                            </p>
                                            <p className="text-2xl font-bold text-white group-hover/stat:text-amber-400 transition-colors">
                                                {currentWeek} <span className="text-zinc-600 text-lg font-medium px-1">/</span> <span className="text-zinc-500 text-lg font-medium">{stats.totalWeeks}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Weekly Plan */}
                        {plan?.map((week, idx) => {
                            const completedCount = week.tasks.filter(t => t.completed).length;
                            const totalCount = week.tasks.length;
                            const weekProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                            // Unified Theme: Professional Indigo/Violet
                            const borderColor = 'border-l-indigo-500';
                            const headerGradient = 'from-indigo-500/10';

                            return (
                                <div key={idx} className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6 border-l-4 ${borderColor} shadow-lg shadow-black/20`}>
                                    {/* Week Header */}
                                    <div className={`px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r ${headerGradient} to-transparent`}>
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                                <span className="opacity-50 font-normal text-sm uppercase tracking-wider">Week {idx + 1}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                {week.theme}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{Math.round(weekProgress)}% Done</span>
                                            <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${weekProgress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-zinc-500 to-white'}`}
                                                    style={{ width: `${weekProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tasks List */}
                                    <div className="divide-y divide-zinc-800/50">
                                        {week.tasks?.map((task) => (
                                            <div key={task.id} className="px-6 py-4 hover:bg-zinc-800/30 transition-colors group flex items-start gap-4">
                                                {/* Minimal Icon */}
                                                <div className={`mt-0.5 ${task.type === 'project' ? 'text-zinc-400' : task.type === 'course' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                    {task.type === 'project' ? <Briefcase className="w-4 h-4" /> :
                                                        task.type === 'course' ? <PlayCircle className="w-4 h-4" /> :
                                                            <BookOpen className="w-4 h-4" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={`text-sm font-medium transition-colors ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                            {task.title}
                                                        </h4>
                                                        <span className="text-xs text-zinc-500 ml-4 shrink-0 font-medium">
                                                            {task.estimatedHours}h
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{task.description}</p>

                                                    <div className="flex items-center gap-3 mt-3">
                                                        {task.videoQuery && (
                                                            <a
                                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.videoQuery)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Youtube className="w-3 h-3 mr-1.5" /> Watch Tutorial
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => onToggleTask(idx, task.id)}
                                                            className={`text-xs font-medium transition-colors flex items-center ${task.completed ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'
                                                                }`}
                                                        >
                                                            {task.completed ? (
                                                                <><Check className="w-3 h-3 mr-1.5" /> Completed</>
                                                            ) : (
                                                                <><Circle className="w-3 h-3 mr-1.5" /> Mark as Done</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <button
                                                    onClick={() => onDeleteTask(idx, task.id)}
                                                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Task - Minimal */}
                                        <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800">
                                            {addingTaskWeek === idx ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={newTaskTitle}
                                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                                        placeholder="New task title..."
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-zinc-500 outline-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setAddingTaskWeek(null)} className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white">Cancel</button>
                                                        <button onClick={() => onAddTask(idx)} className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded shadow-sm">Add Task</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAddingTaskWeek(idx)}
                                                    className="flex items-center text-xs font-medium text-zinc-500 hover:text-white transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};
