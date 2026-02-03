import React, { useState } from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';

interface ConfirmResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Reset failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden group">

                {/* Subtle Red Gradient Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 opacity-70"></div>

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Reset Progress</h3>
                            <p className="text-sm text-zinc-500 mt-1">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-4 space-y-4">
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 space-y-3">
                        <p className="text-zinc-300 text-sm font-medium">
                            Permenantly delete:
                        </p>
                        <ul className="space-y-2.5">
                            {[
                                "Career Analysis & Readiness Score",
                                "Learning Plan & Progress",
                                "Resume Data & Analysis",
                                "Interview History & Feedback"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start space-x-3 text-sm group/item">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500/40 group-hover/item:bg-red-500 transition-colors" />
                                    <span className="text-zinc-400 group-hover/item:text-zinc-300 transition-colors">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1 bg-emerald-500/10 rounded-full">
                                <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-400">Safe Data</p>
                                <p className="text-xs text-emerald-500/70 mt-0.5 leading-relaxed">
                                    Your purchases, total XP, login streak, and credits will be preserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 p-6 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed border border-red-500 hover:border-red-400"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Progress"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
