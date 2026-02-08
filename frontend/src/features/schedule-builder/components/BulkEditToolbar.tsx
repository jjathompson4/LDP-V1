/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import type { Fixture, SelectedCell } from '../types';
import { X } from 'lucide-react';
import {
    TOOL_BUTTON_PRIMARY,
    TOOL_ICON_BUTTON,
    TOOL_INPUT
} from '../../../styles/toolStyleTokens';

interface BulkEditToolbarProps {
    selectedCells: SelectedCell[];
    fixtures: Fixture[];
    onApply: (cells: SelectedCell[], value: string) => void;
    onClear: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const BulkEditToolbar: React.FC<BulkEditToolbarProps> = ({ selectedCells, fixtures, onApply, onClear, containerRef }) => {
    const [value, setValue] = useState('');
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedCells.length <= 1) {
            setPosition(null);
            return;
        }

        const firstField = selectedCells[0].field;
        const allSameColumn = selectedCells.every(c => c.field === firstField);

        if (!allSameColumn) {
            setPosition(null);
            return;
        }

        const firstCellId = `${selectedCells[0].fixtureId}-${selectedCells[0].field}`;
        const cellElement = containerRef.current?.querySelector(`[data-cell-id="${firstCellId}"]`);

        if (cellElement && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const cellRect = cellElement.getBoundingClientRect();
            setPosition({
                top: cellRect.top - containerRect.top - (toolbarRef.current?.offsetHeight || 50) - 5,
                left: cellRect.left - containerRect.left
            });
        }

        // Initialize value from the first selected cell
        const firstFixture = fixtures.find(f => f.id === selectedCells[0].fixtureId);
        if (firstFixture) {
            const initialValue = firstFixture[firstField] as string;
            const isPlaceholder = !initialValue || ['null', 'n/a', 'not specified', '--'].includes(initialValue.toLowerCase());
            setValue(isPlaceholder ? '' : initialValue);
        }

    }, [selectedCells, fixtures, containerRef]);

    const handleApply = () => {
        onApply(selectedCells, value);
        onClear();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
        if (e.key === 'Escape') {
            onClear();
        }
    };

    if (!position) return null;

    return (
        <div
            ref={toolbarRef}
            className="absolute z-20 bg-app-surface p-2 rounded-2xl border border-app-primary/30 flex items-center gap-2"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Enter bulk value..."
                className={`${TOOL_INPUT} py-1.5`}
            />
            <button
                onClick={handleApply}
                className={`${TOOL_BUTTON_PRIMARY} py-1.5`}
            >
                Apply
            </button>
            <button
                onClick={onClear}
                className={`p-1.5 ${TOOL_ICON_BUTTON}`}
                title="Cancel (Esc)"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
