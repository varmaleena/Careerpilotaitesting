
import React from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, Shield, Zap, Code, Layout, Users, Star, ChevronRight, Globe, Lock } from 'lucide-react';

interface LandingPageProps {
   onGetStarted: () => void;
   onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
   return (
      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
         {/* --- Navbar --- */}
         <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
               <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                     <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">CareerPilot</span>
               </div>

               <div className="flex items-center space-x-3 sm:space-x-4">
                  <button onClick={onLogin} className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                     Log In
                  </button>
                  <button
                     onClick={onGetStarted}
                     className="bg-white text-slate-950 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-200 transition-all transform hover:scale-105 shadow-lg shadow-white/10 whitespace-nowrap"
                  >
                     Get Started
                  </button>
               </div>
            </div>
         </nav>

         {/* --- Hero Section --- */}
         <section className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-indigo-600/20 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none opacity-60 sm:opacity-100"></div>
            <div className="absolute bottom-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-600/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
               <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">

                  {/* Hero Copy */}
                  <div className="lg:w-1/2 text-center lg:text-left">
                     <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 mb-6 sm:mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-300">AI-Powered Career Architect v2.0</span>
                     </div>

                     <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] md:text-[clamp(3rem,6vw,5.5rem)] font-bold tracking-tight mb-6 leading-[1.1] sm:leading-[1.1]">
                        Your Career, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                           On Autopilot.
                        </span>
                     </h1>

                     <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        CareerPilot scans the job market, analyzes your profile, and generates a personalized curriculum and interview strategy to land your dream role.
                     </p>

                     <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <button
                           onClick={onGetStarted}
                           className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center group"
                        >
                           Analyze My Resume <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>

                     <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-slate-500 text-sm font-medium">
                        <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> No credit card required</div>
                        <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> 10,000+ plans generated</div>
                     </div>
                  </div>

                  {/* Hero Visual (Mock UI) */}
                  <div className="w-full lg:w-1/2 relative perspective-1000 mt-8 lg:mt-0">
                     <div className="relative transform lg:rotate-y-[-10deg] lg:rotate-x-[5deg] transition-transform duration-500 hover:rotate-0">
                        {/* Decorative Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30"></div>

                        {/* Main Dashboard Mockup */}
                        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden aspect-[4/3] w-full">
                           {/* Mock Header */}
                           <div className="h-8 sm:h-12 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 space-x-2">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                              <div className="flex-1"></div>
                              <div className="h-2 w-16 sm:w-20 bg-slate-800 rounded-full"></div>
                           </div>
                           {/* Mock Body */}
                           <div className="flex h-full">
                              {/* Mock Sidebar */}
                              <div className="w-12 sm:w-16 border-r border-slate-800 bg-slate-900/30 flex flex-col items-center py-4 space-y-4">
                                 <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30"></div>
                                 <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-800"></div>
                                 <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-800"></div>
                                 <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-800"></div>
                              </div>
                              {/* Mock Content */}
                              <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-950/50">
                                 <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                       <div className="h-2 sm:h-3 w-24 sm:w-32 bg-slate-800 rounded-full"></div>
                                       <div className="h-5 sm:h-6 w-32 sm:w-48 bg-slate-700 rounded-md"></div>
                                    </div>
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                       <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                    </div>
                                 </div>

