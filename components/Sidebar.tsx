import { BookOpen, Code, Compass, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Trash2, TrendingUp, X } from 'lucide-react';
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
  ];

  return (
    <div className="hidden md:flex fixed top-0 left-0 z-50 h-screen w-64 bg-white/60 backdrop-blur-2xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Logo Area */}
      <div className="flex p-6 border-b border-[#e3e1dc] items-center space-x-3 bg-zinc-200/10">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-[#e3e1dc] p-0.5">
          <img src="/logo.png" alt="CareerPilot Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold text-zinc-900 tracking-tight">CareerPilot</span>
      </div>

      <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pt-8">
        <div className="px-2 mb-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2 mb-2">Main Menu</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden cursor-pointer border-0 ${currentView === item.id
              ? 'bg-white text-zinc-900 font-bold border border-[#e3e1dc] shadow-sm'
              : 'text-zinc-550 hover:bg-white/50 hover:text-zinc-900 bg-transparent'
              }`}
          >
            <item.icon className={`w-4.5 h-4.5 transition-colors duration-200 ${currentView === item.id ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-650'}`} />
            <span className="text-[13px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-2 border-t border-[#e3e1dc]">
        <div className="px-2 mb-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2 mb-2">Tools</p>
        </div>

        <button
          onClick={onSwitchTrack}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-all border border-[#e3e1dc] group shadow-sm cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-500 group-hover:text-zinc-700 transition-colors">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs">Explore Roles</span>
        </button>

        <button
          onClick={onOpenFeedback}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-550 hover:bg-white/50 hover:text-zinc-900 transition-colors text-[13px] cursor-pointer border-0 bg-transparent"
        >
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <span className="font-medium">Send Feedback</span>
        </button>

        <div className="h-px bg-[#e3e1dc] my-2"></div>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-550 hover:bg-white/50 hover:text-zinc-900 transition-colors text-[13px] cursor-pointer border-0 bg-transparent"
        >
          <LogOut className="w-4 h-4 text-zinc-450" />
          <span className="font-medium">Sign Out</span>
        </button>

        <button
          onClick={onResetData}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:bg-red-500/5 hover:text-red-600 transition-all text-[13px] group cursor-pointer border-0 bg-transparent"
        >
          <Trash2 className="w-4 h-4 text-zinc-455 group-hover:text-red-500 group-hover:animate-pulse" />
          <span className="font-medium">Reset Progress</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
