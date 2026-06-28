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

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-zinc-200/80 rounded-2xl max-w-md w-full shadow-xl relative overflow-hidden group">

                {/* Subtle Red Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100 shadow-inner">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Reset Progress</h3>
                            <p className="text-sm text-zinc-500 mt-1">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-lg disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-4 space-y-4">
                    <div className="bg-zinc-55 bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-3">
                        <p className="text-zinc-800 text-sm font-medium">
                            Permanently delete:
                        </p>
                        <ul className="space-y-2.5">
                             {[
                                 "Career Analysis & Readiness Score",
                                 "Learning Plan & Progress",
                                 "Resume Data & Analysis",
                                 "Interview History & Feedback"
                             ].map((item, i) => (
                                 <li key={i} className="flex items-start space-x-3 text-sm group/item">
                                     <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                     <span className="text-zinc-600 group-hover/item:text-zinc-905 transition-colors">{item}</span>
                                 </li>
                             ))}
                        </ul>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1 bg-white border border-emerald-200 rounded-full flex items-center justify-center w-5 h-5 shrink-0">
                                <span className="text-emerald-600 text-[10px] font-bold">✓</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">Safe Data</p>
                                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
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
                        className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed border border-red-600"
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
