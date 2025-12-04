import React, { useState } from 'react';
import InputPanel from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';
import InstructionsPanel from './components/InstructionsPanel';
import ExportPanel from './components/ExportPanel';
import { isolineService } from '../../services/isolineService';
import type { ComputeRequest, ComputeResponse, ExportOptions } from '../../services/isolineService';

const IsolineGeneratorPage: React.FC = () => {
    const [computeData, setComputeData] = useState<ComputeResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scaleBarLength, setScaleBarLength] = useState<number>(50);
    const [gridSize, setGridSize] = useState<number | null>(null);

    // Export Options State
    const [includeScaleBar, setIncludeScaleBar] = useState(true);
    const [includeLabels, setIncludeLabels] = useState(true);
    const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
    const [includeGrid, setIncludeGrid] = useState(false);

    const handleGenerate = async (file: File, params: ComputeRequest) => {
        setIsGenerating(true);
        setError(null);
        try {
            const data = await isolineService.compute(file, params);
            setComputeData(data);
            // Update default scale bar length based on units if needed, or keep user preference?
            // Let's keep user preference but maybe reset if units change? 
            // For now, keep simple.
            if (data.units === 'm' && scaleBarLength === 50) setScaleBarLength(15);
            if (data.units === 'ft' && scaleBarLength === 15) setScaleBarLength(50);
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || err.message || 'An error occurred during generation.';
            setError(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPdf = async (options: ExportOptions) => {
        if (!computeData) return;
        setIsExporting(true);
        try {
            // Ensure options use current state
            const finalOptions = {
                ...options,
                scaleBarLength,
                includeScaleBar,
                includeLabels,
                includeDisclaimer,
                includeGrid,
                gridSpacing: includeGrid ? gridSize : undefined
            };
            const blob = await isolineService.exportPdf(computeData, finalOptions);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'isolines.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to export PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPng = async (options: ExportOptions) => {
        if (!computeData) return;
        setIsExporting(true);
        try {
            const finalOptions = {
                ...options,
                scaleBarLength,
                includeScaleBar,
                includeLabels,
                includeDisclaimer,
                includeGrid,
                gridSpacing: includeGrid ? gridSize : undefined
            };
            const blob = await isolineService.exportPng(computeData, finalOptions);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'isolines.png');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to export PNG.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
            <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
                <h1 className="text-2xl font-bold text-neutral-100">Isoline Generator</h1>
                <p className="text-sm text-neutral-400">Generate direct-only illuminance contours for site lighting overlays.</p>
            </header>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Column: Input */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                    <InputPanel
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        scaleBarLength={scaleBarLength}
                        setScaleBarLength={setScaleBarLength}
                        units={computeData?.units || 'ft'}
                        gridSize={gridSize}
                        setGridSize={setGridSize}
                    />
                </div>

                {/* Right Column: Preview & Export */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="h-[680px] flex-shrink-0">
                        <PreviewPanel
                            data={computeData}
                            isLoading={isGenerating}
                            scaleBarLength={scaleBarLength}
                            gridSize={gridSize}
                            includeScaleBar={includeScaleBar}
                            includeLabels={includeLabels}
                            includeGrid={includeGrid}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InstructionsPanel />
                        <ExportPanel
                            data={computeData}
                            onExportPdf={handleExportPdf}
                            onExportPng={handleExportPng}
                            isExporting={isExporting}
                            scaleBarLength={scaleBarLength}
                            includeScaleBar={includeScaleBar}
                            setIncludeScaleBar={setIncludeScaleBar}
                            includeLabels={includeLabels}
                            setIncludeLabels={setIncludeLabels}
                            includeDisclaimer={includeDisclaimer}
                            setIncludeDisclaimer={setIncludeDisclaimer}
                            includeGrid={includeGrid}
                            setIncludeGrid={setIncludeGrid}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IsolineGeneratorPage;
