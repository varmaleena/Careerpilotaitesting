import React, { useState, useRef } from 'react';
import {
   ArrowRight, CheckCircle2, TrendingUp, Shield,
   FileText, Users, Star, ChevronRight, ChevronDown,
   Menu, X, Lock, Mail, Linkedin, Twitter, Github, Instagram,
   Target, Sparkles, BookOpen, Mic, Play, UploadCloud, Eye
} from 'lucide-react';

interface LandingPageProps {
   onGetStarted: () => void;
   onLogin: () => void;
   onUploadResume?: (file: File, targetRole: string) => Promise<void>;
   isAnalyzing?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onUploadResume, isAnalyzing }) => {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [openFaq, setOpenFaq] = useState<number | null>(null);
   const [roleInput, setRoleInput] = useState('');
   const [isDragging, setIsDragging] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const scrollToSection = (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         triggerUpload(file);
      }
   };

   const triggerUpload = (file: File) => {
      const targetRole = roleInput.trim() || 'Software Engineer';
      if (onUploadResume) {
         onUploadResume(file, targetRole);
      }
   };

   const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
   };

   const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
   };

   const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
         triggerUpload(file);
      }
   };

   const faqs = [
      {
         q: "How does the AI analyze my resume?",
         a: "Our system parses your resume text and compares it against real-time industry keywords, company hiring bars, and target role templates to generate a structured compatibility score."
      },
      {
         q: "Is my resume data secure?",
         a: "Absolutely. All resume contents and profile details are encrypted in transit and stored securely in Firebase database containers. Your data is never sold or used to train public models."
      },
      {
         q: "What target roles are supported?",
         a: "We support any technical or non-technical role—from Software Engineers and Product Managers to Designers and Data Analysts. The AI adapts the skills analysis based on your target role."
      },
      {
         q: "How do mock interviews work?",
         a: "The AI conducts a real-time conversational interview based on your resume and target role, offering instant verbal feedback and a breakdown of communication, problem-solving, and time management."
      }
   ];

   return (
      <div className="min-h-screen bg-[#f5f4f2] text-zinc-800 font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-black selection:text-white overflow-x-hidden relative">
         
         {/* --- Full Screen Analyzing Loader --- */}
         {isAnalyzing && (
            <div className="fixed inset-0 bg-[#f5f4f2]/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
               <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin mb-4" />
               <h3 className="text-sm font-bold text-zinc-900">Analyzing your resume...</h3>
               <p className="text-xs text-zinc-550 mt-1">Extracting skills and calculating compatibility.</p>
            </div>
         )}

         {/* --- Decorative Glowing Orbs & Faint Grid --- */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#e3e1dc_1px,transparent_1px),linear-gradient(to_bottom,#e3e1dc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-40 pointer-events-none -z-10" />
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
         <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
         <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-fuchsia-500/3 rounded-full blur-[130px] pointer-events-none -z-10" />

         {/* --- Navigation --- */}
         <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-[#e3e1dc] transition-all duration-300">
            <div className="max-w-[1200px] mx-auto px-6">
               <div className="h-16 flex items-center justify-between">
                  {/* Logo */}
                  <a href="#" className="flex items-center gap-3 group">
                     <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-[#e3e1dc] p-0.5 transition-transform group-hover:scale-105">
                        <img src="/logo.png" alt="CareerPilot Logo" className="w-full h-full object-contain" />
                     </div>
                     <span className="text-base font-semibold tracking-tight text-zinc-900">CareerPilot</span>
                  </a>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center gap-1 bg-zinc-200/50 border border-[#e3e1dc] p-0.5 rounded-full">
                     {['Features', 'How it works', 'FAQ'].map((item) => (
                        <button
                           key={item}
                           onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                           className="px-4 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-all rounded-full hover:bg-white/50 cursor-pointer"
                        >
                           {item}
                        </button>
                     ))}
                  </div>

                  {/* Desktop CTA */}
                  <div className="hidden md:flex items-center gap-4">
                     <button
                        onClick={onLogin}
                        className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                     >
                        Sign in
                     </button>
                     <button
                        onClick={onGetStarted}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow cursor-pointer border-0"
                     >
                        Get Started
                     </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                     className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg border border-[#e3e1dc] bg-white"
                  >
                     {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
               </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
               <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-[#e3e1dc] shadow-lg animate-[fadeIn_0.15s_ease-out]">
                  <div className="px-6 py-3 space-y-0.5">
                     {['Features', 'How it works', 'FAQ'].map((item) => (
                        <button
                           key={item}
                           onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                           className="block w-full text-left px-3 py-2 text-sm font-medium text-zinc-655 hover:text-zinc-950 hover:bg-zinc-950/5 rounded-lg transition-all"
                        >
                           {item}
                        </button>
                     ))}
                  </div>
                  <div className="px-6 pb-5 pt-2 border-t border-[#e3e1dc] space-y-2">
                     <button onClick={onLogin} className="block w-full text-center py-2.5 text-xs font-semibold text-zinc-550 hover:text-zinc-950 transition-colors">
                        Sign in
                     </button>
                     <button onClick={onGetStarted} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-xs font-semibold border-0">
                        Get Started
                     </button>
                  </div>
               </div>
            )}
         </nav>

         {/* --- Hero Section (Dual-Column Layout) --- */}
         <section className="pt-28 pb-16 md:pt-36 md:pb-24">
            <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
               
               {/* Left Column - Content & Upload */}
               <div className="md:col-span-6 flex flex-col justify-center text-left">
                  <div className="inline-flex items-center gap-2 bg-zinc-200/50 border border-[#e3e1dc] rounded-full px-3 py-1 mb-6 shadow-sm w-fit">
                     <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                     <span className="text-[10px] text-zinc-650 font-bold tracking-widest uppercase">Your AI Career Coach</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-zinc-900 mb-6">
                     Land your dream job
                     <br />
                     <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">smarter with AI.</span>
                  </h1>

                  <p className="text-sm sm:text-base text-zinc-600 mb-8 max-w-[480px] leading-relaxed font-light">
                     Instant resume feedback, custom roadmaps, development templates, and real-time verbal interview preparation.
                  </p>

                  {/* Target Role Input */}
                  <div className="mb-4 max-w-[400px]">
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Target Job Role</label>
                     <input
                        type="text"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="e.g. Software Engineer, Product Manager..."
                        className="w-full bg-white border border-[#e3e1dc] rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-400 transition-all font-medium text-zinc-900 shadow-sm"
                     />
                  </div>

                  {/* Real File Upload Drag Zone */}
                  <div
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current?.click()}
                     className={`max-w-[400px] border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-300 group shadow-sm ${
                        isDragging
                           ? 'border-zinc-900 bg-zinc-100/80 scale-[1.02]'
                           : 'border-[#e3e1dc] hover:border-zinc-450 bg-white hover:bg-zinc-50'
                     }`}
                  >
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.doc,.docx"
                        className="hidden"
                     />
                     <UploadCloud className={`w-6 h-6 mx-auto mb-2 transition-all ${isDragging ? 'text-zinc-900 scale-110' : 'text-zinc-400 group-hover:-translate-y-0.5'}`} />
                     <div className="text-xs font-bold text-zinc-850 mb-0.5">
                        {isDragging ? 'Drop your resume here to analyze' : 'Drag & drop your resume PDF here'}
                     </div>
                     <div className="text-[10px] text-zinc-500">or click to browse files (PDF, TXT, DOCX)</div>
                  </div>
               </div>

               {/* Right Column - Clean Solid Score & Action Console */}
               <div className="md:col-span-6">
                  <div className="bg-white border border-[#e3e1dc] rounded-2xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] relative overflow-hidden">
                     {/* Console Profile Header */}
                     <div className="flex items-center justify-between pb-4 border-b border-[#e3e1dc] mb-5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-zinc-100 border border-[#e3e1dc] flex items-center justify-center font-bold text-xs text-zinc-655">
                              JD
                           </div>
                           <div>
                              <h4 className="text-xs font-bold text-zinc-900">John Doe</h4>
                              <p className="text-[10px] text-zinc-500">Dreaming of: Frontend Architect</p>
                           </div>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600 bg-zinc-100 border border-[#e3e1dc] px-2 py-0.5 rounded-full">
                           Draft Mode
                        </span>
                     </div>

                     {/* Profile Stats */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-xs text-zinc-550 font-medium">Readiness Score</span>
                           <span className="text-xs font-bold text-zinc-900">82%</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                           <div className="bg-zinc-900 h-full rounded-full w-[82%]" />
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                           <div className="border border-[#e3e1dc] rounded-lg p-2.5 bg-zinc-50/50 shadow-sm">
                              <div className="text-xs font-bold text-zinc-900">2 Weeks</div>
                              <div className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Roadmap</div>
                           </div>
                           <div className="border border-[#e3e1dc] rounded-lg p-2.5 bg-zinc-50/50 shadow-sm">
                              <div className="text-xs font-bold text-zinc-900">9 Skills</div>
                              <div className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Detected</div>
                           </div>
                           <div className="border border-[#e3e1dc] rounded-lg p-2.5 bg-zinc-50/50 shadow-sm">
                              <div className="text-xs font-bold text-zinc-900">Active</div>
                              <div className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Streaks</div>
                           </div>
                        </div>

                        <div className="border border-[#e3e1dc] rounded-lg p-3.5 bg-zinc-50/50">
                           <h5 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Target Skills</h5>
                           <div className="flex flex-wrap gap-1.5">
                              {['React', 'TypeScript', 'Tailwind', 'Redux', 'System Design'].map((skill, i) => (
                                 <span key={skill} className={`text-[10px] font-medium px-2 py-0.5 border rounded-full ${i === 4 ? 'bg-transparent text-zinc-400 border-zinc-300 border-dashed' : 'bg-white text-zinc-700 border-[#e3e1dc] shadow-sm'}`}>
                                    {skill} {i === 4 && ' (missing)'}
                                 </span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </section>         {/* --- Features Section (Bento Grid) --- */}
         <section id="features" className="py-20 border-t border-[#e3e1dc] bg-[#edebe9]/20">
            <div className="max-w-[1200px] mx-auto px-6">
               
               {/* Section Header */}
               <div className="text-left mb-12 max-w-[600px]">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">THE TOOLKIT</span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-3">
                     Everything you need in one place
                  </h2>
                  <p className="text-zinc-600 text-sm font-light leading-relaxed">
                     An integrated ecosystem to upgrade your resume, plan target skills, and practice speech.
                  </p>
               </div>

               {/* Bento Grid Layout */}
               <div className="grid md:grid-cols-12 gap-6">
                  
                  {/* Bento Box 1: Resume Analysis */}
                  <div className="md:col-span-8 group border border-[#e3e1dc] rounded-2xl bg-white p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-zinc-350">
                     <div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-[#e3e1dc] flex items-center justify-center mb-4 shadow-sm">
                           <FileText className="w-4 h-4 text-zinc-655" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 mb-1">Resume Analyzer</h3>
                        <p className="text-zinc-600 text-xs font-light max-w-[420px] mb-4">
                           Grade your alignment with top industries. Discover missing keywords and get actionable copy-paste advice.
                        </p>
                     </div>
                     <div className="border border-[#e3e1dc] rounded-xl bg-zinc-50/50 p-4 shadow-sm">
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#e3e1dc] mb-3 text-[10px]">
                           <span className="font-bold text-zinc-550">AI IMPROVEMENTS</span>
                           <span className="text-zinc-500">3 critical issues</span>
                        </div>
                        <ul className="text-xs text-zinc-600 space-y-2">
                           <li className="flex items-start gap-2">
                              <span className="text-zinc-400 font-bold">•</span>
                              <span>Change "Helped team build widgets" to "Built and optimized 12 critical UI widgets using React/TS."</span>
                           </li>
                           <li className="flex items-start gap-2">
                              <span className="text-zinc-400 font-bold">•</span>
                              <span>Mention concrete metrics: e.g. "Reduced bundle load size by 35%."</span>
                           </li>
                        </ul>
                     </div>
                  </div>

                  {/* Bento Box 2: Interview Prep */}
                  <div className="md:col-span-4 group border border-[#e3e1dc] rounded-2xl bg-white p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-zinc-350">
                     <div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-[#e3e1dc] flex items-center justify-center mb-4 shadow-sm">
                           <Mic className="w-4 h-4 text-zinc-655" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 mb-1">AI Interviewer</h3>
                        <p className="text-zinc-600 text-xs font-light mb-4">
                           Practice responding verbally. Adapt based on mock company structures.
                        </p>
                     </div>
                     <div className="border border-[#e3e1dc] rounded-xl bg-zinc-50/50 p-3 text-center shadow-sm">
                        <div className="flex justify-center gap-1 mb-2.5">
                           {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 3, 1].map((h, i) => (
                              <div key={i} className="w-0.5 bg-zinc-400 rounded-full" style={{ height: `${h * 4}px` }} />
                           ))}
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Listening...</span>
                     </div>
                  </div>

                  {/* Bento Box 3: PDF Resume Export */}
                  <div className="md:col-span-4 group border border-[#e3e1dc] rounded-2xl bg-white p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-zinc-350">
                     <div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-[#e3e1dc] flex items-center justify-center mb-4 shadow-sm">
                           <Sparkles className="w-4 h-4 text-zinc-655" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 mb-1">LaTeX Builder</h3>
                        <p className="text-zinc-600 text-xs font-light mb-4">
                           Generate professional LaTeX templates optimized for ATS parsers.
                        </p>
                     </div>
                     <button
                        onClick={onGetStarted}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold py-2 border-0 rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                     >
                        Export Resume
                     </button>
                  </div>

                  {/* Bento Box 4: Learning Path */}
                  <div className="md:col-span-8 group border border-[#e3e1dc] rounded-2xl bg-white p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-zinc-350">
                     <div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-[#e3e1dc] flex items-center justify-center mb-4 shadow-sm">
                           <BookOpen className="w-4 h-4 text-zinc-655" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 mb-1">Actionable Roadmaps</h3>
                        <p className="text-zinc-600 text-xs font-light max-w-[420px] mb-4">
                           Receive a structured 2-week plan complete with curated reading resources, exercises, and project goals.
                        </p>
                     </div>
                     <div className="border border-[#e3e1dc] rounded-xl bg-zinc-50/50 p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-655 border border-[#e3e1dc]">
                              1
                           </div>
                           <div className="flex-1">
                              <div className="text-xs font-bold text-zinc-900">Redis & Cache Invalidation</div>
                              <div className="text-[10px] text-zinc-500 font-light">Read Cache-Aside patterns & code middleware</div>
                           </div>
                           <span className="text-[10px] font-semibold text-zinc-550">Week 1</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* --- How It Works Section --- */}
         <section id="how-it-works" className="py-20 bg-[#edebe9]/30 border-t border-[#e3e1dc] relative">
            <div className="max-w-[1200px] mx-auto px-6">
               
               {/* Section Header */}
               <div className="text-center mb-12 max-w-[650px] mx-auto">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">Simple Workflow</span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-3">
                     From upload to job-ready
                  </h2>
                  <p className="text-zinc-650 text-sm font-light leading-relaxed">
                     Prep your credentials, upskill your profile, and nail interviews.
                  </p>
               </div>

               {/* Steps Grid */}
               <div className="grid lg:grid-cols-3 gap-6 max-w-[900px] mx-auto relative">
                  {[
                     {
                        step: "01",
                        title: "Upload & Analyze",
                        desc: "Upload your resume and select your target role. Our AI scans and grades your profile instantly.",
                        icon: <FileText className="w-5 h-5" />
                     },
                     {
                        step: "02",
                        title: "Learn & Build",
                        desc: "Access custom learning tracks to patch missing skills and build expert-level portfolio projects.",
                        icon: <BookOpen className="w-5 h-5" />
                     },
                     {
                        step: "03",
                        title: "Practice & Apply",
                        desc: "Complete verbal and technical mock interviews to gain confidence, then apply with certified skills.",
                        icon: <Target className="w-5 h-5" />
                     }
                  ].map((item, idx) => (
                     <div key={idx} className="relative text-center group bg-white border border-[#e3e1dc] rounded-2xl p-6 hover:shadow-lg transition-all">
                        {/* Step Icon */}
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 border border-[#e3e1dc] text-zinc-600 mb-5 mx-auto group-hover:scale-105 transition-transform shadow-sm">
                           {item.icon}
                        </div>

                        {/* Content */}
                        <div className="text-[10px] text-zinc-500 font-bold mb-1.5 tracking-widest uppercase">STEP {item.step}</div>
                        <h3 className="text-base font-bold text-zinc-900 mb-2">{item.title}</h3>
                        <p className="text-zinc-650 text-xs leading-relaxed font-light max-w-[240px] mx-auto">{item.desc}</p>

                        {/* Connector (Desktop Only) */}
                        {idx < 2 && (
                           <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-4 z-10 bg-white border border-[#e3e1dc] p-1 rounded-full shadow-sm">
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* --- FAQ Section --- */}
         <section id="faq" className="py-20 border-t border-[#e3e1dc] bg-[#edebe9]/20">
            <div className="max-w-[800px] mx-auto px-6">
               <div className="text-center mb-12">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">FAQS</span>
                  <h2 className="text-2xl md:text-4xl font-bold text-zinc-900 tracking-tight">
                     Frequently Asked Questions
                  </h2>
               </div>

               <div className="space-y-3.5">
                  {faqs.map((faq, index) => {
                     const isOpen = openFaq === index;
                     return (
                        <div key={index} className="border border-[#e3e1dc] rounded-xl overflow-hidden bg-white shadow-sm">
                           <button
                              onClick={() => setOpenFaq(isOpen ? null : index)}
                              className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer border-0 bg-transparent"
                           >
                              <span>{faq.q}</span>
                              {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-450" /> : <ChevronRight className="w-4 h-4 text-zinc-450" />}
                           </button>
                           {isOpen && (
                              <div className="px-4 pb-4 pt-0 text-xs text-zinc-655 leading-relaxed font-light border-t border-[#e3e1dc] animate-[fadeIn_0.2s_ease-out]">
                                 {faq.a}
                              </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         </section>

         {/* --- CTA Section --- */}
         <section className="py-20 border-t border-[#e3e1dc] bg-zinc-250/20 relative overflow-hidden">
            <div className="max-w-[800px] mx-auto px-6 text-center">
               <h2 className="text-2xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                  Ready to level up your prep?
               </h2>
               <p className="text-zinc-655 text-sm font-normal mb-8 max-w-[450px] mx-auto leading-relaxed">
                  Start analyzing your profile, learning crucial skills, and practicing live interviews today.
               </p>
               <button
                  onClick={onGetStarted}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all inline-flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer border-0"
               >
                  Get Started for Free
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>
         </section>

         {/* --- Footer --- */}
         <footer className="py-12 border-t border-[#e3e1dc] bg-[#f0efeb]">
            <div className="max-w-[1200px] mx-auto px-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
                  {/* Brand */}
                  <div className="col-span-2 md:col-span-1">
                     <a href="#" className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-[#e3e1dc] p-0.5">
                           <img src="/logo.png" alt="CareerPilot Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-zinc-900">CareerPilot</span>
                     </a>
                     <p className="text-zinc-600 text-xs mb-5 leading-relaxed max-w-[240px] font-normal">
                        Your personal AI career companion. Analyze, learn, build, and prep your way to your dream role.
                     </p>
                     <div className="flex items-center gap-3">
                        <a href="https://instagram.com/careerpilot_ai" target="_blank" rel="noopener noreferrer" className="text-zinc-550 hover:text-zinc-900 transition-colors">
                           <Instagram className="w-4.5 h-4.5" />
                        </a>
                        <a href="#" className="text-zinc-555 hover:text-zinc-900 transition-colors">
                           <Twitter className="w-4.5 h-4.5" />
                        </a>
                        <a href="#" className="text-zinc-555 hover:text-zinc-900 transition-colors">
                           <Linkedin className="w-4.5 h-4.5" />
                        </a>
                     </div>
                  </div>

                  {/* Product */}
                  <div>
                     <h4 className="text-xs font-semibold mb-3.5 text-zinc-900">Product</h4>
                     <ul className="space-y-2.5 font-normal text-xs">
                        {['Resume Analyzer', 'Learning Plans', 'Mock Interviews'].map((item) => (
                           <li key={item}>
                              <a href="#features" className="text-zinc-555 hover:text-zinc-900 transition-colors">{item}</a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Legal */}
                  <div>
                     <h4 className="text-xs font-semibold mb-3.5 text-zinc-900">Legal</h4>
                     <ul className="space-y-2.5 font-normal text-xs">
                        {['Privacy Policy', 'Terms of Service'].map((item) => (
                           <li key={item}>
                              <a href="#" className="text-zinc-555 hover:text-zinc-900 transition-colors">{item}</a>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Bottom Bar */}
               <div className="pt-6 border-t border-[#e3e1dc] flex flex-col md:flex-row justify-between items-center gap-3">
                  <p className="text-zinc-500 text-[10px] font-normal">
                     © {new Date().getFullYear()} CareerPilot AI. All rights reserved.
                  </p>
                  <div className="flex items-center gap-1.5 text-zinc-555 hover:text-zinc-900 transition-colors">
                     <Mail className="w-3.5 h-3.5" />
                     <a href="mailto:careerpilotai.official@gmail.com" className="text-[10px] font-normal">
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
