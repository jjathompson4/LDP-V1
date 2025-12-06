import React from 'react';
import { X } from 'lucide-react';
import { ExtractionSettings } from './ExtractionSettings';
import type { ColumnConfig } from '../types';

interface ColumnSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: ColumnConfig[];
    setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
    isOpen,
    onClose,
    columns,
    setColumns
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-app-surface w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-app-border flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-app-border flex items-center justify-between bg-app-surface sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-app-text">Configure Columns</h2>
                        <p className="text-sm text-app-text-muted">Manage table columns and AI extraction logic</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-app-surface-hover rounded-lg transition-colors text-app-text-muted hover:text-app-text"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <ExtractionSettings
                        columns={columns}
                        setColumns={setColumns}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-app-border bg-app-surface flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-app-primary text-white hover:bg-app-primary-hover rounded-lg font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
