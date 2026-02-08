import React, { useState } from 'react';
import { CircleDotDashed } from 'lucide-react';
import InputPanel, { type InputPanelHandle } from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';
import InstructionsPanel from './components/InstructionsPanel';
import ExportPanel from './components/ExportPanel';
import { isolineService } from '../../services/isolineService';
import type { ComputeRequest, ComputeResponse, ExportOptions } from '../../services/isolineService';
import type { AxiosError } from 'axios';
import { useToast } from '../../components/ui/ToastContext';
import { PAGE_LAYOUT } from '../../layouts/pageLayoutTokens';
import { TOOL_PAGE_TITLE } from '../../styles/toolStyleTokens';


const IsolineGeneratorPage: React.FC = () => {
    const { showToast } = useToast();
    const inputPanelRef = React.useRef<InputPanelHandle | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [computeData, setComputeData] = useState<ComputeResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scaleBarLength, setScaleBarLength] = useState<number>(50);
    const [gridSize, setGridSize] = useState<number | null>(null);
    const [fileName, setFileName] = useState<string>('isolines');
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

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
            // Apply current rotation
            params.rotationX = rotation.x;
            params.rotationY = rotation.y;
            params.rotationZ = rotation.z;
            handleGenerate(file, params);
        }
    };

    const handleRotate = (axis: 'x' | 'y' | 'z') => {
        setRotation(prev => {
            const next = { ...prev, [axis]: (prev[axis] + 90) % 360 };

            // If we have data, regenerate immediately with new rotation
            if (file && inputPanelRef.current) {
                const { params } = inputPanelRef.current.getParams();
                if (params) {
                    params.rotationX = next.x;
                    params.rotationY = next.y;
                    params.rotationZ = next.z;
                    handleGenerate(file, params);
                }
            }
            return next;
        });
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
        } catch (err: unknown) {
            console.error(err);
            const maybeAxiosError = err as AxiosError<{ detail?: string }>;
            const errorMsg = maybeAxiosError.response?.data?.detail || (err instanceof Error ? err.message : 'An error occurred during generation.');
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
            showToast('Failed to export PDF.', 'error');
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
            showToast('Failed to export PNG.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={PAGE_LAYOUT.root}>
            <header className={PAGE_LAYOUT.header}>
                <div className="flex items-center gap-3">
                    <div className={PAGE_LAYOUT.headerIcon}>
                        <CircleDotDashed className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className={TOOL_PAGE_TITLE}>Isoline Generator</h1>
                    </div>
                </div>
            </header>

            <div className={PAGE_LAYOUT.body}>
                {/* Left Column: Input */}
                <aside className={PAGE_LAYOUT.sidebar}>
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
                </aside>

                {/* Right Column: Preview & Export */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-xl relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="h-[740px] flex-shrink-0">
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
                            onRotate={handleRotate}
                            rotation={rotation}
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
