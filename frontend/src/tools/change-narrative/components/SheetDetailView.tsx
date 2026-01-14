import React from 'react';
import type { SheetData } from '../types';
import { ArrowRight, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../../config';

interface SheetDetailViewProps {
    sheetId: string | null;
    sheets: SheetData[];
    setSheets: (sheets: SheetData[]) => void;
    prevPdf: File | null;
    currPdf: File | null;
}

export const SheetDetailView: React.FC<SheetDetailViewProps> = ({
    sheetId,
    sheets,
    setSheets,
    prevPdf,
    currPdf
}) => {
    const [isLoadingPreviews, setIsLoadingPreviews] = React.useState(false);
    const [previewError, setPreviewError] = React.useState<string | null>(null);

    const sheet = React.useMemo(() => sheets.find(s => s.sheetId === sheetId), [sheets, sheetId]);

    React.useEffect(() => {
        if (!sheetId || !sheet || !prevPdf || !currPdf) return;

        // If we already have previews for this sheet, don't fetch again
        if (sheet.previousPreviewBase64 && sheet.currentPreviewBase64) return;

        const fetchPreviews = async () => {
            setIsLoadingPreviews(true);
            setPreviewError(null);
            try {
                const formData = new FormData();
                formData.append('sheetNumber', sheet.sheetNumber);
                formData.append('previousPdf', prevPdf);
                formData.append('currentPdf', currPdf);

                const res = await fetch(`${API_BASE_URL}/api/change-narrative/preview`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error("Failed to load previews");

                const data = await res.json();

                // Update the sheet in the parent state with the new previews
                setSheets(sheets.map(s => s.sheetId === sheetId ? {
                    ...s,
                    previousPreviewBase64: data.previous,
                    currentPreviewBase64: data.current
                } : s));
            } catch (err: any) {
                console.error(err);
                setPreviewError(err.message);
            } finally {
                setIsLoadingPreviews(false);
            }
        };

        fetchPreviews();
    }, [sheetId, prevPdf, currPdf]);

    if (!sheetId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted">
                <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a sheet to view details</p>
            </div>
        );
    }

    const displayedSheet = sheets.find(s => s.sheetId === sheetId);
    if (!displayedSheet) return null;

    const toggleInclude = (checked: boolean) => {
        const newSheets = sheets.map(s => s.sheetId === displayedSheet.sheetId ? { ...s, isIncluded: checked } : s);
        setSheets(newSheets);
    };

    const updateNarrative = (val: string) => {
        const newSheets = sheets.map(s => s.sheetId === displayedSheet.sheetId ? { ...s, detailedNarrative: val } : s);
        setSheets(newSheets);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">{displayedSheet.sheetNumber}</h2>
                    <h3 className="text-xl text-app-text-muted">{displayedSheet.sheetTitle}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-app-surface px-4 py-2 rounded-lg border border-app-border">
                        <input
                            type="checkbox"
                            checked={!!displayedSheet.isIncluded}
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
                    value={displayedSheet.detailedNarrative || ''}
                    onChange={e => updateNarrative(e.target.value)}
                    placeholder="AI narrative will appear here. You can also edit manually."
                />
            </div>

            {/* Comparison View */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <span className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Previous Issue</span>
                    <div className="aspect-[3/4] bg-app-bg border border-app-border rounded-xl overflow-hidden relative group shadow-inner">
                        {isLoadingPreviews ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-app-surface/50 backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 text-app-primary animate-spin mb-2" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase">Rendering...</span>
                            </div>
                        ) : displayedSheet.previousPreviewBase64 ? (
                            <img src={`data:image/png;base64,${displayedSheet.previousPreviewBase64}`} className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-app-text-muted text-xs">
                                {previewError ? 'Failed to load' : 'No preview available'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Current Issue</span>
                    <div className="aspect-[3/4] bg-app-bg border border-app-border rounded-xl overflow-hidden relative group shadow-inner">
                        {isLoadingPreviews ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-app-surface/50 backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 text-app-primary animate-spin mb-2" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase">Rendering...</span>
                            </div>
                        ) : displayedSheet.currentPreviewBase64 ? (
                            <img src={`data:image/png;base64,${displayedSheet.currentPreviewBase64}`} className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-app-text-muted text-xs">
                                {previewError ? 'Failed to load' : 'No preview available'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
