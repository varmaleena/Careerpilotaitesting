import React, { useState } from 'react';
import {
   ArrowRight, CheckCircle2, TrendingUp, Shield,
   FileText, Users, Star, ChevronDown, ChevronRight,
   Menu, X, Lock, Mail, Linkedin, Twitter, Github, Instagram,
   Target, Sparkles, BookOpen, Mic, Play
} from 'lucide-react';

interface LandingPageProps {
   onGetStarted: () => void;
   onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [openFaq, setOpenFaq] = useState<number | null>(null);

   const scrollToSection = (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
   };

   return (
      <div className="min-h-screen bg-[#09090b] text-white font-['Inter',sans-serif]">
         {/* --- Navigation --- */}
         <nav className="fixed top-0 w-full z-50 bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-800/50">
            <div className="max-w-[1200px] mx-auto px-6">
               <div className="h-16 flex items-center justify-between">
                  {/* Logo */}
                  <a href="#" className="flex items-center gap-2.5 group">
                     <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                        <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
                     </div>
                     <span className="text-base font-semibold tracking-tight">CareerPilot</span>
                  </a>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center gap-1">
                     {['Features', 'How it works'].map((item) => (
                        <button
                           key={item}
                           onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                           className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800/50"
                        >
                           {item}
                        </button>
                     ))}
                  </div>

                  {/* Desktop CTA */}
                  <div className="hidden md:flex items-center gap-3">
                     <button
                        onClick={onLogin}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                     >
                        Sign in
                     </button>
                     <button
                        onClick={onGetStarted}
                        className="bg-white text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors"
                     >
                        Get Started
                     </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                     className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
                  >
                     {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
               </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
               <div className="md:hidden bg-[#09090b] border-t border-zinc-800/50">
                  <div className="px-6 py-4 space-y-1">
                     {['Features', 'How it works'].map((item) => (
                        <button
                           key={item}
                           onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                           className="block w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                           {item}
                        </button>
                     ))}
                  </div>
                  <div className="px-6 pb-4 pt-2 border-t border-zinc-800/50 space-y-2">
                     <button onClick={onLogin} className="block w-full text-left px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
                        Sign in
                     </button>
                     <button onClick={onGetStarted} className="w-full bg-white text-zinc-900 py-2.5 rounded-lg text-sm font-medium">
                        Get Started
                     </button>
                  </div>
               </div>
            )}
         </nav>

         {/* --- Hero Section --- */}
         <section className="pt-28 pb-16 md:pt-36 md:pb-20 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative">
               <div className="max-w-[800px] mx-auto text-center">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-4 py-2 mb-8">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                     </span>
                     <span className="text-sm text-zinc-400 font-medium">Your AI Career Coach</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                     Land your dream job
                     <br />
                     <span className="text-violet-400">faster with AI</span>
                  </h1>

                  {/* Subheadline */}
                  <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-[560px] mx-auto leading-relaxed">
                     Instant resume feedback, skill roadmaps, and mock interviews. Everything you need in one career coach.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                     <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto bg-violet-500 hover:bg-violet-400 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                     >
                        Analyze My Resume
                        <ArrowRight className="w-4 h-4" />
                     </button>
                     <button
                        onClick={() => scrollToSection('how-it-works')}
                        className="w-full sm:w-auto text-zinc-300 hover:text-white px-8 py-3.5 rounded-xl font-medium text-base transition-colors border border-zinc-700 hover:border-zinc-600 flex items-center justify-center gap-2"
                     >
                        <Play className="w-4 h-4" />
                        See how it works
                     </button>
                  </div>

                  {/* Minimal trust signals */}
                  <p className="text-sm text-zinc-600">
                     Free to start · No credit card required
                  </p>
               </div>
            </div>
         </section>

         {/* --- Features Section --- */}
         <section id="features" className="py-16 md:py-20 border-t border-zinc-800/50">
            <div className="max-w-[1200px] mx-auto px-6">
               {/* Section Header */}
               <div className="text-center mb-12 max-w-[600px] mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                     Everything you need to succeed
                  </h2>
                  <p className="text-zinc-400 text-lg">
                     A complete toolkit designed to accelerate your career growth
                  </p>
               </div>

