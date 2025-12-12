import React from 'react';
import { SheetStatus } from '../types';
import type { SheetData } from '../types';

interface SidebarListProps {
    results: any; // ComparisonResponse or null
    displayedSheets: SheetData[];
    selectedSheetId: string | null;
    setSelectedSheetId: (id: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    isGeneratingAi: boolean;
    onGenerateSummaries: () => void;
    onOpenTransmittal: () => void;
}

export const SidebarList: React.FC<SidebarListProps> = ({
    results,
    displayedSheets,
    selectedSheetId,
    setSelectedSheetId,
    filterStatus,
    setFilterStatus,
    isGeneratingAi,
    onGenerateSummaries,
    onOpenTransmittal
}) => {
    if (!results) return null;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-app-border">
                <div className="flex gap-2 text-xs">
                    <button onClick={() => setFilterStatus('CHANGED')} className={`px-2 py-1 rounded ${filterStatus === 'CHANGED' ? 'bg-app-text text-app-bg' : 'text-app-text-muted hover:text-app-text'}`}>Changed</button>
                    <button onClick={() => setFilterStatus('ALL')} className={`px-2 py-1 rounded ${filterStatus === 'ALL' ? 'bg-app-text text-app-bg' : 'text-app-text-muted hover:text-app-text'}`}>All</button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onGenerateSummaries}
                        disabled={isGeneratingAi || displayedSheets.length === 0}
                        className="text-xs bg-app-primary/10 text-app-primary px-3 py-1 rounded font-semibold hover:bg-app-primary/20 disabled:opacity-50"
                    >
                        {isGeneratingAi ? 'Generating...' : 'Generate AI'}
                    </button>

                    <button
                        onClick={onOpenTransmittal}
                        disabled={!results}
                        className="text-xs border border-app-border px-3 py-1 rounded hover:bg-app-surface-hover disabled:opacity-50"
                    >
                        Narrative
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {displayedSheets.map(sheet => (
                    <div
                        key={sheet.sheetId}
                        onClick={() => setSelectedSheetId(sheet.sheetId)}
                        className={`p-4 border-b border-app-border cursor-pointer hover:bg-app-surface-hover ${selectedSheetId === sheet.sheetId ? 'bg-app-surface-hover border-l-4 border-l-app-primary' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="font-bold text-sm">{sheet.sheetNumber}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${sheet.status === SheetStatus.NEW ? 'bg-green-500/20 text-green-500' :
                                sheet.status === SheetStatus.REMOVED ? 'bg-red-500/20 text-red-500' :
                                    sheet.status === SheetStatus.REVISED ? 'bg-blue-500/20 text-blue-500' :
                                        'bg-gray-500/20 text-gray-500'
                                }`}>
                                {sheet.status}
                            </span>
                        </div>
                        <div className="text-xs text-app-text mb-2 truncate" title={sheet.sheetTitle}>{sheet.sheetTitle}</div>

                        {sheet.oneLineSummary && (
                            <div className="text-xs text-app-text-muted italic line-clamp-2 bg-app-bg p-2 rounded">
                                "{sheet.oneLineSummary}"
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
