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
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
            <div className={`p-3 sm:p-4 ${isVisible ? 'border-b border-slate-700/50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isProcessing ? <SpinnerIcon className="w-5 h-5 text-cyan-500 animate-spin" /> : <ClipboardList className="w-5 h-5 text-slate-400" />}
                        <h3 className="text-lg font-semibold text-slate-100">
                            Processing Log
                        </h3>
                        {files.length > 0 && <span className="text-sm font-normal text-slate-400">{fileCountText}</span>}
                    </div>
                    <button
                        onClick={toggleVisibility}
                        aria-label={isVisible ? "Collapse processing log" : "Expand processing log"}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                                <li key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-700/50">
                                    <span className="font-medium text-slate-300 truncate pr-4">{file.name}</span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${file.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                            file.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-600 text-slate-300'
                                        }`}>
                                        {file.status}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li className="text-center text-slate-400 py-4">No files processed yet.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
