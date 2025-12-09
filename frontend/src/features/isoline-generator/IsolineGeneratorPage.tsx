import React, { useState } from 'react';
import { CircleDotDashed } from 'lucide-react';
import InputPanel from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';
import InstructionsPanel from './components/InstructionsPanel';
import ExportPanel from './components/ExportPanel';
import { isolineService } from '../../services/isolineService';
import type { ComputeRequest, ComputeResponse, ExportOptions } from '../../services/isolineService';


const IsolineGeneratorPage: React.FC = () => {
    const inputPanelRef = React.useRef<any>(null); // Ideally import InputPanelHandle but this works
    const [file, setFile] = React.useState<File | null>(null);
    const [computeData, setComputeData] = useState<ComputeResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scaleBarLength, setScaleBarLength] = useState<number>(50);
    const [gridSize, setGridSize] = useState<number | null>(null);
    const [fileName, setFileName] = useState<string>('isolines');

    // Export Options State
    const [includeScaleBar, setIncludeScaleBar] = useState(true);
    const [includeLabels, setIncludeLabels] = useState(true);
    const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
    const [includeGrid, setIncludeGrid] = useState(true);

    const triggerGenerate = () => {
        if (!file) {
            setError('Please upload an IES file.');
            return;
        }

        const { params, error: paramError } = inputPanelRef.current?.getParams() || { params: null, error: 'Internal error' };

        if (paramError) {
            setError(paramError);
            return;
        }

        if (params) {
            handleGenerate(file, params);
        }
    };

    const handleGenerate = async (uploadedFile: File, params: ComputeRequest) => {
        setIsGenerating(true);
        setError(null);

        // Extract filename without extension for export naming
        const name = uploadedFile.name.substring(0, uploadedFile.name.lastIndexOf('.')) || uploadedFile.name;
        setFileName(name);

        try {
            const data = await isolineService.compute(uploadedFile, params);
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
                gridSpacing: includeGrid ? gridSize : undefined,
                fileName: fileName // Pass the filename
            };
            await isolineService.exportPdf(computeData, finalOptions);
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
                gridSpacing: includeGrid ? gridSize : undefined,
                fileName: fileName // Pass the filename
            };
            await isolineService.exportPng(computeData, finalOptions);
        } catch (err) {
            console.error(err);
            alert('Failed to export PNG.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-app-bg overflow-hidden">
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                        <CircleDotDashed className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-app-text">Isoline Generator</h1>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Column: Input */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                    <InputPanel
                        ref={inputPanelRef}
                        file={file}
                        setFile={setFile}
                        onError={setError}
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
                        <ExportPanel
                            data={computeData}
                            onGenerate={triggerGenerate}
                            isFileSelected={!!file}
                            isGenerating={isGenerating}
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
                        <InstructionsPanel />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IsolineGeneratorPage;
