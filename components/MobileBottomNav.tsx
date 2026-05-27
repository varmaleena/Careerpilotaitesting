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
    TrendingUp,
    Trash2,
    User,
    Briefcase,
    MessageSquare
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
        { id: AppView.JOBS, icon: Briefcase, label: 'Jobs' },
    ];

    const handleNavClick = (view: AppView) => {
        onChangeView(view);
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const isActive = (view: AppView) => currentView === view;

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-50 pb-[env(safe-area-inset-bottom)]">
                <div className="bg-[rgba(9,9,11,0.95)] backdrop-blur-xl border-t border-zinc-800 h-[65px] flex items-center justify-between px-4">

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className="flex flex-col items-center justify-center w-auto flex-1 h-full gap-0.5 relative group"
                        >
                            <item.icon
                                className={`w-5 h-5 transition-all duration-200 ${isActive(item.id)
                                    ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]'
                                    : 'text-zinc-500 group-hover:text-zinc-300'
                                    }`}
                            />
                            <span className={`text-[9px] font-semibold transition-all duration-200 ${isActive(item.id) ? 'text-violet-400 opacity-100' : 'text-zinc-600 opacity-70'}`}>
                                {item.label}
                            </span>

                            {isActive(item.id) && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-violet-500 shadow-[0_0_8px_rgba(167,139,250,0.8)] rounded-b-full"></div>
                            )}
                        </button>
                    ))}

                    {/* Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="flex flex-col items-center justify-center w-auto flex-1 h-full gap-0.5 relative group"
                    >
                        <Menu
                            className={`w-5 h-5 transition-all duration-200 ${isMenuOpen
                                ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]'
                                : 'text-zinc-500 group-hover:text-zinc-300'
                                }`}
                        />
                        <span className={`text-[9px] font-semibold transition-all duration-200 ${isMenuOpen ? 'text-violet-400 opacity-100' : 'text-zinc-600 opacity-70'}`}>
                            More
                        </span>
                    </button>
                </div>
            </div>

            {/* Slide-up Menu Modal / Bottom Sheet */}
            {/* Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-[60] md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Sheet Content */}
            <div
                className={`fixed bottom-0 left-0 w-full bg-[#09090b] border-t border-zinc-800 rounded-t-3xl z-[70] transform transition-transform duration-300 ease-out md:hidden pb-[env(safe-area-inset-bottom)] ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="p-2 flex justify-center">
                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full my-2"></div>
                </div>

                <div className="px-6 pb-8 pt-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">More Options</h3>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white border border-zinc-700 transition-colors shadow-lg"
                            aria-label="Close Menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Profile Button */}
                        <button
                            onClick={() => {
                                onOpenProfile();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-violet-400 hover:bg-zinc-800 group"
                        >
                            <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">View Profile</span>
                        </button>

                        <button
                            onClick={() => {
                                onSwitchTrack();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-zinc-800 group"
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
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-violet-400 hover:bg-zinc-800 group"
                        >
                            <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Send Feedback</span>
                        </button>

                        <button
                            onClick={() => {
                                onLogout();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 group"
                        >
                            <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Sign Out</span>
                        </button>

                        <button
                            onClick={() => {
                                onResetData();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 group"
                        >
                            <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-red-500/10">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">Reset Progress</span>
                        </button>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-xs text-zinc-600">CareerPilot v1.0 • Mobile Experience</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileBottomNav;
