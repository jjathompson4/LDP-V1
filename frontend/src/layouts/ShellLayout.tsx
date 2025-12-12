import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Sun, Table2, Settings, CircleDotDashed, Lightbulb, FileDiff } from 'lucide-react';
import clsx from 'clsx';
import ThemeToggle from '../components/ThemeToggle';

export const ShellLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-app-bg text-app-text font-sans overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 border-r border-app-border bg-app-surface/50 flex flex-col backdrop-blur-sm">
                <div className="p-6 border-b border-app-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight text-app-text">LDP <span className="text-app-text-muted font-normal">v1.0</span></h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-app-primary-soft text-app-primary shadow-sm border border-app-primary/20"
                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                            )
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                        Tools
                    </div>

                    <NavLink
                        to="/schedule-builder"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-app-primary-soft text-app-primary shadow-sm border border-app-primary/20"
                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                            )
                        }
                    >
                        <Table2 className="w-5 h-5" />
                        <span className="font-medium">Schedule Builder</span>
                    </NavLink>

                    <NavLink
                        to="/luminance-analysis"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-app-primary-soft text-app-primary shadow-sm border border-app-primary/20"
                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                            )
                        }
                    >
                        <Sun className="w-5 h-5" />
                        <span className="font-medium">Luminance Analysis</span>
                    </NavLink>

                    <NavLink
                        to="/isoline-generator"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-app-primary-soft text-app-primary shadow-sm border border-app-primary/20"
                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                            )
                        }
                    >
                        <CircleDotDashed className="w-5 h-5" />
                        <span className="font-medium">Isoline Generator</span>
                    </NavLink>

                    <NavLink
                        to="/change-narrative"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-app-primary-soft text-app-primary shadow-sm border border-app-primary/20"
                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                            )
                        }
                    >
                        <FileDiff className="w-5 h-5" />
                        <span className="font-medium">Change Narrative</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-app-border flex items-center justify-between gap-2">
                    <button className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl text-app-text-muted hover:bg-app-surface-hover hover:text-app-text transition-all duration-200 text-left">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-app-bg relative">
                {/* Optional: Add a subtle gradient overlay if desired, but keeping it clean for now or using theme tokens */}
                <div className="relative z-10 min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

