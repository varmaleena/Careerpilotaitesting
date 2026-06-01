import React, { useRef } from 'react';
import { X, Share2, Copy, Check, Twitter, Linkedin, Zap } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';

interface ShareSuccessModalProps {
    score: number;
    role: string;
    onClose: () => void;
    streak: number;
}

export const ShareSuccessModal: React.FC<ShareSuccessModalProps> = ({ score, role, onClose, streak }) => {
    const [copied, setCopied] = React.useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const shareText = `Just hit a ${score}% readiness score for ${role} on CareerPilot! \n\nI'm on a ${streak}-day streak preparing for my dream job. \n\n#CareerPilot #TechCareers #InterviewPrep`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    const handleLinkedinShare = () => {
        const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-zinc-200/80 rounded-3xl max-w-md w-full shadow-xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 transition-colors z-10 p-1 hover:bg-zinc-100 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pb-0 text-center bg-white">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Share Your Progress!</h2>
                    <p className="text-zinc-500 text-sm">Inspire others and build your personal brand.</p>
                </div>

                {/* The Card Visual */}
                <div className="p-6 flex justify-center bg-white">
                    <div
                        ref={cardRef}
                        className="bg-zinc-50 border border-zinc-200/80 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center relative overflow-hidden shadow-sm"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,0,0,0.02)_0%,transparent_60%)] pointer-events-none"></div>

                        <h3 className="text-zinc-500 font-semibold tracking-wider text-[10px] uppercase mb-2">Career Readiness</h3>
                        <div className="">
                            <ScoreGauge score={score} />
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-zinc-900 font-bold text-xl capitalize">{role}</p>
                            <p className="text-zinc-500 text-xs mt-1">CareerPilot Analysis</p>
                        </div>

                        <div className="mt-4 flex items-center space-x-2 bg-zinc-100 px-4 py-1.5 rounded-full border border-zinc-200">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-zinc-700 text-xs font-semibold">{streak} Day Streak</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-zinc-50/50 p-6 border-t border-zinc-200/80 space-y-3">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-zinc-50 text-zinc-800 py-3 rounded-xl transition-all font-medium border border-zinc-200 shadow-sm"
                    >
                        {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-zinc-650" />}
                        <span>{copied ? 'Copied to Clipboard!' : 'Copy Caption'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleTwitterShare}
                            className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-55 hover:bg-zinc-50 text-[#1DA1F2] py-3 rounded-xl transition-all font-medium border border-zinc-200 shadow-sm"
                        >
                            <Twitter className="w-5 h-5" fill="currentColor" />
                            <span>Twitter</span>
                        </button>
                        <button
                            onClick={handleLinkedinShare}
                            className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-55 hover:bg-zinc-50 text-[#0A66C2] py-3 rounded-xl transition-all font-medium border border-zinc-200 shadow-sm"
                        >
                            <Linkedin className="w-5 h-5" fill="currentColor" />
                            <span>LinkedIn</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
