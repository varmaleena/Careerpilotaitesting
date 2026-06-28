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
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#e3e1dc]">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Learning Plan</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Roadmap for <span className="text-zinc-800 font-medium">{userProfile.targetRole}</span></p>
                </div>
                {plan && (
                    <button
                        onClick={onGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="bg-white hover:bg-zinc-55 text-zinc-700 border border-[#e3e1dc] shadow-sm px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50 cursor-pointer"
                    >
                        {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Regenerate
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {!plan && (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#e3e1dc]">
                            <BookOpen className="w-7 h-7 text-zinc-550" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">No Learning Plan Yet</h3>
                        <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto leading-relaxed">
                            Create a personalized curriculum based on your skill gaps.
                        </p>
                        <button
                            onClick={onGeneratePlan}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center mx-auto transition-all shadow-sm border-0 cursor-pointer"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Generate Plan
                        </button>
                    </div>
                )}

                {isGeneratingPlan && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e3e1dc] flex items-center justify-center mb-6 shadow-sm">
                                <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                            </div>
                        </div>
                        <p className="text-zinc-800 text-sm font-medium">Designing your curriculum...</p>
                        <p className="text-zinc-500 text-xs mt-1">This may take a moment</p>
                    </div>
                )}

                {plan && (
                    <>
                        {/* Statistics Panel */}
                        {(() => {
                            const stats = calculatePlanStatistics(plan, 2);
                            const currentWeek = getCurrentWeek(plan);
                            const progressMessage = getProgressMessage(stats.progressPercentage);

                            return (
                                <div className="bg-white rounded-2xl border border-[#e3e1dc] p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                                    {/* Top Row - Progress */}
                                    <div className="flex items-end justify-between mb-8 relative z-10">
                                        <div>
                                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2 flex items-center gap-2">
                                                Course Progress
                                                {stats.progressPercentage >= 100 && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />}
                                            </h2>
                                            <p className="text-base font-medium text-zinc-600">{progressMessage}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-5xl font-black text-zinc-900 tracking-tight">{stats.progressPercentage}%</div>
                                        </div>
                                    </div>

                                    {/* Professional Progress Bar */}
                                    <div className="h-4 bg-zinc-100 rounded-full overflow-hidden mb-8 shadow-inner">
                                        <div
                                            className="h-full bg-zinc-900 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${stats.progressPercentage}%` }}
                                        />
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[#e3e1dc] relative z-10">
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-zinc-450" /> Tasks
                                            </p>
                                            <p className="text-2xl font-bold text-zinc-900 group-hover/stat:text-zinc-950 transition-colors">
                                                {stats.completedTasks} <span className="text-zinc-400 text-lg font-medium px-1">/</span> <span className="text-zinc-550 text-lg font-medium">{stats.totalTasks}</span>
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-zinc-450" /> Hours
                                            </p>
                                            <p className="text-2xl font-bold text-zinc-900 group-hover/stat:text-zinc-950 transition-colors">
                                                {stats.completedHours}<span className="text-sm font-normal text-zinc-500">h</span> <span className="text-zinc-400 text-lg font-medium px-1">/</span> <span className="text-zinc-550 text-lg font-medium">{stats.totalHours}<span className="text-sm font-normal text-zinc-500">h</span></span>
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-450" /> Est. Completion
                                            </p>
                                            <p className="text-lg font-bold text-zinc-900 truncate">
                                                {stats.estimatedCompletionDate}
                                            </p>
                                        </div>
                                        <div className="group/stat">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Activity className="w-3.5 h-3.5 text-zinc-450" /> Current Week
                                            </p>
                                            <p className="text-2xl font-bold text-zinc-900 group-hover/stat:text-zinc-950 transition-colors">
                                                {currentWeek} <span className="text-zinc-400 text-lg font-medium px-1">/</span> <span className="text-zinc-550 text-lg font-medium">{stats.totalWeeks}</span>
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

                            return (
                                <div key={idx} className="bg-white rounded-xl border border-[#e3e1dc] overflow-hidden mb-6 border-l-4 border-l-zinc-900 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
                                    {/* Week Header */}
                                    <div className="px-6 py-5 border-b border-[#e3e1dc] flex justify-between items-center bg-[#fcfcfa]">
                                        <div>
                                            <h3 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                                                <span className="text-zinc-500 font-normal text-xs uppercase tracking-wider">Week {idx + 1}</span>
                                                <span className="w-1 h-1 rounded-full bg-[#e3e1dc]"></span>
                                                {week.theme}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-zinc-650 uppercase tracking-wide">{Math.round(weekProgress)}% Done</span>
                                            <div className="w-28 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 bg-zinc-900"
                                                    style={{ width: `${weekProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tasks List */}
                                    <div className="divide-y divide-[#e3e1dc]">
                                        {week.tasks?.map((task) => (
                                            <div key={task.id} className="px-6 py-4 hover:bg-zinc-50/50 transition-colors group flex items-start gap-4">
                                                {/* Minimal Icon */}
                                                <div className="mt-0.5 text-zinc-400">
                                                    {task.type === 'project' ? <Briefcase className="w-4 h-4" /> :
                                                        task.type === 'course' ? <PlayCircle className="w-4 h-4" /> :
                                                            <BookOpen className="w-4 h-4" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={`text-sm font-medium transition-colors ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                                                            {task.title}
                                                        </h4>
                                                        <span className="text-xs text-zinc-500 ml-4 shrink-0 font-medium">
                                                            {task.estimatedHours}h
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-550 mt-1 line-clamp-1">{task.description}</p>

                                                    <div className="flex items-center gap-3 mt-3">
                                                        {task.videoQuery && (
                                                            <a
                                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.videoQuery)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center text-xs font-semibold text-zinc-500 hover:text-red-655 transition-colors"
                                                            >
                                                                <Youtube className="w-3 h-3 mr-1.5" /> Watch Tutorial
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => onToggleTask(idx, task.id)}
                                                            className={`text-xs font-semibold transition-colors flex items-center cursor-pointer border-0 bg-transparent ${task.completed ? 'text-zinc-800 font-bold' : 'text-zinc-400 hover:text-zinc-600'
                                                                }`}
                                                        >
                                                            {task.completed ? (
                                                                <><Check className="w-3 h-3 mr-1.5 text-zinc-500" /> Completed</>
                                                            ) : (
                                                                <><Circle className="w-3 h-3 mr-1.5 text-zinc-300" /> Mark as Done</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <button
                                                    onClick={() => onDeleteTask(idx, task.id)}
                                                    className="text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-0 bg-transparent"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Task - Minimal */}
                                        <div className="px-6 py-3 bg-zinc-50/50 border-t border-[#e3e1dc]">
                                            {addingTaskWeek === idx ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={newTaskTitle}
                                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                                        placeholder="New task title..."
                                                        className="w-full bg-white border border-[#e3e1dc] rounded px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 outline-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setAddingTaskWeek(null)} className="px-3 py-1.5 text-xs font-medium text-zinc-550 hover:text-zinc-800 cursor-pointer border-0 bg-transparent">Cancel</button>
                                                        <button onClick={() => onAddTask(idx)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded shadow-sm cursor-pointer border-0">Add Task</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAddingTaskWeek(idx)}
                                                    className="flex items-center text-xs font-medium text-zinc-500 hover:text-[#18181b] transition-colors cursor-pointer border-0 bg-transparent"
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
