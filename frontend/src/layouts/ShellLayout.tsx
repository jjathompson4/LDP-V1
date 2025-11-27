import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Sun, Table2, Settings } from 'lucide-react';
import clsx from 'clsx';

export const ShellLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
                <div className="p-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">LDP <span className="text-neutral-500 font-normal">v1.0</span></h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20"
                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                            )
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Tools
                    </div>

                    <NavLink
                        to="/schedule-builder"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20"
                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
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
                                    ? "bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20"
                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                            )
                        }
                    >
                        <Sun className="w-5 h-5" />
                        <span className="font-medium">Luminance Analysis</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-200">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-neutral-950 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none" />
                <div className="relative z-10 min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
