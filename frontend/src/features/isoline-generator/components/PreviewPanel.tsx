import React, { useState, useRef } from 'react';
import type { ComputeResponse } from '../../../services/isolineService';
import { TOOL_BUTTON_SECONDARY, TOOL_CANVAS_SURFACE } from '../../../styles/toolStyleTokens';

interface PreviewPanelProps {
    data: ComputeResponse | null;
    isLoading: boolean;
    scaleBarLength: number;
    gridSize: number | null;
    includeScaleBar?: boolean;
    includeLabels?: boolean;
    includeGrid?: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
    data,
    isLoading,
    scaleBarLength,
    gridSize,
    includeScaleBar = true,
    includeLabels = true,
    includeGrid = false
}) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const newScale = e.deltaY < 0 ? transform.scale * scaleFactor : transform.scale / scaleFactor;
        // Clamp scale
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));
        setTransform({ ...transform, scale: clampedScale });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setTransform({ ...transform, x: transform.x + dx, y: transform.y + dy });
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    if (isLoading) {
        return (
            <div className={`${TOOL_CANVAS_SURFACE} flex items-center justify-center h-full`}>
                <div className="text-app-text-muted">Generating preview...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`${TOOL_CANVAS_SURFACE} flex items-center justify-center h-full`}>
                <div className="text-app-text-muted text-center p-4">
                    Upload an IES file, adjust parameters, and click Preview Isolines.
                </div>
            </div>
        );
    }

    // Calculate viewBox
    const { minX, maxX, minY, maxY } = data.extents;
    const width = maxX - minX;
    const height = maxY - minY;
    // Add some padding
    const padding = Math.max(width, height) * 0.1;
    const vbX = minX - padding;
    const vbY = minY - padding;
    const vbW = width + padding * 2;
    const vbH = height + padding * 2;

    // Generate Grid Lines
    const renderGrid = () => {
        // Only render if includeGrid is true AND gridSize is set
        if (!includeGrid || !gridSize) return null;

        const lines = [];
        const strokeWidth = width * 0.001;


        // Vertical lines
        const startX = Math.floor(minX / gridSize) * gridSize;
        for (let x = startX; x <= maxX; x += gridSize) {
            lines.push(
                <line
                    key={`v${x}`}
                    x1={x} y1={minY}
                    x2={x} y2={maxY}
                    className="stroke-app-text/30"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 4}`}
                />
            );
        }

        // Horizontal lines
        const startY = Math.floor(minY / gridSize) * gridSize;
        for (let y = startY; y <= maxY; y += gridSize) {
            lines.push(
                <line
                    key={`h${y}`}
                    x1={minX} y1={y}
                    x2={maxX} y2={y}
                    className="stroke-app-text/30"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 4}`}
                />
            );
        }

        return <g>{lines}</g>;
    };

    return (
        <div
            className={`${TOOL_CANVAS_SURFACE} relative h-full overflow-hidden cursor-move`}
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: 'center',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <svg
                    viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ vectorEffect: 'non-scaling-stroke' }} // Doesn't work on group, need on elements
                >
                    {/* Grid Overlay */}
                    {renderGrid()}

                    {/* Isolines */}
                    {data.levels.map((level, idx) => (
                        <g key={idx} stroke={level.color} fill="none" strokeWidth={width * 0.002}>
                            {level.paths.map((path, pIdx) => (
                                <polyline
                                    key={pIdx}
                                    points={path.map(pt => pt.join(',')).join(' ')}
                                />
                            ))}
                        </g>
                    ))}

                    {/* Labels */}
                    {includeLabels && data.levels.map((level, idx) => (
                        <g key={`lbl-${idx}`} fill={level.color} style={{ fontSize: width * 0.015 }}>
                            {level.labels.map((label, lIdx) => (
                                <text
                                    key={lIdx}
                                    x={label.x}
                                    y={label.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    stroke="var(--color-bg)"
                                    strokeWidth={width * 0.005}
                                    paintOrder="stroke"
                                >
                                    {label.text}
                                </text>
                            ))}
                        </g>
                    ))}

                    {/* Crosshair */}
                    <g className="stroke-app-text" strokeWidth={width * 0.002}>
                        <line x1={-width * 0.02} y1={0} x2={width * 0.02} y2={0} />
                        <line x1={0} y1={-width * 0.02} x2={0} y2={width * 0.02} />
                    </g>
                    <text
                        x={width * 0.025}
                        y={-width * 0.025}
                        fontSize={width * 0.02}
                        className="fill-app-text"
                    >
                        MH={data.mountingHeight}{data.units}
                    </text>

                    {/* Scale Bar (Bottom Left of data) */}
                    {includeScaleBar && (
                        <g transform={`translate(${minX + width * 0.05}, ${maxY - height * 0.05})`}>
                            <line x1={0} y1={0} x2={scaleBarLength} y2={0} className="stroke-app-text" strokeWidth={width * 0.004} />
                            <text x={0} y={width * 0.02} fontSize={width * 0.02} className="fill-app-text">{scaleBarLength} {data.units}</text>
                        </g>
                    )}

                </svg>
            </div>

            {/* Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                    className={TOOL_BUTTON_SECONDARY}
                    onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
                    title="Reset View"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default PreviewPanel;
