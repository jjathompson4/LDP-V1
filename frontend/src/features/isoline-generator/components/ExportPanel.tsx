import React from 'react';
import type { ComputeResponse, ExportOptions } from '../../../services/isolineService';

interface ExportPanelProps {
    data: ComputeResponse | null;
    onGenerate: () => void;
    isFileSelected: boolean;
    isGenerating: boolean;
    onExportPdf: (options: ExportOptions) => void;
    onExportPng: (options: ExportOptions) => void;
    isExporting: boolean;
    scaleBarLength: number;
    includeScaleBar: boolean;
    setIncludeScaleBar: (val: boolean) => void;
    includeLabels: boolean;
    setIncludeLabels: (val: boolean) => void;
    includeDisclaimer: boolean;
    setIncludeDisclaimer: (val: boolean) => void;
    includeGrid: boolean;
    setIncludeGrid: (val: boolean) => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
    data,
    onGenerate,
    isFileSelected,
    isGenerating,
    onExportPdf,
    onExportPng,
    isExporting,
    scaleBarLength,
    includeScaleBar,
    setIncludeScaleBar,
    includeLabels,
    setIncludeLabels,
    includeDisclaimer,
    setIncludeDisclaimer,
    includeGrid,
    setIncludeGrid
}) => {
    // Local state removed, using props

    const handlePdf = () => {
        onExportPdf({
            format: 'pdf',
            includeScaleBar,
            includeLabels,
            includeDisclaimer,
            includeGrid,
            scaleBarLength
        });
    };

    const handlePng = () => {
        onExportPng({
            format: 'png',
            includeScaleBar,
            includeLabels,
            includeDisclaimer,
            includeGrid,
            scaleBarLength
        });
    };

    return (
        <div className="bg-app-surface p-4 rounded-lg shadow-sm border border-app-border flex flex-col gap-4">
            <h3 className="text-md font-semibold text-app-text border-b border-app-border pb-2">Export Isolines</h3>

            {/* Generate Button (Moved here) */}
            <button
                onClick={onGenerate}
                disabled={isGenerating || !isFileSelected}
                className="w-full py-2 bg-app-primary hover:bg-app-primary-hover text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isGenerating ? 'Previewing...' : 'Preview Isolines'}
            </button>

            {/* Export Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handlePdf}
                    disabled={!data || isExporting}
                    className="flex-1 py-2 bg-app-primary hover:bg-app-primary-hover text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                    onClick={handlePng}
                    disabled={!data || isExporting}
                    className="flex-1 py-2 bg-app-primary hover:bg-app-primary-hover text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                    {isExporting ? 'Exporting...' : 'Export PNG'}
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeScaleBar}
                        onChange={(e) => setIncludeScaleBar(e.target.checked)}
                        className="rounded border-app-border bg-app-bg text-app-primary focus:ring-app-primary"
                    />
                    Include scale bar
                </label>
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeLabels}
                        onChange={(e) => setIncludeLabels(e.target.checked)}
                        className="rounded border-app-border bg-app-bg text-app-primary focus:ring-app-primary"
                    />
                    Include labels
                </label>
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeGrid}
                        onChange={(e) => setIncludeGrid(e.target.checked)}
                        className="rounded border-app-border bg-app-bg text-app-primary focus:ring-app-primary"
                    />
                    Include grid
                </label>
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeDisclaimer}
                        onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                        className="rounded border-app-border bg-app-bg text-app-primary focus:ring-app-primary"
                    />
                    Include disclaimer
                </label>
            </div>

            <div className="text-xs text-app-text-muted">
                PDF is vector-based and scale-accurate. PNG is high-resolution transparent raster. Both are optimized for Bluebeam overlay.
            </div>
        </div>
    );
};

export default ExportPanel;
