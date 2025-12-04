import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Fixture, ColumnConfig, SelectedCell } from '../types';
import { RefreshCw, Trash2, ChevronDown, Table } from 'lucide-react';
import { BulkEditToolbar } from './BulkEditToolbar';

interface ScheduleTableProps {
    fixtures: Fixture[];
    columns: ColumnConfig[];
    updateFixture: (id: string, field: keyof Fixture | string, value: string) => void;
    updateMultipleFixtures: (cells: SelectedCell[], value: string) => void;
    deleteFixture: (id: string) => void;
    onReanalyze: (fixtureId: string, file: File) => void;
    columnWidths: { [key: string]: number };
    setColumnWidths: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
    rowHeights: { [key: string]: number };
    setRowHeights: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
}

const EditableCell: React.FC<{ value: string; onUpdate: (value: string) => void }> = ({ value, onUpdate }) => {
    const isPlaceholder = !value || value.toLowerCase() === 'null' || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'not specified' || value === '--';
    const displayValue = isPlaceholder ? '' : value;

    return (
        <textarea
            value={displayValue}
            placeholder="--"
            onChange={(e) => onUpdate(e.target.value)}
            className="absolute inset-0 w-full h-full bg-transparent p-2 border-none focus:ring-1 focus:ring-cyan-500 focus:bg-slate-700 rounded-md transition resize-none placeholder-slate-400"
        />
    );
};

