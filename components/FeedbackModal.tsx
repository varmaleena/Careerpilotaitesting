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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-zinc-200/80 rounded-2xl w-full max-w-md shadow-xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-900 transition-colors p-1 hover:bg-zinc-105 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pb-4">
                    <h3 className="text-2xl font-bold text-zinc-900 flex items-center tracking-tight mb-2">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mr-3 border border-zinc-200">
                            <MessageSquare className="w-5 h-5 text-zinc-700" />
                        </div>
                        Send Feedback
                    </h3>
                    <p className="text-zinc-500 text-sm ml-14">Help us improve your CareerPilot experience.</p>
                </div>

                <div className="px-8 pb-8 pt-2">
                    {isSuccess ? (
                        <div className="py-10 text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-250">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h4 className="text-zinc-900 font-bold text-xl mb-2">Thank You!</h4>
                            <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                                Your feedback has been sent to our team. We appreciate your input!
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                                    Your Thoughts
                                </label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what you like, what's broken, or what feature you want next..."
                                    rows={5}
                                    className="w-full bg-white border border-zinc-250 rounded-xl p-4 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 outline-none transition-all resize-none text-sm"
                                />
                            </div>

                            {error && (
                                <p className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg border border-red-200 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                    {error}
                                </p>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center transition-all shadow-sm"
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

                            <div className="text-center">
                                <a
                                    href={`mailto:careerpilotai.official@gmail.com?subject=Feedback&body=${encodeURIComponent(message)}`}
                                    className="text-xs text-zinc-500 hover:text-zinc-850 hover:underline transition-colors inline-flex items-center"
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
