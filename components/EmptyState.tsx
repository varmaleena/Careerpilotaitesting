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
    // Color variants map configured for clean light theme
    const colorStyles = {
        indigo: {
            bg: 'bg-zinc-50',
            border: 'border-zinc-200/80',
            text: 'text-zinc-700',
            button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
            shadow: 'shadow-sm'
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
            shadow: 'shadow-sm'
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-700',
            button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
            shadow: 'shadow-sm'
        },
        purple: {
            bg: 'bg-zinc-50',
            border: 'border-zinc-200/80',
            text: 'text-zinc-700',
            button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
            shadow: 'shadow-sm'
        },
        slate: {
            bg: 'bg-zinc-50',
            border: 'border-zinc-200/80',
            text: 'text-zinc-600',
            button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
            shadow: 'shadow-sm'
        }
    };

    const styles = colorStyles[color];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className={`w-20 h-20 rounded-3xl ${styles.bg} border ${styles.border} flex items-center justify-center mb-6 shadow-sm relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className={`w-10 h-10 ${styles.text} transform group-hover:scale-110 transition-transform duration-300`} />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900 mb-2 max-w-md mx-auto">
                {title}
            </h3>

            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-sm ${styles.button} transition-all hover:scale-105 active:scale-95 flex items-center`}
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
