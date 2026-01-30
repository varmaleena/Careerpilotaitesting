import React, { useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Code,
    FileText,
    Menu,
    Compass,
    LogOut,
    X,
    MessageSquare,
    TrendingUp, // Assuming this is used for logo or similar in modal header
    Trash2,
    User
} from 'lucide-react';
import { AppView } from '../types';

interface MobileBottomNavProps {
    currentView: AppView;
    onChangeView: (view: AppView) => void;
    onLogout: () => void;
    onSwitchTrack: () => void;
    onResetData: () => void;
    onOpenFeedback: () => void;
    onOpenProfile: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    currentView,
    onChangeView,
    onLogout,
    onSwitchTrack,
    onResetData,
    onOpenFeedback,
    onOpenProfile
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Main navigation items (Features) - 6 Item Layout (5 Core + Menu)
    const navItems = [
        { id: AppView.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
        { id: AppView.PLAN, icon: BookOpen, label: 'Plan' },
        { id: AppView.PROJECTS, icon: Code, label: 'Portfolio' },
        { id: AppView.RESUME, icon: FileText, label: 'Resume' },
        { id: AppView.INTERVIEW, icon: MessageSquare, label: 'Interview' },
    ];

    const handleNavClick = (view: AppView) => {
        onChangeView(view);
        setIsMenuOpen(false); // Close menu if open
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Helper to determine if an item is active
    const isActive = (view: AppView) => currentView === view;

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-50 pb-[env(safe-area-inset-bottom)]">
                <div className="bg-[rgba(10,10,20,0.95)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.05)] h-[65px] flex items-center justify-between px-4">

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className="flex flex-col items-center justify-center w-auto flex-1 h-full space-y-1 relative group"
                        >
                            <item.icon
                                className={`w-5 h-5 transition-all duration-300 ${isActive(item.id)
                                    ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] -translate-y-1'
                                    : 'text-slate-500 opacity-60 group-hover:text-slate-300'
                                    }`}
                            />
                            {/* Tiny Label for clarity since we have many icons now */}
                            <span className={`text-[9px] font-medium transition-all ${isActive(item.id) ? 'text-indigo-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
                                {item.label}
                            </span>

                            {isActive(item.id) && (
                                <div className="absolute top-0 w-8 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(129,140,248,1)] rounded-b-full"></div>
                            )}
                        </button>
                    ))}

                    {/* Menu Button (Slot 5) */}
                    <button
                        onClick={toggleMenu}
                        className="flex flex-col items-center justify-center w-auto flex-1 h-full space-y-1 relative group"
                    >
                        <Menu
                            className={`w-5 h-5 transition-all duration-300 ${isMenuOpen
                                ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] -translate-y-1'
                                : 'text-slate-500 opacity-60 group-hover:text-slate-300'
                                }`}
                        />
                        <span className={`text-[9px] font-medium transition-all ${isMenuOpen ? 'text-indigo-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
                            More
                        </span>
                    </button>
                </div>
            </div>

            {/* Slide-up Menu Modal / Bottom Sheet */}
            {/* Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Sheet Content */}
            <div
                className={`fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 rounded-t-3xl z-[70] transform transition-transform duration-300 ease-out md:hidden pb-[env(safe-area-inset-bottom)] ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="p-2 flex justify-center">
                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full my-2"></div>
                </div>

                <div className="px-6 pb-8 pt-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">More Options</h3>

                        {/* Improved Close Button */}
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white border border-slate-700 transition-colors shadow-lg"
                            aria-label="Close Menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Secondary Nav Items */}

                        {/* Portfolio (Moved from Main Nav) */}
                        {/* This item is now part of the main navItems and removed from the menu */}

                        {/* Profile Button */}
                        <button
                            onClick={() => {
                                onOpenProfile();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 group"
                        >
                            <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">View Profile</span>
                        </button>

                        <button
                            onClick={() => {
                                onSwitchTrack();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 group"
                        >
                            <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20">
                                <Compass className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Explore New Role</span>
                        </button>

                        <button
                            onClick={() => {
                                onOpenFeedback();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 hover:bg-slate-800 group"
                        >
                            <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Send Feedback</span>
                        </button>

                        <button
                            onClick={() => {
                                onLogout();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 group"
                        >
                            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Sign Out</span>
                        </button>

                        <button
                            onClick={() => {
                                onResetData();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-slate-800 group"
                        >
                            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-red-500/10">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Reset Progress</span>
                        </button>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-xs text-slate-600">CareerPilot v1.0 • Mobile Experience</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileBottomNav;
