import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle, Loader2, Mail } from 'lucide-react';
import { AuthService } from '../services/authService';

interface FeedbackFloatingProps {
    userEmail: string;
}

const FeedbackFloating: React.FC<FeedbackFloatingProps> = ({ userEmail }) => {
    const [isOpen, setIsOpen] = useState(false);
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

                // Auto close after 3 seconds
                setTimeout(() => {
                    setIsOpen(false);
                    setIsSuccess(false);
                }, 3000);
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
        <div className="fixed bottom-6 right-6 z-[9999] group">
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600 hover:bg-indigo-500 scale-110'
                    }`}
            >
                {isOpen ? (
                    <X className="w-5 h-5 text-white" />
                ) : (
                    <MessageSquare className="w-5 h-5 text-white" />
                )}
            </button>

            {/* Label for better UX */}
            {!isOpen && (
                <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Feedback
                </span>
            )}

            {/* Feedback Modal */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-[350px] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-transparent border-b border-white/5">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-indigo-400" />
                            Send Feedback
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Help us improve CareerPilot</p>
                    </div>

                    <div className="p-6">
                        {isSuccess ? (
                            <div className="py-8 text-center animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h4 className="text-white font-bold text-lg">Thank You!</h4>
                                <p className="text-slate-400 text-sm mt-2 px-4">
                                    Your feedback has been sent to the team.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                        Your Message
                                    </label>
                                    <textarea
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tell us what you think or report a bug..."
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none placeholder-slate-700"
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-xs px-1">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20"
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

                                <div className="pt-2">
                                    <a
                                        href={`mailto:careerpilotai.official@gmail.com?subject=Feedback&body=${encodeURIComponent(message)}`}
                                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center uppercase tracking-tighter"
                                    >
                                        <Mail className="w-3 h-3 mr-1" />
                                        Or email directly to careerpilotai.official@gmail.com
                                    </a>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackFloating;
