import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Image as ImageIcon, Loader2, Crosshair, Trash2, BarChart2 } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { DisplayControls } from './components/DisplayControls';
import { FalseColorControls } from './components/FalseColorControls';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { HistogramDialog } from './components/HistogramDialog';
import * as api from './services/analysisService';

interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

const LuminanceAnalysisPage: React.FC = () => {
    // Session State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [stats, setStats] = useState<api.AnalysisStats | null>(null);

    // Display State
    const [exposure, setExposure] = useState(0);
    const [gamma, setGamma] = useState(2.2);
    const [useSrgb, setUseSrgb] = useState(true);
    const [falseColor, setFalseColor] = useState(false);
    const [colormap, setColormap] = useState('jet');
    const [fcMin, setFcMin] = useState(0);
    const [fcMax, setFcMax] = useState(1000);
    const [scaleFactor, setScaleFactor] = useState(1.0);

    // Image Data
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [colorbar, setColorbar] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);

    // Annotations
    const [pixelTags, setPixelTags] = useState<{ x: number; y: number; value: number }[]>([]);
    const [roiTags, setRoiTags] = useState<{ rect: Rect; value: number }[]>([]);

    // Histogram
    const [showHistogram, setShowHistogram] = useState(false);
    const [histogramData, setHistogramData] = useState<{ bins: number[]; counts: number[] } | null>(null);

    // Error/Loading
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setError(null);
        try {
            const data = await api.uploadImage(file);
            setSessionId(data.sessionId);
            setFilename(data.filename);
            setDimensions({ width: data.width, height: data.height });
            setStats(data.stats);
            setScaleFactor(data.scaleFactor);

            // Reset controls
            setExposure(0);
            setGamma(2.2);
            setUseSrgb(true);
            setFalseColor(false);
            setPixelTags([]);
            setRoiTags([]);

            // Initial Render
            await updateRender(data.sessionId, 0, 2.2, true, false, 'jet', 0, 1000);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const updateRender = useCallback(async (
        sid: string, exp: number, gam: number, srgb: boolean, fc: boolean, cmap: string, min: number, max: number
    ) => {
        setIsRendering(true);
        try {
            const res = await api.renderImage({
                sessionId: sid,
                exposure: exp,
                gamma: gam,
                useSrgb: srgb,
                falseColor: fc,
                colormap: cmap,
                falsecolorMin: min,
                falsecolorMax: max,
            });
            setCurrentImage(res.image);
            setColorbar(res.colorbar || null);
        } catch (err) {
            console.error(err);
            setError("Failed to render image");
        } finally {
            setIsRendering(false);
        }
    }, []);

    // Debounced render effect could be added here, but for now we'll trigger on change
    // We'll use a separate effect to trigger render when controls change, if session exists
    useEffect(() => {
        if (sessionId) {
            const timer = setTimeout(() => {
                updateRender(sessionId, exposure, gamma, useSrgb, falseColor, colormap, fcMin, fcMax);
            }, 100); // 100ms debounce
            return () => clearTimeout(timer);
        }
    }, [sessionId, exposure, gamma, useSrgb, falseColor, colormap, fcMin, fcMax, updateRender]);

    const handlePixelSelect = async (x: number, y: number) => {
        if (!sessionId) return;
        try {
            const val = await api.getPixelLuminance(sessionId, Math.round(x), Math.round(y));
            setPixelTags(prev => [...prev, { x, y, value: val }]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoiSelect = async (rect: Rect) => {
        if (!sessionId) return;
        try {
            const val = await api.getRoiLuminance(sessionId, Math.round(rect.x0), Math.round(rect.y0), Math.round(rect.x1), Math.round(rect.y1));
            setRoiTags(prev => [...prev, { rect, value: val }]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAnnotations = () => {
        setPixelTags([]);
        setRoiTags([]);
    };

    const handleShowHistogram = async () => {
        if (!sessionId) return;
        try {
            const data = await api.getHistogram(sessionId);
            setHistogramData(data);
            setShowHistogram(true);
        } catch (err) {
            console.error(err);
            setError("Failed to load histogram");
        }
    };

    const handleCalibrate = async () => {
        // Simple prompt for now, could be a modal
        if (!sessionId || pixelTags.length === 0) {
            alert("Please select a pixel point first to calibrate.");
            return;
        }
        const lastTag = pixelTags[pixelTags.length - 1];
        const input = prompt(`Enter known luminance for point (${lastTag.x.toFixed(0)}, ${lastTag.y.toFixed(0)}) currently ${lastTag.value.toFixed(2)} cd/m²:`);
        if (input) {
            const known = parseFloat(input);
            if (!isNaN(known) && known > 0) {
                try {
                    const res = await api.calibrateImage(sessionId, Math.round(lastTag.x), Math.round(lastTag.y), known);
                    setStats(res.stats);
                    setScaleFactor(res.scaleFactor);
                    // Trigger re-render
                    updateRender(sessionId, exposure, gamma, useSrgb, falseColor, colormap, fcMin, fcMax);
                    // Update tags? Ideally we'd re-fetch them or clear them. 
                    // For simplicity, let's clear them to avoid confusion as values changed.
                    handleClearAnnotations();
                    alert(`Calibration applied. Scale factor: ${res.scaleFactor.toFixed(4)}`);
                } catch (err) {
                    console.error(err);
                    alert("Calibration failed");
                }
            }
        }
    };

    return (
        <div className="min-h-screen text-app-text-muted font-sans bg-app-bg flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border shrink-0 z-10">
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-app-text tracking-tight">Luminance Analysis</h1>
                    </div>

                    {stats && (
                        <div className="flex gap-4 text-sm font-mono bg-app-bg/50 px-4 py-1.5 rounded-lg border border-app-border">
                            <span className="text-app-text-muted">Min: <span className="text-app-text">{stats.min.toFixed(2)}</span></span>
                            <span className="text-app-text-muted">Max: <span className="text-app-text">{stats.max.toFixed(2)}</span></span>
                            <span className="text-app-text-muted">Avg: <span className="text-app-text">{stats.avg.toFixed(2)}</span></span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar Controls */}
                <aside className="w-80 bg-app-bg border-r border-app-border flex flex-col overflow-y-auto p-4 gap-4 shrink-0">
                    {!sessionId ? (
                        <div className="p-4 bg-app-surface rounded-xl border border-app-border">
                            <h3 className="text-app-text font-semibold mb-2">Upload Image</h3>
                            <ImageUpload onUpload={handleUpload} isProcessing={isUploading} />
                            {error && <p className="text-app-error text-sm mt-2">{error}</p>}
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-app-surface/50 rounded-lg border border-app-border text-xs text-app-text-muted break-all">
                                <span className="font-semibold text-app-text">File:</span> {filename} <br />
                                <span className="font-semibold text-app-text">Res:</span> {dimensions?.width} x {dimensions?.height}
                            </div>

                            <DisplayControls
                                exposure={exposure}
                                gamma={gamma}
                                useSrgb={useSrgb}
                                disabled={falseColor}
                                onExposureChange={setExposure}
                                onGammaChange={setGamma}
                                onSrgbChange={setUseSrgb}
                            />

                            <FalseColorControls
                                enabled={falseColor}
                                colormap={colormap}
                                min={fcMin}
                                max={fcMax}
                                disabled={false}
                                onToggle={setFalseColor}
                                onColormapChange={setColormap}
                                onMinChange={setFcMin}
                                onMaxChange={setFcMax}
                            />

                            <div className="space-y-4">
                                <div className="bg-app-surface rounded-xl border border-app-border p-4 space-y-3">
                                    <button
                                        onClick={handleCalibrate}
                                        className="w-full flex items-center justify-center gap-2 bg-app-surface-hover hover:bg-app-border border border-app-border text-app-text py-2.5 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Crosshair className="w-4 h-4" /> Calibrate
                                    </button>

                                    <div className="flex flex-col items-center gap-1">
                                        {scaleFactor !== 1.0 ? (
                                            <>
                                                <span className="text-[10px] uppercase font-bold text-app-success tracking-wider flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-app-success"></div> Calibrated
                                                </span>
                                                <span className="text-[10px] font-mono text-app-text-muted">
                                                    Factor: {scaleFactor.toFixed(4)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] uppercase font-bold text-app-error tracking-wider flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-app-error"></div> Uncalibrated
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleClearAnnotations}
                                        disabled={pixelTags.length === 0 && roiTags.length === 0}
                                        className="w-full flex items-center justify-center gap-2 text-app-error hover:text-red-300 hover:bg-app-error/20 py-2 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-3 h-3" /> Clear Annotations
                                    </button>
                                </div>

                                <button
                                    onClick={handleShowHistogram}
                                    className="w-full flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface-hover border border-app-border text-app-text py-3 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <BarChart2 className="w-4 h-4" /> View Histogram
                                </button>
                            </div>

                        </>
                    )}
                </aside>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-app-bg relative flex items-center justify-center overflow-hidden p-4">
                    {currentImage && sessionId && dimensions ? (
                        <div className="relative w-full h-full flex flex-col">
                            <div className="flex-1 min-h-0 relative">
                                <InteractiveCanvas
                                    imageSrc={currentImage}
                                    width={dimensions.width}
                                    height={dimensions.height}
                                    onPixelSelect={handlePixelSelect}
                                    onRoiSelect={handleRoiSelect}
                                    pixelTags={pixelTags}
                                    roiTags={roiTags}
                                />
                                {isRendering && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10">
                                        <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            {falseColor && colorbar && (
                                <div className="shrink-0 mt-4 bg-app-bg/80 backdrop-blur rounded-lg border border-app-border p-2 flex items-center justify-center w-full">
                                    <img src={colorbar} alt="Legend" className="w-full h-auto object-contain" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-600">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Upload an HDR image to begin analysis</p>
                        </div>
                    )}
                </div>
            </main>

            {histogramData && (
                <HistogramDialog
                    isOpen={showHistogram}
                    onClose={() => setShowHistogram(false)}
                    bins={histogramData.bins}
                    counts={histogramData.counts}
                />
            )}
        </div>
    );
};

export default LuminanceAnalysisPage;