                                 {/* Mock Charts/Cards */}
                                 <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="col-span-2 h-20 sm:h-24 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-3 sm:p-4 relative overflow-hidden">
                                       <div className="absolute bottom-0 left-0 w-full h-1/2 bg-indigo-500/10 blur-xl"></div>
                                       <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-slate-700 rounded mb-2"></div>
                                       <div className="flex items-end space-x-2 h-8 sm:h-10 mt-2">
                                          <div className="w-6 sm:w-8 bg-indigo-600 rounded-t h-full"></div>
                                          <div className="w-6 sm:w-8 bg-slate-700 rounded-t h-3/4"></div>
                                          <div className="w-6 sm:w-8 bg-slate-700 rounded-t h-1/2"></div>
                                       </div>
                                    </div>
                                    <div className="h-20 sm:h-24 bg-slate-900 border border-slate-800 rounded-xl p-3">
                                       <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-purple-500/20 mb-2"></div>
                                       <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-slate-700 rounded"></div>
                                    </div>
                                    <div className="h-20 sm:h-24 bg-slate-900 border border-slate-800 rounded-xl p-3">
                                       <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-500/20 mb-2"></div>
                                       <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-slate-700 rounded"></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Floating Elements - Repositioned for Mobile */}
                        <div className="absolute right-2 -bottom-6 sm:-right-6 sm:top-10 sm:bottom-auto bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 shadow-xl flex items-center space-x-3 w-max max-w-[calc(100%-20px)] animate-bounce duration-[3000ms]">
                           <div className="bg-emerald-500/20 p-1.5 sm:p-2 rounded-lg"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /></div>
                           <div>
                              <div className="text-[10px] sm:text-xs text-slate-400">Readiness Score</div>
                              <div className="text-xs sm:text-sm font-bold text-white">Top 5% Candidate</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* --- How It Works --- */}
         <section id="how-it-works" className="py-16 sm:py-24 relative border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">From <span className="text-indigo-400">Lost</span> to <span className="text-emerald-400">Hired</span> in 3 Steps</h2>
                  <p className="text-base sm:text-lg text-slate-400 px-4">Most career advice is generic. We build a custom operating system for your professional growth.</p>
               </div>

               <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                     {
                        icon: <Layout className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />,
                        title: "1. Scan & Analyze",
                        desc: "Upload your resume and target role. We analyze your profile against millions of job descriptions to find your exact gaps.",
                        color: "indigo"
                     },
                     {
                        icon: <Code className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />,
                        title: "2. Build & Learn",
                        desc: "Get a 2-week sprint plan with curated courses, reading materials, and portfolio-ready project ideas tailored to you.",
                        color: "purple"
                     },
                     {
                        icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />,
                        title: "3. Practice & Apply",
                        desc: "Master the interview with our AI hiring manager and scan the live market for jobs where you're a 90%+ match.",
                        color: "emerald"
                     }
                  ].map((step, idx) => (
                     <div key={idx} className="relative p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-${step.color}-500/10 flex items-center justify-center mb-4 sm:mb-6 border border-${step.color}-500/20 group-hover:scale-110 transition-transform`}>
                           {step.icon}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{step.title}</h3>
                        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{step.desc}</p>

                        {/* Connecting Line (Desktop) */}
                        {idx !== 2 && (
                           <div className="hidden md:block absolute top-12 sm:top-16 -right-4 w-8 border-t-2 border-dashed border-slate-700 z-10"></div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* --- Features Bento Grid --- */}
         <section id="features" className="py-16 sm:py-24 bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="mb-10 sm:mb-16">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Everything you need to <br className="hidden sm:block" />level up your career.</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Large Card */}
                  <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden group">
                     <div className="relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                           <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Autonomous Learning Plans</h3>
                        <p className="text-slate-300 text-base sm:text-lg max-w-md">Stop doom-scrolling tutorials. We generate a structured 2-week sprint with exact resources to close your skill gaps efficiently.</p>
                     </div>
                     <div className="absolute right-0 bottom-0 w-1/2 h-full bg-indigo-500/10 blur-[60px] sm:blur-[100px]"></div>
                     <div className="absolute -right-10 -bottom-10 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 hidden sm:block">
                        {/* Abstract shapes representing a plan */}
                        <div className="w-48 sm:w-64 h-36 sm:h-48 bg-slate-900 border border-slate-700 rounded-tl-3xl p-4 sm:p-6">
                           <div className="space-y-3">
                              <div className="h-4 w-32 bg-slate-700 rounded"></div>
                              <div className="h-2 w-full bg-slate-800 rounded"></div>
                              <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Tall Card */}
                  <div className="md:row-span-2 bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                     </div>
                     <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">AI Role-Play</h3>
                     <p className="text-slate-400 mb-8 text-sm sm:text-base">Practice technical and behavioral questions with an AI that mimics your target hiring manager.</p>

                     <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                           <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex items-center space-x-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                              <div className="h-2 w-20 sm:w-24 bg-slate-700 rounded"></div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Small Card */}
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 hover:bg-white/5 transition-all">
                     <Code className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-4" />
                     <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Project Generator</h3>
                     <p className="text-slate-400 text-sm">Don't have experience? We generate portfolio project ideas with full tech specs.</p>
                  </div>

                  {/* Small Card */}
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 hover:bg-white/5 transition-all">
                     <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-4" />
                     <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Market Trends</h3>
                     <p className="text-slate-400 text-sm">Real-time salary data and skill demand analysis for your role.</p>
                  </div>
               </div>
            </div>
         </section>



         {/* --- CTA --- */}
         <section className="py-16 sm:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
                  <div className="relative z-10">
                     <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Ready to accelerate your career?</h2>
                     <p className="text-indigo-100 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">Join thousands of professionals who are landing their dream jobs faster with CareerPilot.</p>
                     <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto bg-white text-indigo-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl"
                     >
                        Build My Career Plan
                     </button>
                  </div>

                  {/* Background patterns */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-10">
                     <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                     </svg>
                  </div>
               </div>
            </div>
         </section>

         {/* --- Footer --- */}
         <footer className="py-12 border-t border-white/10 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8 mb-12">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-4">
                     <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-xl font-bold text-white">CareerPilot</span>
                  </div>
                  <p className="text-slate-400 max-w-sm text-sm sm:text-base">
                     Your autonomous AI career operating system. Analyze, plan, and practice your way to success.
                  </p>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4">Product</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                     <li><a href="#" className="hover:text-indigo-400">Resume Analyzer</a></li>
                     <li><a href="#" className="hover:text-indigo-400">Learning Plans</a></li>
                     <li><a href="#" className="hover:text-indigo-400">Interview Simulator</a></li>
                     <li><a href="#" className="hover:text-indigo-400">Job Scanner</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                     <li><a href="#" className="hover:text-indigo-400">Privacy Policy</a></li>
                     <li><a href="#" className="hover:text-indigo-400">Terms of Service</a></li>
                     <li><a href="#" className="hover:text-indigo-400">Cookie Policy</a></li>
                  </ul>
               </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
               <p>&copy; {new Date().getFullYear()} CareerPilot AI. All rights reserved.</p>
               <div className="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" className="hover:text-white"><Globe className="w-4 h-4" /></a>
                  <a href="#" className="hover:text-white"><Lock className="w-4 h-4" /></a>
               </div>
            </div>
         </footer>
      </div>
   );
};

// Helper Icon for play button
const PlayCircleIcon = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
   </svg>
);

export default LandingPage;
//end of code
