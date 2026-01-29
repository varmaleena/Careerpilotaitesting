import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle, Loader2, Mail } from 'lucide-react';

interface FeedbackModalProps {
    userEmail: string;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ userEmail, onClose }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    access_key: "c8345420-df66-48e4-bc5b-998856268419",
                    name: "CareerPilot Feedback System",
                    email: userEmail,
                    from_name: `CareerPilot User (${userEmail})`,
                    subject: `New CareerPilot Feedback from ${userEmail}`,
                    message: message.trim(),
                }),
            });

            const result = await response.json();

            if (result.success) {
                setIsSuccess(true);
                setMessage('');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.message || "Failed to send feedback");
            }

        } catch (err: any) {
            console.error("Feedback Error:", err);
            setError("Failed to send feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/20 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <MessageSquare className="w-6 h-6 mr-3 text-indigo-400" />
                        Send Feedback
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Help us improve your CareerPilot experience.</p>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="py-10 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-white font-bold text-xl">Thank You!</h4>
                            <p className="text-slate-400 mt-2">
                                Your feedback has been forwarded to the team.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                    Your Thoughts
                                </label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what you like, what's broken, or what feature you want next..."
                                    rows={5}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none placeholder-slate-700"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm px-1 bg-red-900/10 p-2 rounded-lg border border-red-500/20">{error}</p>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <a
                                    href={`mailto:careerpilotai.official@gmail.com?subject=Feedback&body=${encodeURIComponent(message)}`}
                                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors inline-flex items-center"
                                >
                                    <Mail className="w-3 h-3 mr-1.5" />
                                    Or email careerpilotai.official@gmail.com
                                </a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
