import React, { useState } from 'react';
import type { ColumnConfig } from '../types';
import { Plus, Trash2, RefreshCw, GripVertical, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_COLUMNS } from '../utils/columns';

interface ExtractionSettingsProps {
    columns: ColumnConfig[];
    setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
}

export const ExtractionSettings: React.FC<ExtractionSettingsProps> = ({ columns, setColumns }) => {
    const [draggedItem, setDraggedItem] = useState<ColumnConfig | null>(null);

    const handleColumnChange = (key: string, field: keyof ColumnConfig, value: any) => {
        setColumns(prev => prev.map(c => c.key === key ? { ...c, [field]: value } : c));
    };

    const handleAddColumn = () => {
        const newKey = `custom_${Date.now()}`;
        const newColumn: ColumnConfig = {
            key: newKey,
            label: 'New Column',
            description: 'Extract data for this new column. Be specific about what to look for.',
            visible: true,
            isDefault: false,
        };
        setColumns(prev => [...prev, newColumn]);
    };

    const handleRemoveColumn = (key: string) => {
        setColumns(prev => prev.filter(c => c.key !== key));
    };

    const handleResetColumn = (key: string) => {
        const defaultColumn = DEFAULT_COLUMNS.find(dc => dc.key === key);
        if (defaultColumn) {
            setColumns(prev => prev.map(c => c.key === key ? defaultColumn : c));
        }
    };

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: ColumnConfig) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: ColumnConfig) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.key === targetItem.key) {
            return;
        }

        const currentIndex = columns.findIndex(c => c.key === draggedItem.key);
        const targetIndex = columns.findIndex(c => c.key === targetItem.key);

        const newColumns = [...columns];
        const [removed] = newColumns.splice(currentIndex, 1);
        newColumns.splice(targetIndex, 0, removed);

        setColumns(newColumns);
        setDraggedItem(null);
    };

    return (
        <div className="p-6 sm:p-8">
            <p className="text-app-text-muted mb-6">Customize the table columns and the AI's data extraction logic. Changes are saved automatically.</p>
            <div className="space-y-4">
                {columns.map(col => (
                    <div
                        key={String(col.key)}
                        className="bg-app-surface-hover p-4 rounded-lg flex flex-col md:flex-row gap-4 md:items-start"
                        draggable
                        onDragStart={(e) => onDragStart(e, col)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, col)}
                    >
                        <div className="flex-shrink-0 flex md:flex-col gap-2 items-center justify-between">
                            <span className="cursor-move text-app-text-muted hover:text-app-text" title="Drag to reorder">
                                <GripVertical className="w-6 h-6" />
                            </span>
                        </div>
                        <div className="flex-grow space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Column Label</label>
                                <input
                                    type="text"
                                    value={col.label}
                                    onChange={(e) => handleColumnChange(String(col.key), 'label', e.target.value)}
                                    className="w-full bg-app-bg border border-app-border rounded-md px-3 py-2 text-app-text focus:ring-2 focus:ring-app-primary focus:border-app-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">AI Extraction Instructions</label>
                                <textarea
                                    value={col.description}
                                    onChange={(e) => handleColumnChange(String(col.key), 'description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-app-bg border border-app-border rounded-md px-3 py-2 text-app-text focus:ring-2 focus:ring-app-primary focus:border-app-primary"
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-row-reverse md:flex-col items-center gap-2 pt-2">
                            <button onClick={() => handleColumnChange(String(col.key), 'visible', !col.visible)} className="p-2 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-surface" title={col.visible ? 'Hide Column' : 'Show Column'}>
                                {col.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                            {col.isDefault ? (
                                <button onClick={() => handleResetColumn(String(col.key))} className="p-2 rounded-full text-app-text-muted hover:text-app-primary hover:bg-app-surface" title="Reset to default instructions">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={() => handleRemoveColumn(String(col.key))} className="p-2 rounded-full text-app-text-muted hover:text-app-error hover:bg-app-surface" title="Delete custom column">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6">
                <button
                    onClick={handleAddColumn}
                    className="w-full flex items-center justify-center gap-2 bg-app-surface-hover text-app-primary font-semibold py-2 px-4 rounded-lg hover:bg-app-border transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-surface"
                >
                    <Plus className="w-5 h-5" />
                    Add Custom Column
                </button>
            </div>
        </div>
    );
};
