import React from 'react';
import {
    Loader2,
    History,
    ChevronRight,
    Play,
    Clock,
    Volume2,
    VolumeX,
    User,
    Bot,
    Mic,
    Send
} from 'lucide-react';
import { AppView, UserProfile, InterviewFeedback, ChatMessage } from '../types';
import { InterviewAnalysisView } from './InterviewAnalysisView';

interface InterviewViewProps {
    userProfile: UserProfile;
    isGeneratingFeedback: boolean;
    interviewFeedback: InterviewFeedback | null;
    isInterviewStarted: boolean;
    showPastInterviewsDropdown: boolean;
    setShowPastInterviewsDropdown: (show: boolean) => void;
    setInterviewFeedback: (feedback: InterviewFeedback | null) => void;
    setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    startInterview: () => void;
    interviewElapsedSeconds: number;
    isSpeakingEnabled: boolean;
    setIsSpeakingEnabled: (enabled: boolean) => void;
    handleEndInterview: () => void;
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleSendMessage: (e: React.FormEvent) => void;
    chatInput: string;
    setChatInput: (input: string) => void;
    isSpeechRecognitionSupported: boolean;
    toggleListening: () => void;
    isListening: boolean;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
    userProfile,
    isGeneratingFeedback,
    interviewFeedback,
    isInterviewStarted,
    showPastInterviewsDropdown,
    setShowPastInterviewsDropdown,
    setInterviewFeedback,
    setChatMessages,
    startInterview,
    interviewElapsedSeconds,
    isSpeakingEnabled,
    setIsSpeakingEnabled,
    handleEndInterview,
    chatMessages,
    isChatLoading,
    messagesEndRef,
    handleSendMessage,
    chatInput,
    setChatInput,
    isSpeechRecognitionSupported,
    toggleListening,
    isListening
}) => {
    return (
        <div className="h-[calc(100dvh-200px)] md:h-[calc(100vh-140px)] md:min-h-[600px] flex flex-col bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-sm relative">

            {isGeneratingFeedback ? (
                /* Feedback Loading State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                    <Loader2 className="w-12 h-12 text-zinc-900 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">Analyzing Performance</h3>
                    <p className="text-zinc-500 max-w-md">Our AI is reviewing your answers, tone, and technical accuracy to generate a personalized report.</p>
                </div>
            ) : interviewFeedback ? (
                /* Feedback Report */
                <InterviewAnalysisView
                    feedback={interviewFeedback}
                    onClose={() => {
                        setInterviewFeedback(null);
                        setChatMessages([]);
                    }}
                />
            ) : !isInterviewStarted ? (
                /* Minimal Focused Start Screen */
                <div className="flex-1 flex flex-col bg-white">
                    {/* Compact Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200/80 bg-white">
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900">Mock Interview Simulator</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Target Role: <span className="text-zinc-700 font-medium">{userProfile.targetRole}</span></p>
                        </div>
                        {/* Past Interviews Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPastInterviewsDropdown(!showPastInterviewsDropdown)}
                                className="text-sm text-zinc-500 hover:text-zinc-800 flex items-center transition-colors"
                            >
                                <History className="w-4 h-4 mr-1.5" />
                                Past Interviews
                                <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showPastInterviewsDropdown ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {showPastInterviewsDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {userProfile.pastInterviews && userProfile.pastInterviews.length > 0 ? (
                                            userProfile.pastInterviews.map((interview) => (
                                                <div
                                                    key={interview.id}
                                                    className="px-4 py-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-zinc-900">{interview.targetRole}</div>
                                                        <div className="text-xs text-zinc-500 mt-0.5">
                                                            {new Date(interview.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            <span className="mx-1.5">•</span>
                                                            <span className={interview.score >= 70 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{interview.score}%</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setInterviewFeedback(interview.feedback);
                                                            setShowPastInterviewsDropdown(false);
                                                        }}
                                                        className="text-xs text-zinc-900 hover:underline font-semibold"
                                                    >
                                                        View Analysis
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-sm text-zinc-500">
                                                No past interviews yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-6 bg-white">
                        <div className="text-center max-w-md">
                            <button
                                onClick={startInterview}
                                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-md flex items-center justify-center mx-auto"
                            >
                                <Play className="w-6 h-6 mr-3 fill-white text-white" />
                                Start Mock Interview
                            </button>
                            <p className="text-sm text-zinc-500 mt-4">
                                Role-specific AI interviewer with instant feedback
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Chat Interface */
                <>
                    <div className="bg-zinc-50/50 p-5 border-b border-zinc-200/80 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                            <span className="font-bold text-zinc-800">AI Interviewer <span className="text-zinc-500 font-normal">| {userProfile.targetRole}</span></span>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Timer - Always visible, responsive sizing */}
                            <div className="flex items-center space-x-1 sm:space-x-2 bg-zinc-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-zinc-200">
                                <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${((2100 - interviewElapsedSeconds) < 300) ? 'text-amber-600' : 'text-zinc-500'}`} />
                                <span className={`font-mono font-bold text-xs sm:text-sm ${((2100 - interviewElapsedSeconds) < 60) ? 'text-red-650 animate-pulse' : 'text-zinc-700'}`}>
                                    {Math.floor((2100 - interviewElapsedSeconds) / 60).toString().padStart(2, '0')}:
                                    {((2100 - interviewElapsedSeconds) % 60).toString().padStart(2, '0')}
                                </span>
                            </div>

                            <button
                                onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                                className={`transition-colors ${isSpeakingEnabled ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-650'}`}
                                title="Toggle Text-to-Speech"
                            >
                                {isSpeakingEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            <button
                                onClick={handleEndInterview}
                                className="text-[10px] sm:text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider border border-red-200 px-2 sm:px-3 py-1 rounded-full hover:bg-red-50 transition-all"
                            >
                                End
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
                        {/* Only show 'Connecting' if truly loading and no messages yet */}
                        {chatMessages?.length === 0 && isChatLoading && (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-500" />
                                <p>Initializing interview session...</p>
                            </div>
                        )}

                        {chatMessages?.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-6 shadow-sm border ${msg.role === 'user'
                                    ? 'bg-zinc-900 border-zinc-900 text-white rounded-br-none'
                                    : 'bg-zinc-105/80 bg-zinc-100 border border-zinc-200/60 text-zinc-800 rounded-bl-none'
                                    }`}>
                                    <div className="flex items-center space-x-2 mb-2 opacity-60">
                                        {msg.role === 'user' ? <User className="w-3 h-3 text-zinc-300" /> : <Bot className="w-3 h-3 text-zinc-500" />}
                                        <span className="text-xs font-bold uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'Interviewer'}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isChatLoading && chatMessages.length > 0 && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-100 border border-zinc-200/60 rounded-2xl rounded-bl-none p-6 shadow-sm flex items-center space-x-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                                    <span className="text-xs font-medium text-zinc-500">Interviewer is typing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 sm:p-6 pb-20 md:pb-6 bg-zinc-50/50 border-t border-zinc-200/80">
                        <form onSubmit={handleSendMessage} className="flex space-x-3">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your answer here..."
                                className="flex-1 p-4 bg-white border border-zinc-200 text-zinc-900 rounded-xl focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 outline-none transition-all placeholder-zinc-400"
                                disabled={isChatLoading}
                            />
                            {isSpeechRecognitionSupported && (
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-4 rounded-xl transition-all ${isListening ? 'bg-red-650 text-white animate-pulse shadow-sm' : 'bg-zinc-100 text-zinc-650 hover:text-zinc-800 hover:bg-zinc-200'}`}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || isChatLoading}
                                className="bg-zinc-900 text-white p-4 rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};
