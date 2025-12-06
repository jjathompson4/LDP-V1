import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Image as ImageIcon, Loader2, Crosshair, Trash2, BarChart2 } from 'lucide-react';
import { DropZone } from '../../components/shared/DropZone';
import { DisplayControls } from './components/DisplayControls';
import { FalseColorControls } from './components/FalseColorControls';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { HistogramDialog } from './components/HistogramDialog';
import * as api from './services/analysisService';
import { useTheme } from '../../context/ThemeContext';

interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

const LuminanceAnalysisPage: React.FC = () => {
    // Theme
    const { theme } = useTheme();

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

    const updateRender = useCallback(async (
        currentSessionId: string,
        currentExposure: number,
        currentGamma: number,
        currentUseSrgb: boolean,
        currentFalseColor: boolean,
        currentColormap: string,
        currentFcMin: number,
        currentFcMax: number,
        currentTheme: string
    ) => {
        setIsRendering(true);
        setError(null);
        try {
            const imageData = await api.renderImage({
                sessionId: currentSessionId,
                exposure: currentExposure,
                gamma: currentGamma,
                useSrgb: currentUseSrgb,
                falseColor: currentFalseColor,
                colormap: currentColormap,
                falsecolorMin: currentFcMin,
                falsecolorMax: currentFcMax,
                theme: currentTheme
            });
            setCurrentImage(imageData.image);
            setColorbar(imageData.colorbar || null);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsRendering(false);
        }
    }, []);

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];

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
            await updateRender(data.sessionId, 0, 2.2, true, false, 'jet', 0, 1000, theme);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (sessionId) {
            updateRender(sessionId, exposure, gamma, useSrgb, falseColor, colormap, fcMin, fcMax, theme);
        }
    }, [sessionId, exposure, gamma, useSrgb, falseColor, colormap, fcMin, fcMax, theme, updateRender]);

    const handlePixelSelect = useCallback(async (x: number, y: number) => {
        if (!sessionId) return;
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);
            const value = await api.getPixelLuminance(sessionId, rx, ry);
            setPixelTags(prev => [...prev, { x: rx, y: ry, value }]);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        }
    }, [sessionId]);

    const handleRoiSelect = useCallback(async (rect: Rect) => {
        if (!sessionId) return;
        try {
            const roundedRect = {
                x0: Math.round(rect.x0),
                y0: Math.round(rect.y0),
                x1: Math.round(rect.x1),
                y1: Math.round(rect.y1)
            };
            const value = await api.getRoiLuminance(sessionId, roundedRect.x0, roundedRect.y0, roundedRect.x1, roundedRect.y1);
            setRoiTags(prev => [...prev, { rect: roundedRect, value }]);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        }
    }, [sessionId]);

    const handleCalibrate = useCallback(async () => {
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
                    setPixelTags([]); // Clear annotations as they might be stale
                    setRoiTags([]);
                } catch (err) {
                    console.error(err);
                    setError("Calibration failed");
                }
            }
        }
    }, [sessionId, pixelTags]);

    const handleClearAnnotations = useCallback(() => {
        setPixelTags([]);
        setRoiTags([]);
    }, []);

    const handleShowHistogram = useCallback(async () => {
        if (!sessionId) return;
        try {
            const data = await api.getHistogram(sessionId);
            setHistogramData(data);
            setShowHistogram(true);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        }
    }, [sessionId]);

    return (
        <div className="h-full flex flex-col bg-app-bg overflow-hidden">
            {/* Standardized Header */}
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                        <Sun className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-app-text">Luminance Analysis</h1>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Column: Input & Controls */}
                <aside className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4">
                        <h3 className="text-lg font-semibold text-app-text mb-4">Upload Image</h3>
                        <DropZone
                            onFilesSelected={handleUpload}
                            isProcessing={isUploading}
                            acceptedTypes={['.hdr', '.exr']}
                            maxFiles={1}
                            title="Upload HDR/EXR"
                            description="Drag & drop or click"
                            compact={true}
                        />
                        {error && <p className="text-app-error text-sm mt-2">{error}</p>}
                    </div>

                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4">
                        <DisplayControls
                            exposure={exposure}
                            gamma={gamma}
                            useSrgb={useSrgb}
                            disabled={!sessionId || falseColor}
                            onExposureChange={setExposure}
                            onGammaChange={setGamma}
                            onSrgbChange={setUseSrgb}
                        />
                    </div>

                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4">
                        <FalseColorControls
                            enabled={falseColor}
                            colormap={colormap}
                            min={fcMin}
                            max={fcMax}
                            disabled={!sessionId}
                            onToggle={setFalseColor}
                            onColormapChange={setColormap}
                            onMinChange={setFcMin}
                            onMaxChange={setFcMax}
                        />
                    </div>

                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-app-text mb-2">Analysis Tools</h3>
                        <button
                            onClick={handleCalibrate}
                            disabled={!sessionId}
                            className="w-full flex items-center justify-center gap-2 bg-app-surface-hover hover:bg-app-border border border-app-border text-app-text py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Crosshair className="w-4 h-4" /> Calibrate from Point
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
                            disabled={(!sessionId) || (pixelTags.length === 0 && roiTags.length === 0)}
                            className="w-full flex items-center justify-center gap-2 text-app-error hover:text-red-300 hover:bg-app-error/20 py-2 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-3 h-3" /> Clear Annotations
                        </button>

                        <button
                            onClick={handleShowHistogram}
                            disabled={!sessionId}
                            className="w-full flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface-hover border border-app-border text-app-text py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <BarChart2 className="w-4 h-4" /> View Histogram
                        </button>
                    </div>

                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4 space-y-3">
                        <h3 className="text-lg font-semibold text-app-text">Image Info</h3>
                        <div className="text-xs text-app-text-muted break-all grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                            <span className="font-semibold text-app-text">File:</span> <span>{filename || '-'}</span>
                            <span className="font-semibold text-app-text">Res:</span> <span>{dimensions ? `${dimensions.width} x ${dimensions.height}` : '-'}</span>
                            <span className="font-semibold text-app-text">Avg:</span> <span>{stats ? `${stats.avg.toFixed(2)} cd/m²` : '-'}</span>
                            <span className="font-semibold text-app-text">Max:</span> <span>{stats ? `${stats.max.toFixed(2)} cd/m²` : '-'}</span>
                        </div>
                    </div>
                </aside>

                {/* Main Canvas Area */}
                {/* Main Canvas Area - Compact View */}
                <div className="flex-1 bg-app-surface/30 border border-app-border rounded-2xl relative flex items-center justify-center overflow-hidden p-4 max-h-[740px]">
                    {currentImage && sessionId && dimensions ? (
                        <div className="relative w-full h-full flex flex-col">
                            {/* Canvas Wrapper */}
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

                            {/* Legend - Below Canvas */}
                            {falseColor && colorbar && (
                                <div className="shrink-0 mt-2 flex items-center justify-center w-full bg-transparent">
                                    <img
                                        src={colorbar}
                                        alt="Legend"
                                        className="h-10 w-full object-contain"
                                        style={{ maxWidth: '80%' }}
                                    />
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
            </div>

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
