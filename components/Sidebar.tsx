import { BookOpen, Code, Compass, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Trash2, TrendingUp, X, Briefcase } from 'lucide-react';
import React, { useState } from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  onSwitchTrack: () => void;
  onResetData: () => void;
  onOpenFeedback: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, onSwitchTrack, onResetData, onOpenFeedback }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.PLAN, label: 'Learning Plan', icon: BookOpen },
    { id: AppView.PROJECTS, label: 'Build Portfolio', icon: Code },
    { id: AppView.RESUME, label: 'Resume Architect', icon: FileText },
    { id: AppView.INTERVIEW, label: 'Interview Prep', icon: MessageSquare },
    { id: AppView.JOBS, label: 'Job Hub', icon: Briefcase },
  ];

  return (
    <div className="hidden md:flex fixed top-0 left-0 z-50 h-screen w-64 bg-zinc-950 border-r border-zinc-800/60 flex-col shadow-2xl">
      {/* Desktop Logo Area */}
      <div className="flex p-6 border-b border-zinc-800 items-center space-x-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-violet-500/20 flex items-center justify-center">
          <img src="/logo.png" alt="CareerPilot Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">CareerPilot</span>
      </div>

      <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pt-8">
        <div className="px-2 mb-2">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-2 mb-2">Main Menu</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${currentView === item.id
              ? 'bg-violet-500/10 text-white border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
              : 'text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-200 border border-transparent'
              }`}
          >
            {/* Active Indicator Bar */}
            {currentView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full shadow-[0_0_10px_#8b5cf6]"></div>
            )}

            <item.icon className={`w-5 h-5 transition-colors duration-300 ${currentView === item.id ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className={`font-medium tracking-wide ${currentView === item.id ? 'text-white' : ''}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-2 bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-900/50">
        <div className="px-2 mb-1">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-2 mb-2">Tools</p>
        </div>

        <button
          onClick={onSwitchTrack}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all border border-zinc-800/50 hover:border-zinc-700 group"
        >
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-zinc-800 transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Explore Roles</span>
        </button>

        <button
          onClick={onOpenFeedback}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send Feedback</span>
        </button>

        <div className="h-px bg-zinc-900 my-2"></div>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <button
          onClick={onResetData}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-red-950/10 hover:text-red-400 transition-all text-sm group"
        >
          <Trash2 className="w-4 h-4 group-hover:animate-pulse" />
          <span>Reset Progress</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
