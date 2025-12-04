import React from 'react';
import type { ProcessedFile } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ChevronUp, ChevronDown, ClipboardList } from 'lucide-react';

interface ProcessingLogProps {
    files: ProcessedFile[];
    isProcessing: boolean;
    isVisible: boolean;
    toggleVisibility: () => void;
}

export const ProcessingLog: React.FC<ProcessingLogProps> = ({ files, isProcessing, isVisible, toggleVisibility }) => {
    const fileCountText = `(${files.length} ${files.length === 1 ? 'file' : 'files'})`;

    return (
        <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border">
            <div className={`p-3 sm:p-4 ${isVisible ? 'border-b border-app-border/50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isProcessing ? <SpinnerIcon className="w-5 h-5 text-app-primary animate-spin" /> : <ClipboardList className="w-5 h-5 text-app-text-muted" />}
                        <h3 className="text-lg font-semibold text-app-text">
                            Processing Log
                        </h3>
                        {files.length > 0 && <span className="text-sm font-normal text-app-text-muted">{fileCountText}</span>}
                    </div>
                    <button
                        onClick={toggleVisibility}
                        aria-label={isVisible ? "Collapse processing log" : "Expand processing log"}
                        className="p-1.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary"
                    >
                        {isVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            {isVisible && (
                <div className="p-6 sm:p-8">
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {files.length > 0 ? (
                            files.map((file, index) => (
                                <li key={index} className="flex items-center justify-between p-2 rounded-md bg-app-surface-hover">
                                    <span className="font-medium text-app-text truncate pr-4">{file.name}</span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${file.status === 'success' ? 'bg-app-success/20 text-app-success' :
                                        file.status === 'error' ? 'bg-app-error/20 text-app-error' :
                                            'bg-app-border text-app-text-muted'
                                        }`}>
                                        {file.status}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li className="text-center text-app-text-muted py-4">No files processed yet.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