               {/* Features Grid */}
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                     {
                        icon: <FileText className="w-5 h-5" />,
                        title: "Resume Analysis",
                        desc: "Get detailed AI feedback on your resume with specific, actionable improvements.",
                        color: "violet"
                     },
                     {
                        icon: <BookOpen className="w-5 h-5" />,
                        title: "Learning Paths",
                        desc: "Personalized 2-week learning plans with curated courses and resources.",
                        color: "blue"
                     },
                     {
                        icon: <Target className="w-5 h-5" />,
                        title: "Portfolio Projects",
                        desc: "AI-generated project ideas with complete technical specifications.",
                        color: "purple"
                     },
                     {
                        icon: <Mic className="w-5 h-5" />,
                        title: "Mock Interviews",
                        desc: "Practice with an AI interviewer that adapts to your target role.",
                        color: "amber"
                     },
                     {
                        icon: <Sparkles className="w-5 h-5" />,
                        title: "Resume Builder",
                        desc: "Create ATS-optimized resumes tailored to specific job descriptions.",
                        color: "pink"
                     },
                     {
                        icon: <TrendingUp className="w-5 h-5" />,
                        title: "Progress Tracking",
                        desc: "Monitor your readiness score and track your improvement over time.",
                        color: "cyan"
                     }
                  ].map((feature, idx) => {
                     const colorMap: Record<string, string> = {
                        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                     };
                     return (
                        <div
                           key={idx}
                           className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/30 transition-all duration-300"
                        >
                           <div className={`w-12 h-12 rounded-xl ${colorMap[feature.color]} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                              {feature.icon}
                           </div>
                           <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                           <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                     );
                  })}
               </div>
            </div>
         </section>

         {/* --- How It Works --- */}
         <section id="how-it-works" className="py-16 md:py-20 bg-zinc-900/30 border-t border-zinc-800/50">
            <div className="max-w-[1200px] mx-auto px-6">
               {/* Section Header */}
               <div className="text-center mb-12 max-w-[600px] mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                     How it works
                  </h2>
                  <p className="text-zinc-400 text-lg">
                     From upload to job-ready in three simple steps
                  </p>
               </div>

               {/* Steps */}
               <div className="grid md:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
                  {[
                     {
                        step: "01",
                        title: "Upload & Analyze",
                        desc: "Upload your resume and tell us your target role. Our AI analyzes your profile against industry standards.",
                        icon: <FileText className="w-6 h-6" />
                     },
                     {
                        step: "02",
                        title: "Learn & Build",
                        desc: "Get a personalized learning plan with curated resources and build portfolio-ready projects.",
                        icon: <BookOpen className="w-6 h-6" />
                     },
                     {
                        step: "03",
                        title: "Practice & Apply",
                        desc: "Master interviews with AI practice sessions and apply with confidence to matching jobs.",
                        icon: <Target className="w-6 h-6" />
                     }
                  ].map((item, idx) => (
                     <div key={idx} className="relative text-center">
                        {/* Step Icon */}
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-6 mx-auto">
                           {item.icon}
                        </div>

                        {/* Content */}
                        <div className="text-sm text-violet-500 font-semibold mb-2 tracking-wide">STEP {item.step}</div>
                        <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                        <p className="text-zinc-400 text-base leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>

                        {/* Connector */}
                        {idx < 2 && (
                           <div className="hidden md:block absolute top-8 -right-4">
                              <ChevronRight className="w-5 h-5 text-zinc-700" />
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </section>



         {/* --- CTA Section --- */}
         <section className="py-16 md:py-20 border-t border-zinc-800/50">
            <div className="max-w-[700px] mx-auto px-6 text-center">
               <h2 className="text-3xl md:text-4xl font-bold mb-5">
                  Ready to get started?
               </h2>
               <p className="text-zinc-400 text-lg mb-8 max-w-[500px] mx-auto">
                  Upload your resume and get personalized feedback in minutes.
               </p>
               <button
                  onClick={onGetStarted}
                  className="bg-violet-500 hover:bg-violet-400 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
               >
                  Get Started for Free
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>
         </section>

         {/* --- Footer --- */}
         <footer className="py-12 border-t border-zinc-800/50">
            <div className="max-w-[1200px] mx-auto px-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-8">
                  {/* Brand */}
                  <div className="col-span-2 md:col-span-1">
                     <a href="#" className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                           <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-base font-semibold">CareerPilot</span>
                     </a>
                     <p className="text-zinc-500 text-sm mb-6 leading-relaxed max-w-[250px]">
                        Your AI-powered career platform. Analyze, learn, and practice your way to success.
                     </p>
                     <div className="flex items-center gap-4">
                        <a href="https://instagram.com/careerpilot_ai" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors">
                           <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-zinc-600 hover:text-white transition-colors">
                           <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-zinc-600 hover:text-white transition-colors">
                           <Linkedin className="w-5 h-5" />
                        </a>
                     </div>
                  </div>

                  {/* Product */}
                  <div>
                     <h4 className="text-sm font-semibold mb-4 text-zinc-300">Product</h4>
                     <ul className="space-y-3">
                        {['Resume Analyzer', 'Learning Plans', 'Mock Interviews'].map((item) => (
                           <li key={item}>
                              <a href="#features" className="text-zinc-500 text-sm hover:text-white transition-colors">{item}</a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Legal */}
                  <div>
                     <h4 className="text-sm font-semibold mb-4 text-zinc-300">Legal</h4>
                     <ul className="space-y-3">
                        {['Privacy Policy', 'Terms of Service'].map((item) => (
                           <li key={item}>
                              <a href="#" className="text-zinc-500 text-sm hover:text-white transition-colors">{item}</a>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Bottom Bar */}
               <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-zinc-600 text-sm">
                     © {new Date().getFullYear()} CareerPilot AI. All rights reserved.
                  </p>
                  <div className="flex items-center gap-2 text-zinc-500">
                     <Mail className="w-4 h-4" />
                     <a href="mailto:careerpilotai.official@gmail.com" className="text-sm hover:text-white transition-colors">
                        careerpilotai.official@gmail.com
                     </a>
                  </div>
               </div>
            </div>
         </footer>
      </div>
   );
};

export default LandingPage;
