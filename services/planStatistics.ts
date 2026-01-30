import { WeeklyPlan } from "../types";

/**
 * Calculate comprehensive statistics for a learning plan
 */
export interface PlanStatistics {
    totalWeeks: number;
    totalTasks: number;
    totalHours: number;
    completedTasks: number;
    completedHours: number;
    progressPercentage: number;
    estimatedCompletionDate: string;
    averageHoursPerWeek: number;
    taskBreakdown: {
        course: number;
        project: number;
        reading: number;
    };
}

export const calculatePlanStatistics = (
    plan: WeeklyPlan[],
    hoursPerDay: number = 2 // Default: 2 hours/day study time
): PlanStatistics => {
    const totalWeeks = plan.length;
    const totalTasks = plan.reduce((sum, week) => sum + week.tasks.length, 0);
    const totalHours = plan.reduce(
        (sum, week) => sum + week.tasks.reduce((taskSum, task) => taskSum + task.estimatedHours, 0),
        0
    );

    const completedTasks = plan.reduce(
        (sum, week) => sum + week.tasks.filter(t => t.completed).length,
        0
    );

    const completedHours = plan.reduce(
        (sum, week) =>
            sum + week.tasks.filter(t => t.completed).reduce((taskSum, task) => taskSum + task.estimatedHours, 0),
        0
    );

    console.log(`[PlanStats] Completed Hours: ${completedHours}/${totalHours}`);

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const remainingHours = totalHours - completedHours;
    const daysToComplete = Math.ceil(remainingHours / hoursPerDay);
    const estimatedCompletionDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const averageHoursPerWeek = totalWeeks > 0 ? Math.round(totalHours / totalWeeks) : 0;

    const taskBreakdown = plan.reduce(
        (breakdown, week) => {
            week.tasks.forEach(task => {
                breakdown[task.type] = (breakdown[task.type] || 0) + 1;
            });
            return breakdown;
        },
        { course: 0, project: 0, reading: 0 }
    );

    return {
        totalWeeks,
        totalTasks,
        totalHours,
        completedTasks,
        completedHours,
        progressPercentage,
        estimatedCompletionDate,
        averageHoursPerWeek,
        taskBreakdown
    };
};

/**
 * Get a motivational message based on progress
 */
export const getProgressMessage = (progressPercentage: number): string => {
    if (progressPercentage === 0) return "🚀 Ready to start your journey? Let's go!";
    if (progressPercentage < 25) return "💪 Great start! Keep the momentum going!";
    if (progressPercentage < 50) return "🔥 You're making solid progress!";
    if (progressPercentage < 75) return "⭐ More than halfway there! You're crushing it!";
    if (progressPercentage < 100) return "🎯 Almost there! The finish line is in sight!";
    return "🎉 Congratulations! You've completed your learning plan!";
};

/**
 * Get the current week based on completed tasks
 */
export const getCurrentWeek = (plan: WeeklyPlan[]): number => {
    for (let i = 0; i < plan.length; i++) {
        const allTasksCompleted = plan[i].tasks.every(task => task.completed);
        if (!allTasksCompleted) {
            return i + 1; // Return 1-indexed week number
        }
    }
    return plan.length; // All weeks completed
};
