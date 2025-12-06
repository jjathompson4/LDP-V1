import { useState, useRef, useEffect, useCallback } from 'react';
import type { Fixture, ColumnConfig } from '../types';

interface UseColumnSizingProps {
    fixtures: Fixture[];
    columns: ColumnConfig[];
}

export const useColumnSizing = ({ fixtures, columns }: UseColumnSizingProps) => {
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const [rowHeights, setRowHeights] = useState<{ [key: string]: number }>({});

    // Refs for measurement elements that need to be attached to DOM
    const columnMeasureRef = useRef<HTMLSpanElement>(null);
    const rowMeasureRef = useRef<HTMLTextAreaElement>(null);
    // Ideally pass container ref or calculate available width differently, but for now we follow existing logic
    // We will ask the consumer to attach a ref to the container and pass it, OR we expose a ref for them to attach.
    // Let's expose refs.
    const contentContainerRef = useRef<HTMLDivElement>(null);

    const calculateRowHeights = useCallback((fixturesToMeasure: Fixture[], currentColumnWidths: { [key: string]: number }) => {
        if (!rowMeasureRef.current || fixturesToMeasure.length === 0) return;

        const measuringArea = rowMeasureRef.current;
        measuringArea.style.boxSizing = 'border-box';

        const newRowHeights: { [key: string]: number } = {};
        const descriptionColumn = columns.find(c => c.key === 'description');

        if (descriptionColumn?.visible && currentColumnWidths.description > 0) {
            const descriptionColWidth = currentColumnWidths.description;

            fixturesToMeasure.forEach(fixture => {
                measuringArea.style.width = `${descriptionColWidth}px`;
                measuringArea.value = String(fixture.description || '');
                const requiredHeight = measuringArea.scrollHeight;
                newRowHeights[fixture.id] = Math.max(requiredHeight, 60);
            });
        } else {
            fixturesToMeasure.forEach(fixture => {
                newRowHeights[fixture.id] = 60;
            });
        }

        setRowHeights(prev => ({ ...prev, ...newRowHeights }));
    }, [columns]);

    // Auto-sizing columns
    useEffect(() => {
        if (fixtures.length > 0 && Object.keys(columnWidths).length === 0 && columnMeasureRef.current && contentContainerRef.current) {
            const visibleColumns = columns.filter(c => c.visible);
            const allHeaders = [...visibleColumns, { key: 'actions', label: 'Actions' } as ColumnConfig];

            const measuringSpan = columnMeasureRef.current;
            const idealWidths: { [key: string]: number } = {};
            const sampleFixtures = fixtures.slice(0, 20);

            allHeaders.forEach(col => {
                const contents = [col.label, ...sampleFixtures.map(f => String(f[col.key] || ''))];
                let maxWidth = 0;

                contents.forEach(content => {
                    if (content && String(content).trim() !== '') {
                        measuringSpan.textContent = String(content);
                        maxWidth = Math.max(maxWidth, measuringSpan.offsetWidth);
                    }
                });

                let width = maxWidth + 32;
                if (col.key === 'actions') width = 80;
                if (col.key === 'description') width = Math.min(width, 400);
                if (col.key === 'series') width = Math.min(width, 350);

                idealWidths[col.key] = Math.max(width, 90);
            });

            const totalIdealWidth = Object.values(idealWidths).reduce((sum, w) => sum + w, 0);
            const containerPadding = 64;
            const availableWidth = contentContainerRef.current.clientWidth - containerPadding;
            let newWidths: { [key: string]: number } = {};

            if (totalIdealWidth > availableWidth) {
                const shrinkRatio = availableWidth / totalIdealWidth;
                for (const key in idealWidths) {
                    newWidths[key] = Math.max(idealWidths[key] * shrinkRatio, 80);
                }
            } else {
                newWidths = idealWidths;
            }

            setColumnWidths(newWidths);
        }
    }, [fixtures, columns, columnWidths]);

    // Auto-sizing rows
    useEffect(() => {
        const hasColumnWidths = Object.keys(columnWidths).length > 0;
        if (!hasColumnWidths || fixtures.length === 0) {
            return;
        }

        const unmeasuredFixtures = fixtures.filter(f => !rowHeights[f.id]);

        if (unmeasuredFixtures.length > 0) {
            requestAnimationFrame(() => calculateRowHeights(unmeasuredFixtures, columnWidths));
        }
    }, [fixtures, columnWidths, rowHeights, calculateRowHeights]);

    return {
        columnWidths,
        setColumnWidths,
        rowHeights,
        setRowHeights,
        columnMeasureRef,
        rowMeasureRef,
        contentContainerRef
    };
};
