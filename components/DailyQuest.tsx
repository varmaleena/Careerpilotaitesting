import React, { useState, useEffect } from 'react';
import { Flame, Clock, Trophy, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { AppView } from '../types';

interface DailyQuestProps {
    streak: number;
    xp: number;
    onNavigate: (view: AppView) => void;
}

export const DailyQuest: React.FC<DailyQuestProps> = ({ streak, xp, onNavigate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        // Calculate time until midnight
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const diff = tomorrow.getTime() - now.getTime();

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);

            setTimeLeft(`${hours}h ${minutes}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-zinc-50 rounded-xl border border-zinc-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        Today's Focus: Ace One Mock Interview
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-600 border border-zinc-300/40 ml-2">
                            {timeLeft} left
                        </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Complete a session to maintain your streak and earn <span className="text-amber-650 font-bold">+50 XP</span>.
                    </p>
                </div>
            </div>

            <button
                onClick={() => onNavigate(AppView.INTERVIEW)}
                className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center transition-all border-0 shadow-sm cursor-pointer"
            >
                {isCompleted ? (
                    <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Completed
                    </>
                ) : (
                    <>
                        Start Task
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                )}
            </button>
        </div>
    );
};
