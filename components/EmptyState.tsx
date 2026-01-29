import React from 'react';
import { LucideIcon, Plus, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    color?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'slate';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    color = 'indigo'
}) => {
    // Color variants map
    const colorStyles = {
        indigo: {
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            text: 'text-indigo-400',
            button: 'bg-indigo-600 hover:bg-indigo-500',
            shadow: 'shadow-indigo-500/20'
        },
        emerald: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            button: 'bg-emerald-600 hover:bg-emerald-500',
            shadow: 'shadow-emerald-500/20'
        },
        amber: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            button: 'bg-amber-600 hover:bg-amber-500',
            shadow: 'shadow-amber-500/20'
        },
        purple: {
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            text: 'text-purple-400',
            button: 'bg-purple-600 hover:bg-purple-500',
            shadow: 'shadow-purple-500/20'
        },
        slate: {
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20',
            text: 'text-slate-400',
            button: 'bg-slate-700 hover:bg-slate-600',
            shadow: 'shadow-slate-500/20'
        }
    };

    const styles = colorStyles[color];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className={`w-20 h-20 rounded-3xl ${styles.bg} border ${styles.border} flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className={`w-10 h-10 ${styles.text} transform group-hover:scale-110 transition-transform duration-300`} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 max-w-md mx-auto">
                {title}
            </h3>

            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg ${styles.shadow} ${styles.button} transition-all hover:scale-105 active:scale-95 flex items-center`}
                >
                    {actionLabel === 'Generate New Ideas' || actionLabel.includes('Generate') ? (
                        <Plus className="w-5 h-5 mr-2" />
                    ) : (
                        <ArrowRight className="w-5 h-5 mr-2" />
                    )}
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
