import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreVertical, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DashboardWidgetProps {
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, children, headerAction, onMove }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col transition-all duration-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center select-none">
                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <h3 className="font-bold text-slate-100 text-lg">{title}</h3>
                </div>

                <div className="flex items-center gap-2">
                    {headerAction}

                    {onMove && (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 transition-colors"
                            >
                                <MoreVertical size={18} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl z-20 py-1">
                                        <div className="px-3 py-1 text-xs text-slate-500 font-bold uppercase tracking-wider">Move</div>
                                        <button
                                            onClick={() => { onMove('up'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <ArrowUp size={14} /> Up
                                        </button>
                                        <button
                                            onClick={() => { onMove('down'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <ArrowDown size={14} /> Down
                                        </button>
                                        <button
                                            onClick={() => { onMove('left'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <ArrowLeft size={14} /> Left
                                        </button>
                                        <button
                                            onClick={() => { onMove('right'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <ArrowRight size={14} /> Right
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            )}
        </div>
    );
};
