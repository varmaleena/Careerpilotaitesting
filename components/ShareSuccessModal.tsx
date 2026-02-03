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
        // LinkedIn doesn't support pre-filling text easily without an API, but we can try a basic share url or just guide them.
        // Better to focus on Copy Text for LinkedIn usually, but we can try:
        const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 pb-0 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Share Your Progress!</h2>
                    <p className="text-slate-400 text-sm">Inspire others and build your personal brand.</p>
                </div>

                {/* The Card Visual */}
                <div className="p-6 flex justify-center">
                    <div
                        ref={cardRef}
                        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center relative overflow-hidden shadow-inner"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>

                        <h3 className="text-indigo-300 font-semibold tracking-wider text-[10px] uppercase mb-2">Career Readiness</h3>
                        <div className="">
                            <ScoreGauge score={score} />
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-white font-bold text-xl capitalize">{role}</p>
                            <p className="text-slate-400 text-xs mt-1">CareerPilot Analysis</p>
                        </div>

                        <div className="mt-4 flex items-center space-x-2 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-indigo-200 text-xs font-semibold">{streak} Day Streak</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-slate-950/50 p-6 border-t border-slate-800 space-y-3">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-all font-medium border border-slate-700"
                    >
                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        <span>{copied ? 'Copied to Clipboard!' : 'Copy Caption'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleTwitterShare}
                            className="flex items-center justify-center space-x-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] py-3 rounded-xl transition-all font-medium border border-[#1DA1F2]/20"
                        >
                            <Twitter className="w-5 h-5" fill="currentColor" />
                            <span>Twitter</span>
                        </button>
                        <button
                            onClick={handleLinkedinShare}
                            className="flex items-center justify-center space-x-2 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] py-3 rounded-xl transition-all font-medium border border-[#0A66C2]/20"
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
