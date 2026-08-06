import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ViewLoadingFallbackProps {
    title?: string;
    description?: string;
}

export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({
    title = 'Loading section...',
    description = 'Preparing your personalized career workspace'
}) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-50/50 rounded-2xl animate-fade-in">
            <div className="relative mb-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-900/10">
                    <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-zinc-200">
                    <Loader2 className="w-4 h-4 text-zinc-800 animate-spin" />
                </div>
            </div>

            <h3 className="text-base font-bold text-zinc-900 mb-1 tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 text-center max-w-sm mb-8">{description}</p>

            {/* Skeleton Shimmer Preview */}
            <div className="w-full max-w-md space-y-3 opacity-60">
                <div className="h-4 bg-zinc-200 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-3 bg-zinc-200 rounded-full w-1/2 animate-pulse"></div>
                <div className="h-20 bg-zinc-200 rounded-xl w-full animate-pulse mt-4"></div>
            </div>
        </div>
    );
};

export default ViewLoadingFallback;
