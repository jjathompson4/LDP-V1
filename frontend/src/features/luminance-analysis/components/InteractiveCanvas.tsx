import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

interface InteractiveCanvasProps {
    imageSrc: string;
    overlaySrc?: string; // For false color legend or other overlays if needed, though legend is separate usually
    width: number;
    height: number;
    onPixelSelect: (x: number, y: number) => void;
    onRoiSelect: (rect: Rect) => void;
    pixelTags: { x: number; y: number; value: number }[];
    roiTags: { rect: Rect; value: number }[];
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
    imageSrc,
    width,
    height,
    onPixelSelect,
    onRoiSelect,
    pixelTags,
    roiTags,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
    const [scale, setScale] = useState({ x: 1, y: 1 });

    // Update scale when image loads or window resizes


    const safeUpdateScale = useCallback(() => {
        if (containerRef.current && width && height) {
            const rect = containerRef.current.getBoundingClientRect();
            const aspect = width / height;
            const containerAspect = rect.width / rect.height;
            let displayWidth, displayHeight;

            if (containerAspect > aspect) {
                displayHeight = rect.height;
                displayWidth = displayHeight * aspect;
            } else {
                displayWidth = rect.width;
                displayHeight = displayWidth / aspect;
            }

            if (displayWidth === 0 || displayHeight === 0) return;

            setScale({
                x: width / displayWidth,
                y: height / displayHeight,
            });

            if (canvasRef.current) {
                canvasRef.current.width = displayWidth;
                canvasRef.current.height = displayHeight;
            }
        }
    }, [width, height]);


    useEffect(() => {
        window.addEventListener('resize', safeUpdateScale);
        // Add a few retries for initial layout
        const t0 = setTimeout(safeUpdateScale, 0);
        const t1 = setTimeout(safeUpdateScale, 100);
        const t2 = setTimeout(safeUpdateScale, 500);
        return () => {
            window.removeEventListener('resize', safeUpdateScale);
            clearTimeout(t0);
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [safeUpdateScale]);

    // Draw overlay whenever tags or drag state changes
    const drawOverlay = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Helper to transform original coords to display coords
        const toDisplay = (x: number, y: number) => ({
            x: x / scale.x,
            y: y / scale.y,
        });

        // Draw Pixel Tags
        ctx.font = '12px Inter, sans-serif';
        ctx.lineWidth = 2;

        pixelTags.forEach(tag => {
            const pos = toDisplay(tag.x, tag.y);
            ctx.fillStyle = 'rgba(255, 112, 112, 0.9)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw label with background for readability
            const text = tag.value.toFixed(1);
            const tm = ctx.measureText(text);
            const tw = tm.width;
            const th = 12; // approx

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(pos.x + 6, pos.y - 14, tw + 4, th + 4);

            ctx.fillStyle = 'white';
            ctx.fillText(text, pos.x + 8, pos.y - 4);
        });

        // Draw ROI Tags
        roiTags.forEach(tag => {
            const p0 = toDisplay(tag.rect.x0, tag.rect.y0);
            const p1 = toDisplay(tag.rect.x1, tag.rect.y1);
            const x = Math.min(p0.x, p1.x);
            const y = Math.min(p0.y, p1.y);
            const w = Math.abs(p1.x - p0.x);
            const h = Math.abs(p1.y - p0.y);

            ctx.strokeStyle = 'rgba(90, 169, 248, 0.9)';
            ctx.strokeRect(x, y, w, h);

            // Draw label with background
            const text = tag.value.toFixed(1);
            const tm = ctx.measureText(text);
            const tw = tm.width;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(x + w + 2, y + h - 12, tw + 4, 16);

            ctx.fillStyle = 'white';
            ctx.fillText(text, x + w + 4, y + h);
        });

        // Draw Drag Rect
        if (isDragging && dragStart && dragCurrent) {
            const p0 = toDisplay(dragStart.x, dragStart.y);
            const p1 = toDisplay(dragCurrent.x, dragCurrent.y);
            const x = Math.min(p0.x, p1.x);
            const y = Math.min(p0.y, p1.y);
            const w = Math.abs(p1.x - p0.x);
            const h = Math.abs(p1.y - p0.y);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        }

    }, [pixelTags, roiTags, isDragging, dragStart, dragCurrent, scale]);

    useEffect(() => {
        drawOverlay();
    }, [drawOverlay]);

    // Handle Mouse Events
    const getCoords = (e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        // Limit x,y to bounds
        const clientX = Math.max(rect.left, Math.min(rect.right, e.clientX));
        const clientY = Math.max(rect.top, Math.min(rect.bottom, e.clientY));

        const x = (clientX - rect.left) * scale.x;
        const y = (clientY - rect.top) * scale.y;
        return {
            x: Math.max(0, Math.min(width - 0.1, x)),
            y: Math.max(0, Math.min(height - 0.1, y))
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // prevent drag issues
        const coords = getCoords(e);
        setIsDragging(true);
        setDragStart(coords);
        setDragCurrent(coords);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setDragCurrent(getCoords(e));
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDragging || !dragStart || !dragCurrent) return;
        setIsDragging(false);

        // Calculate distance in SCREEN pixels to differentiate click vs drag
        const startScreen = { x: dragStart.x / scale.x, y: dragStart.y / scale.y };
        const curScreen = { x: dragCurrent.x / scale.x, y: dragCurrent.y / scale.y };
        const dist = Math.hypot(curScreen.x - startScreen.x, curScreen.y - startScreen.y);

        if (dist < 5) { // 5 screen pixels tolerance
            // Use dragStart for click coordinate
            onPixelSelect(dragStart.x, dragStart.y);
        } else {
            onRoiSelect({
                x0: dragStart.x,
                y0: dragStart.y,
                x1: dragCurrent.x,
                y1: dragCurrent.y,
            });
        }
        setDragStart(null);
        setDragCurrent(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden"
        >
            <img
                src={imageSrc}
                alt="Analysis"
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                onLoad={safeUpdateScale}
            />
            <canvas
                ref={canvasRef}
                className="absolute m-auto cursor-crosshair touch-none"
                style={{
                    // Centered automatically by m-auto + absolute inset-0 logic? 
                    // No, usually needs inset-0 for m-auto to work or explicit positioning.
                    // But here we rely on width/height matching the image.
                    // Let's use left/top/transform approach or just inset-0 if dimensions match.
                    // Since we set width/height on canvas to match displayed image,
                    // we can just center it.
                    pointerEvents: 'auto'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};
