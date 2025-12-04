import React from 'react';
import type { ComputeResponse, ExportOptions } from '../../../services/isolineService';

interface ExportPanelProps {
    data: ComputeResponse | null;
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
        <div className="bg-neutral-900 p-4 rounded-lg shadow-sm border border-neutral-800 flex flex-col gap-4">
            <h3 className="text-md font-semibold text-neutral-100 border-b border-neutral-800 pb-2">Export Isolines</h3>

            <div className="flex gap-2">
                <button
                    onClick={handlePdf}
                    disabled={!data || isExporting}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                    onClick={handlePng}
                    disabled={!data || isExporting}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isExporting ? 'Exporting...' : 'Export PNG'}
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeScaleBar}
                        onChange={(e) => setIncludeScaleBar(e.target.checked)}
                        className="rounded border-neutral-600 bg-neutral-800 text-cyan-600 focus:ring-cyan-500"
                    />
                    Include scale bar
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeLabels}
                        onChange={(e) => setIncludeLabels(e.target.checked)}
                        className="rounded border-neutral-600 bg-neutral-800 text-cyan-600 focus:ring-cyan-500"
                    />
                    Include labels
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeGrid}
                        onChange={(e) => setIncludeGrid(e.target.checked)}
                        className="rounded border-neutral-600 bg-neutral-800 text-cyan-600 focus:ring-cyan-500"
                    />
                    Include grid
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeDisclaimer}
                        onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                        className="rounded border-neutral-600 bg-neutral-800 text-cyan-600 focus:ring-cyan-500"
                    />
                    Include disclaimer
                </label>
            </div>

            <div className="text-xs text-neutral-500">
                PDF is vector-based and scale-accurate. PNG is high-resolution transparent raster. Both are optimized for Bluebeam overlay.
            </div>
        </div>
    );
};

export default ExportPanel;
