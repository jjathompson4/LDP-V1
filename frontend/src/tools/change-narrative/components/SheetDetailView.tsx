import React from 'react';
import type { SheetData } from '../types';
import { ArrowRight } from 'lucide-react';

interface SheetDetailViewProps {
    sheetId: string | null;
    sheets: SheetData[];
    setSheets: (sheets: SheetData[]) => void;
}

export const SheetDetailView: React.FC<SheetDetailViewProps> = ({ sheetId, sheets, setSheets }) => {
    if (!sheetId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted">
                <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a sheet to view details</p>
            </div>
        );
    }

    const sheet = sheets.find(s => s.sheetId === sheetId);
    if (!sheet) return null;

    const toggleInclude = (checked: boolean) => {
        const newSheets = sheets.map(s => s.sheetId === sheet.sheetId ? { ...s, isIncluded: checked } : s);
        setSheets(newSheets);
    };

    const updateNarrative = (val: string) => {
        const newSheets = sheets.map(s => s.sheetId === sheet.sheetId ? { ...s, detailedNarrative: val } : s);
        setSheets(newSheets);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">{sheet.sheetNumber}</h2>
                    <h3 className="text-xl text-app-text-muted">{sheet.sheetTitle}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-app-surface px-4 py-2 rounded-lg border border-app-border">
                        <input
                            type="checkbox"
                            checked={!!sheet.isIncluded}
                            onChange={e => toggleInclude(e.target.checked)}
                            className="w-4 h-4 rounded text-app-primary focus:ring-app-primary"
                        />
                        <span className="text-sm font-semibold">Include in Narrative</span>
                    </label>
                </div>
            </div>

            {/* Narrative Editor */}
            <div className="bg-app-surface rounded-xl border border-app-border p-6 shadow-sm">
                <h4 className="text-sm font-bold text-app-text-muted uppercase mb-4">Detailed Narrative</h4>
                <textarea
                    className="w-full h-40 bg-app-bg border border-app-border rounded-lg p-4 text-sm leading-relaxed focus:ring-2 focus:ring-app-primary focus:border-transparent outline-none resize-y"
                    value={sheet.detailedNarrative || ''}
                    onChange={e => updateNarrative(e.target.value)}
                    placeholder="AI narrative will appear here. You can also edit manually."
                />
            </div>

            {/* Comparison View */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <span className="text-xs font-bold text-app-text-muted uppercase">Previous Issue</span>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-app-border relative group">
                        {sheet.previousPreviewBase64 ? (
                            <img src={`data:image/png;base64,${sheet.previousPreviewBase64}`} className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">Not available</div>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="text-xs font-bold text-app-text-muted uppercase">Current Issue</span>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-app-border relative group">
                        {sheet.currentPreviewBase64 ? (
                            <img src={`data:image/png;base64,${sheet.currentPreviewBase64}`} className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">Not available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
