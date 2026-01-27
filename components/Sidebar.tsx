import { BookOpen, Code, Compass, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Trash2, TrendingUp, X } from 'lucide-react';
import React, { useState } from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  onSwitchTrack: () => void;
  onResetData: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, onSwitchTrack, onResetData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.PLAN, label: 'Learning Plan', icon: BookOpen },
    { id: AppView.PROJECTS, label: 'Build Portfolio', icon: Code },
    { id: AppView.RESUME, label: 'Resume Architect', icon: FileText },
    { id: AppView.INTERVIEW, label: 'Interview Prep', icon: MessageSquare },
  ];

  const handleMenuClick = (view: AppView) => {
    onChangeView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-950 border-b border-slate-800 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-100 tracking-tight">CareerPilot</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex
      `}>
        {/* Desktop Logo Area (Hidden on Mobile) */}
        <div className="hidden md:flex p-6 border-b border-slate-800 items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-100 tracking-tight">CareerPilot</span>
        </div>

        {/* Adjust spacing for mobile header */}
        <div className="md:hidden h-16" />

        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
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

        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950">
          <button
            onClick={() => {
              onSwitchTrack();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-900/50 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300 transition-colors border border-dashed border-emerald-500/30"
          >
            <Compass className="w-5 h-5" />
            <span className="font-medium text-sm">Explore New Role</span>
          </button>

          <button
            onClick={() => {
              onLogout();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => {
              onResetData();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-900/10 hover:text-red-400 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile when menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
