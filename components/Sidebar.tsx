
import { BookOpen, Briefcase, Code, Compass, FileText, LayoutDashboard, LogOut, MessageSquare, Trash2, TrendingUp } from 'lucide-react';
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  onSwitchTrack: () => void;
  onResetData: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, onSwitchTrack, onResetData }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.PLAN, label: 'Learning Plan', icon: BookOpen },
    { id: AppView.PROJECTS, label: 'Build Portfolio', icon: Code },
    { id: AppView.RESUME, label: 'Resume Architect', icon: FileText },

    { id: AppView.INTERVIEW, label: 'Interview Prep', icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-slate-950 h-screen border-r border-slate-800 flex flex-col hidden md:flex fixed left-0 top-0 z-40 overflow-y-auto">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-100 tracking-tight">CareerPilot</span>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onSwitchTrack}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-900/50 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300 transition-colors border border-dashed border-emerald-500/30"
        >
          <Compass className="w-5 h-5" />
          <span className="font-medium text-sm">Explore New Role</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>

        <button
          onClick={onResetData}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-900/10 hover:text-red-400 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset Progress</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