const EditableDropdownCell: React.FC<{
    value: string;
    options: string[];
    onUpdate: (value: string) => void;
}> = ({ value, options, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        const tdElement = wrapperRef.current?.closest('td');
        if (tdElement) {
            if (isOpen) {
                // When the dropdown is open, elevate its parent cell so the dropdown list
                // can appear on top of all other table content.
                tdElement.style.overflow = 'visible';
                tdElement.style.zIndex = '40';
            } else {
                // Revert only z-index when closed. Overflow is handled by the parent TD
                // style prop to ensure the row resize handle remains visible.
                tdElement.style.zIndex = '';
            }
        }
        // Cleanup to ensure style is removed on unmount.
        return () => {
            if (tdElement) {
                tdElement.style.zIndex = '';
            }
        };
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleOptionClick = (optionValue: string) => {
        if (optionValue === 'custom') {
            onUpdate('');
            setCurrentValue('');
            setIsOpen(false);
            textAreaRef.current?.focus();
        } else {
            onUpdate(optionValue);
            setCurrentValue(optionValue);
            setIsOpen(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        onUpdate(e.target.value);
    };

    const isPlaceholder = !currentValue || currentValue.toLowerCase() === 'null' || currentValue.toLowerCase() === 'n/a' || currentValue.toLowerCase() === 'not specified' || currentValue === '--';
    const displayValue = isPlaceholder ? '' : currentValue;

    return (
        <div
            className="absolute inset-0"
            ref={wrapperRef}
        >
            <textarea
                ref={textAreaRef}
                value={displayValue}
                placeholder="--"
                onChange={handleInputChange}
                className="w-full h-full bg-transparent p-2 pr-7 border-none focus:ring-1 focus:ring-cyan-500 focus:bg-slate-700 rounded-md transition resize-none placeholder-slate-400"
            />
            {options.length > 0 && (
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className="absolute top-2 right-1 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    aria-label="Toggle options"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            )}
            {isOpen && (
                <ul className="absolute z-50 w-44 bg-app-surface border border-app-border rounded-md shadow-lg max-h-60 overflow-y-auto top-8 right-1">
                    {options.map((option, index) => (
                        <li
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className="px-3 py-2 text-sm text-app-text cursor-pointer hover:bg-app-surface-hover"
                        >
                            {option}
                        </li>
                    ))}
                    <li
                        onClick={() => handleOptionClick('custom')}
                        className="px-3 py-2 text-sm text-app-primary cursor-pointer hover:bg-app-surface-hover border-t border-app-border"
                    >
                        Custom...
                    </li>
                </ul>
            )}
        </div>
    );
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
    fixtures,
    columns,
    updateFixture,
    updateMultipleFixtures,
    deleteFixture,
    onReanalyze,
    columnWidths,
    setColumnWidths,
    rowHeights,
    setRowHeights,
}) => {
    const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
    const [selectionAnchor, setSelectionAnchor] = useState<{ fixtureId: string; field: string; rowIndex: number; colIndex: number } | null>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const resizingColumnRef = useRef<string | null>(null);
    const resizingRowRef = useRef<{ id: string; startY: number; startHeight: number } | null>(null);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);
    const reanalyzeInputRef = useRef<HTMLInputElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
        resizingColumnRef.current = columnKey;
        startXRef.current = e.clientX;
        const thElement = tableRef.current?.querySelector(`th[data-key="${columnKey}"]`);
        if (thElement) {
            startWidthRef.current = thElement.clientWidth;
        }
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleRowMouseDown = useCallback((e: React.MouseEvent, fixtureId: string) => {
        const rowElement = (e.currentTarget as HTMLElement).closest('tr');
        if (rowElement) {
            resizingRowRef.current = {
                id: fixtureId,
                startY: e.clientY,
                startHeight: rowElement.clientHeight,
            };
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }
    }, []);

    useEffect(() => {
        const handleColumnMouseMove = (e: MouseEvent) => {
            if (!resizingColumnRef.current) return;
            const currentX = e.clientX;
            const deltaX = currentX - startXRef.current;
            const newWidth = Math.max(startWidthRef.current + deltaX, 48); // Minimum column width

            setColumnWidths(prev => ({
                ...prev,
                [resizingColumnRef.current!]: newWidth
            }));
        };

        const handleColumnMouseUp = () => {
            if (!resizingColumnRef.current) return;
            resizingColumnRef.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleColumnMouseMove);
        document.addEventListener('mouseup', handleColumnMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleColumnMouseMove);
            document.removeEventListener('mouseup', handleColumnMouseUp);
        };
    }, [setColumnWidths]);

    useEffect(() => {
        const handleRowMouseMove = (e: MouseEvent) => {
            if (!resizingRowRef.current) return;
            const { id, startY, startHeight } = resizingRowRef.current;
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(startHeight + deltaY, 60); // Minimum row height 60px
            setRowHeights(prev => ({ ...prev, [id]: newHeight }));
        };

        const handleRowMouseUp = () => {
            if (!resizingRowRef.current) return;
            resizingRowRef.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleRowMouseMove);
        document.addEventListener('mouseup', handleRowMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleRowMouseMove);
            document.removeEventListener('mouseup', handleRowMouseUp);
        };
    }, [setRowHeights]);

    const handleCellMouseDown = (e: React.MouseEvent, fixtureId: string, field: string, rowIndex: number, colIndex: number) => {
        const target = e.target as HTMLElement;
        // Allow clicks on dropdown button without affecting selection
        if (target.closest('button')) {
            return;
        }

        // Prevent default browser behavior (like text selection) when multi-selecting
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }

        const currentCell: SelectedCell = { fixtureId, field };
        const newSelectionInfo = { fixtureId, field, rowIndex, colIndex };

        // SHIFT CLICK LOGIC
        if (e.shiftKey && selectionAnchor) {
            // For simplicity, only allow shift-selection within the same column
            if (selectionAnchor.field !== field) {
                setSelectedCells([currentCell]);
                setSelectionAnchor(newSelectionInfo);
                return;
            }

            const startRow = Math.min(selectionAnchor.rowIndex, rowIndex);
            const endRow = Math.max(selectionAnchor.rowIndex, rowIndex);

            const rangeSelection: SelectedCell[] = [];
            for (let i = startRow; i <= endRow; i++) {
                rangeSelection.push({ fixtureId: fixtures[i].id, field });
            }
            // Shift-click replaces the selection with the range
            setSelectedCells(rangeSelection);
            return;
        }

        // CTRL/CMD CLICK LOGIC
        if (e.ctrlKey || e.metaKey) {
            const isSelected = selectedCells.some(c => c.fixtureId === fixtureId && c.field === field);
            if (isSelected) {
                setSelectedCells(prev => prev.filter(c => !(c.fixtureId === fixtureId && c.field === field)));
                // Set anchor to the last selected cell if one exists
                const lastCell = selectedCells.length > 1 ? selectedCells[selectedCells.length - 2] : null;
                if (lastCell) {
                    const lastFixtureIndex = fixtures.findIndex(f => f.id === lastCell.fixtureId);
                    const lastColumnIndex = columns.findIndex(c => c.key === lastCell.field);
                    setSelectionAnchor({ fixtureId: lastCell.fixtureId, field: String(lastCell.field), rowIndex: lastFixtureIndex, colIndex: lastColumnIndex });
                } else {
                    setSelectionAnchor(null);
                }
            } else {
                setSelectedCells(prev => [...prev, currentCell]);
                setSelectionAnchor(newSelectionInfo);
            }
            return;
        }

        // SIMPLE CLICK LOGIC
        setSelectedCells([currentCell]);
        setSelectionAnchor(newSelectionInfo);
    };

    const isCellSelected = (fixtureId: string, field: string) => {
        return selectedCells.some(c => c.fixtureId === fixtureId && c.field === field);
    };

    const handleReanalyzeClick = (fixtureId: string) => {
        if (reanalyzeInputRef.current) {
            reanalyzeInputRef.current.setAttribute('data-fixture-id', fixtureId);
            reanalyzeInputRef.current.click();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const fixtureId = e.target.getAttribute('data-fixture-id');
        if (file && fixtureId) {
            onReanalyze(fixtureId, file);
        }
        e.target.value = '';
    };

    return (
        <div ref={tableContainerRef} className="relative overflow-x-auto bg-app-surface rounded-2xl shadow-lg border border-app-border">
            <BulkEditToolbar
                selectedCells={selectedCells}
                fixtures={fixtures}
                onApply={updateMultipleFixtures}
                onClear={() => setSelectedCells([])}
                containerRef={tableContainerRef}
            />
            <input
                type="file"
                ref={reanalyzeInputRef}
                onChange={handleFileSelect}
                accept="application/pdf"
                className="hidden"
                data-fixture-id=""
            />
            <table ref={tableRef} className="w-full text-sm text-left text-app-text-muted" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                    {columns.map(header => (
                        <col key={header.key} style={{ width: columnWidths[header.key] ? `${columnWidths[header.key]}px` : undefined }} />
                    ))}
                    <col style={{ width: columnWidths['actions'] ? `${columnWidths['actions']}px` : undefined }} />
                </colgroup>
                <thead className="text-xs text-app-text uppercase bg-app-surface-hover">
                    <tr>
                        {columns.map(header => (
                            <th key={header.key} scope="col" data-key={header.key} className="relative px-4 py-3 border-r border-app-border">
                                <div className="flex items-center">
                                    <span>{header.label}</span>
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, String(header.key))}
                                        title={`Resize ${header.label} column`}
                                        className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize z-10 group"
                                    >
                                        <div className="w-px h-full bg-transparent group-hover:bg-app-primary transition-colors mx-auto"></div>
                                    </div>
                                </div>
                            </th>
                        ))}
                        <th scope="col" data-key="actions" className="relative px-4 py-3">
                            <div className="flex items-center">
                                <span>Actions</span>
                                <div
                                    onMouseDown={(e) => handleMouseDown(e, 'actions')}
                                    title="Resize Actions column"
                                    className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize z-10 group"
                                >
                                    <div className="w-px h-full bg-transparent group-hover:bg-app-primary transition-colors mx-auto"></div>
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {fixtures.length > 0 ? (
                        fixtures.map((fixture, rowIndex) => {
                            const fixtureId = fixture.id;
                            return (
                                <tr
                                    key={fixtureId}
                                    className="bg-app-surface border-b border-app-border hover:bg-app-surface-hover"
                                >
                                    {columns.map((header, colIndex) => {
                                        const field = header.key;
                                        const isSelected = isCellSelected(fixtureId, String(field));
                                        const options = fixture[`${field}Options` as keyof Fixture] as string[] | undefined;
                                        const hasOptions = Array.isArray(options) && options.length > 0;

                                        return (
                                            <td
                                                key={field}
                                                className={`relative p-0 border-r border-app-border align-top ${isSelected ? 'bg-app-primary-soft ring-1 ring-app-primary z-[5]' : ''}`}
                                                onMouseDown={(e) => handleCellMouseDown(e, fixtureId, String(field), rowIndex, colIndex)}
                                                data-cell-id={`${fixtureId}-${field}`}
                                                style={{
                                                    height: rowHeights[fixtureId] ? `${rowHeights[fixtureId]}px` : '60px',
                                                    overflow: 'visible'
                                                }}
                                            >
                                                {hasOptions ? (
                                                    <EditableDropdownCell
                                                        value={String(fixture[field] ?? '')}
                                                        options={options}
                                                        onUpdate={(value) => updateFixture(fixtureId, String(field), value)}
                                                    />
                                                ) : (
                                                    <EditableCell
                                                        value={String(fixture[field] ?? '')}
                                                        onUpdate={(value) => updateFixture(fixtureId, String(field), value)}
                                                    />
                                                )}
                                                <div
                                                    onMouseDown={(e) => handleRowMouseDown(e, fixture.id)}
                                                    title="Resize row"
                                                    className="absolute bottom-[-8px] left-0 w-full h-4 cursor-row-resize z-20 group"
                                                >
                                                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-px bg-transparent group-hover:bg-app-primary transition-colors"></div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td
                                        className="relative p-2 align-top z-[15]"
                                        style={{
                                            height: rowHeights[fixture.id] ? `${rowHeights[fixture.id]}px` : '60px',
                                            overflow: 'visible'
                                        }}
                                    >
                                        <div className="flex items-center justify-end w-full gap-1">
                                            <button
                                                onClick={() => handleReanalyzeClick(fixture.id)}
                                                className="p-1.5 rounded-md text-app-text-muted hover:text-app-primary hover:bg-app-surface-hover transition-colors"
                                                title="Re-analyze with a new PDF"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteFixture(fixture.id)}
                                                className="p-1.5 rounded-md text-app-text-muted hover:text-app-error hover:bg-app-surface-hover transition-colors"
                                                title="Delete Fixture"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div
                                            onMouseDown={(e) => handleRowMouseDown(e, fixture.id)}
                                            title="Resize row"
                                            className="absolute bottom-[-8px] left-0 w-full h-4 cursor-row-resize z-20 group"
                                        >
                                            <div className="absolute top-1/2 -translate-y-1/2 w-full h-px bg-transparent group-hover:bg-app-primary transition-colors"></div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={columns.length + 1} className="p-4 border-b border-app-border">
                                <div className="text-center py-12 px-6 bg-app-surface-hover rounded-lg border-2 border-dashed border-app-border">
                                    <Table className="w-12 h-12 mx-auto text-app-text-muted" />
                                    <h3 className="mt-4 text-xl font-semibold text-app-text">No Fixtures Yet</h3>
                                    <p className="mt-1 text-app-text-muted">Upload product data sheets to begin building your schedule.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
