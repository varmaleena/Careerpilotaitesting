import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl shadow-red-500/20">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Reset Progress?</h3>
                            <p className="text-sm text-slate-400 mt-0.5">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        This will permanently delete:
                    </p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2 text-red-300">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>Career Analysis & Readiness Score</span>
                        </li>
                        <li className="flex items-start space-x-2 text-red-300">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>Learning Plan & Progress</span>
                        </li>
                        <li className="flex items-start space-x-2 text-red-300">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>Resume Data & Analysis</span>
                        </li>
                        <li className="flex items-start space-x-2 text-red-300">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>Interview History & Feedback</span>
                        </li>
                    </ul>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mt-4">
                        <p className="text-sm text-emerald-300 flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span><strong>Preserved:</strong> Your purchases, XP, streak, and credits will be saved.</span>
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 p-6 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all font-bold shadow-lg shadow-red-500/20"
                    >
                        Reset Progress
                    </button>
                </div>
            </div>
        </div>
    );
};
