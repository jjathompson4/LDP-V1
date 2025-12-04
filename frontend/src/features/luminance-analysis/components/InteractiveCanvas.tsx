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
    const updateScale = useCallback(() => {
        if (containerRef.current && width && height) {
            const rect = containerRef.current.getBoundingClientRect();
            // The image is contained, so we need to calculate the actual displayed dimensions
            const aspect = width / height;
            const containerAspect = rect.width / rect.height;

            let displayWidth, displayHeight;

            if (containerAspect > aspect) {
                // Height constrained
                displayHeight = rect.height;
                displayWidth = displayHeight * aspect;
            } else {
                // Width constrained
                displayWidth = rect.width;
                displayHeight = displayWidth / aspect;
            }

            setScale({
                x: width / displayWidth,
                y: height / displayHeight,
            });

            // Resize canvas to match display size
            if (canvasRef.current) {
                canvasRef.current.width = displayWidth;
                canvasRef.current.height = displayHeight;
                drawOverlay();
            }
        }
    }, [width, height]);

    useEffect(() => {
        window.addEventListener('resize', updateScale);
        // Initial update after a short delay to allow layout to settle
        const timer = setTimeout(updateScale, 100);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, [updateScale]);

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
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeText(tag.value.toFixed(1), pos.x + 8, pos.y - 4);
            ctx.fillText(tag.value.toFixed(1), pos.x + 8, pos.y - 4);
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

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeText(tag.value.toFixed(1), x + w + 4, y + h);
            ctx.fillText(tag.value.toFixed(1), x + w + 4, y + h);
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
        const x = (e.clientX - rect.left) * scale.x;
        const y = (e.clientY - rect.top) * scale.y;
        return {
            x: Math.max(0, Math.min(width - 1, x)),
            y: Math.max(0, Math.min(height - 1, y))
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const coords = getCoords(e);
        setIsDragging(true);
        setDragStart(coords);
        setDragCurrent(coords);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setDragCurrent(getCoords(e));
    };

    const handleMouseUp = () => {
        if (!isDragging || !dragStart || !dragCurrent) return;
        setIsDragging(false);

        const dx = Math.abs(dragCurrent.x - dragStart.x);
        const dy = Math.abs(dragCurrent.y - dragStart.y);
        const dist = Math.hypot(dx, dy);

        if (dist < 5 * scale.x) { // Threshold for click vs drag
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
            className="relative w-full h-full flex items-center justify-center bg-app-bg overflow-hidden rounded-lg border border-app-border"
        >
            <img
                src={imageSrc}
                alt="Analysis"
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                onLoad={updateScale}
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 m-auto cursor-crosshair touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};
