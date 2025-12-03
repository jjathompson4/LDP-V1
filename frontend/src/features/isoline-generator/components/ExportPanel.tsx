import React, { useState } from 'react';
import type { ComputeResponse, ExportOptions } from '../../../services/isolineService';

interface ExportPanelProps {
    data: ComputeResponse | null;
    onExportPdf: (options: ExportOptions) => void;
    onExportPng: (options: ExportOptions) => void;
    isExporting: boolean;
    scaleBarLength: number; // Accepted to satisfy parent, but not controlled here
}

const ExportPanel: React.FC<ExportPanelProps> = ({ data, onExportPdf, onExportPng, isExporting, scaleBarLength }) => {
    const [includeLegend, setIncludeLegend] = useState<boolean>(true);
    const [includeLabels, setIncludeLabels] = useState<boolean>(true);
    const [includeDisclaimer, setIncludeDisclaimer] = useState<boolean>(true);

    const handleExport = (type: 'pdf' | 'png') => {
        if (!data) return;

        const options: ExportOptions = {
            pageSize: 'auto',
            includeLegend,
            includeLabels,
            scaleBarLength, // Use the prop value
            units: data.units,
            illuminanceUnits: data.illuminanceUnits,
            includeDisclaimer
        };

        if (type === 'pdf') {
            onExportPdf(options);
        } else {
            onExportPng(options);
        }
    };

    return (
        <div className="bg-neutral-900 p-4 rounded-lg shadow-sm border border-neutral-800">
            <h3 className="text-md font-semibold text-neutral-100 mb-3">Export Isolines</h3>

            <div className="flex flex-col gap-3">
                {/* Buttons at Top */}
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!data || isExporting}
                        className="flex-1 py-2 px-3 bg-cyan-600 text-white text-sm font-medium rounded hover:bg-cyan-500 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={() => handleExport('png')}
                        disabled={!data || isExporting}
                        className="flex-1 py-2 px-3 bg-neutral-800 text-neutral-300 border border-neutral-700 text-sm font-medium rounded hover:bg-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed"
                    >
                        Download PNG
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-neutral-300">
                        <input
                            type="checkbox"
                            checked={includeLegend}
                            onChange={(e) => setIncludeLegend(e.target.checked)}
                            className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                        />
                        Include Legend
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-neutral-300">
                        <input
                            type="checkbox"
                            checked={includeLabels}
                            onChange={(e) => setIncludeLabels(e.target.checked)}
                            className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                        />
                        Show Sparse Labels
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-neutral-300">
                        <input
                            type="checkbox"
                            checked={includeDisclaimer}
                            onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                            className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                        />
                        Include Disclaimer
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ExportPanel;
