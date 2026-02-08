import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Image as ImageIcon, Loader2, Crosshair, Trash2, BarChart2 } from 'lucide-react';
import { DropZone } from '../../components/shared/DropZone';
import { DisplayControls } from './components/DisplayControls';
import { FalseColorControls } from './components/FalseColorControls';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { HistogramDialog } from './components/HistogramDialog';
import * as api from './services/analysisService';
import { useTheme } from '../../context/ThemeContext';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastContext';
import { PAGE_LAYOUT } from '../../layouts/pageLayoutTokens';
import {
    TOOL_BUTTON_DANGER_GHOST,
    TOOL_BUTTON_SECONDARY,
    TOOL_CANVAS_SURFACE,
    TOOL_CARD_TITLE,
    TOOL_CARD_PADDED,
    TOOL_INPUT,
    TOOL_PAGE_TITLE,
    TOOL_SECTION_LABEL
} from '../../styles/toolStyleTokens';

interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

const LuminanceAnalysisPage: React.FC = () => {
    const { showToast } = useToast();
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
    const [isCalibrateDialogOpen, setIsCalibrateDialogOpen] = useState(false);
    const [calibrationInput, setCalibrationInput] = useState('');
    const [calibrationTarget, setCalibrationTarget] = useState<{ x: number; y: number; value: number } | null>(null);

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

    const handleCalibrate = useCallback(() => {
        if (!sessionId || pixelTags.length === 0) {
            setError("Please select a pixel point first to calibrate.");
            showToast('Select a pixel point before calibrating.', 'info');
            return;
        }
        const lastTag = pixelTags[pixelTags.length - 1];
        setCalibrationTarget({ x: lastTag.x, y: lastTag.y, value: lastTag.value });
        setCalibrationInput('');
        setIsCalibrateDialogOpen(true);
    }, [sessionId, pixelTags, showToast]);

    const handleConfirmCalibrate = useCallback(async () => {
        if (!sessionId || !calibrationTarget) return;
        const known = parseFloat(calibrationInput);
        if (Number.isNaN(known) || known <= 0) {
            setError('Please enter a valid positive luminance value.');
            return;
        }
        try {
            const res = await api.calibrateImage(sessionId, Math.round(calibrationTarget.x), Math.round(calibrationTarget.y), known);
            setStats(res.stats);
            setScaleFactor(res.scaleFactor);
            setPixelTags([]);
            setRoiTags([]);
            setIsCalibrateDialogOpen(false);
            showToast('Calibration updated.', 'success');
        } catch (err) {
            console.error(err);
            setError('Calibration failed');
            showToast('Calibration failed.', 'error');
        }
    }, [sessionId, calibrationTarget, calibrationInput, showToast]);

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
        <div className={PAGE_LAYOUT.root}>
            {/* Standardized Header */}
            <header className={PAGE_LAYOUT.header}>
                <div className="flex items-center gap-3">
                    <div className={PAGE_LAYOUT.headerIcon}>
                        <Sun className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className={TOOL_PAGE_TITLE}>Luminance Analysis</h1>
                    </div>
                </div>
            </header>

            <div className={PAGE_LAYOUT.body}>
                {/* Left Column: Input & Controls */}
                <aside className={PAGE_LAYOUT.sidebar}>
                    <div className={TOOL_CARD_PADDED}>
                        <h3 className={`${TOOL_CARD_TITLE} mb-4`}>Upload Image</h3>
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

                    <DisplayControls
                        exposure={exposure}
                        gamma={gamma}
                        useSrgb={useSrgb}
                        disabled={!sessionId || falseColor}
                        onExposureChange={setExposure}
                        onGammaChange={setGamma}
                        onSrgbChange={setUseSrgb}
                    />

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

                    <div className={`${TOOL_CARD_PADDED} space-y-3`}>
                        <h3 className={`${TOOL_SECTION_LABEL} mb-2`}>Analysis Tools</h3>
                        <button
                            onClick={handleCalibrate}
                            disabled={!sessionId}
                            className={`w-full ${TOOL_BUTTON_SECONDARY}`}
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
                            className={`w-full text-xs ${TOOL_BUTTON_DANGER_GHOST}`}
                        >
                            <Trash2 className="w-3 h-3" /> Clear Annotations
                        </button>

                        <button
                            onClick={handleShowHistogram}
                            disabled={!sessionId}
                            className={`w-full ${TOOL_BUTTON_SECONDARY}`}
                        >
                            <BarChart2 className="w-4 h-4" /> View Histogram
                        </button>
                    </div>

                    <div className={`${TOOL_CARD_PADDED} space-y-3`}>
                        <h3 className={TOOL_CARD_TITLE}>Image Info</h3>
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
                <div className={`flex-1 ${TOOL_CANVAS_SURFACE} relative flex items-center justify-center overflow-hidden p-4 max-h-[740px]`}>
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
                        <div className="text-center text-app-text-muted">
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

            <Dialog
                isOpen={isCalibrateDialogOpen}
                onClose={() => setIsCalibrateDialogOpen(false)}
                title="Calibrate Luminance"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCalibrateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmCalibrate}>
                            Apply Calibration
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    {calibrationTarget && (
                        <p className="text-sm text-app-text-muted">
                            Point ({calibrationTarget.x.toFixed(0)}, {calibrationTarget.y.toFixed(0)}) currently reads {calibrationTarget.value.toFixed(2)} cd/m².
                        </p>
                    )}
                    <div>
                        <label htmlFor="known-luminance" className="block text-sm font-medium text-app-text mb-1">
                            Known luminance (cd/m²)
                        </label>
                        <input
                            id="known-luminance"
                            type="number"
                            min="0"
                            step="0.01"
                            value={calibrationInput}
                            onChange={(e) => setCalibrationInput(e.target.value)}
                            className={TOOL_INPUT}
                            placeholder="e.g. 350"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default LuminanceAnalysisPage;
