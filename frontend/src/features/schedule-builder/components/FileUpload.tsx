import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { unzipPdfsFromFile } from '../utils/zipProcessor';

interface FileUploadProps {
    onFilesUpload: (files: File[]) => void;
    isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processAndUploadFiles = useCallback(async (incomingFiles: File[]) => {
        const filesToProcess: File[] = [];
        for (const file of incomingFiles) {
            if (file.type === 'application/pdf') {
                filesToProcess.push(file);
            } else if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip')) {
                try {
                    const pdfsFromZip = await unzipPdfsFromFile(file);
                    filesToProcess.push(...pdfsFromZip);
                } catch (error) {
                    console.error(`Error processing zip file ${file.name}:`, error);
                    // TODO: Add user feedback for failed ZIP extraction.
                }
            }
        }

        if (filesToProcess.length > 0) {
            onFilesUpload(filesToProcess);
        }
    }, [onFilesUpload]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processAndUploadFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    }, [processAndUploadFiles]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processAndUploadFiles(Array.from(e.target.files));
            // Clear the input value to allow re-uploading the same file
            e.target.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${isDragging ? 'border-app-primary bg-app-surface-hover' : 'border-app-border bg-app-surface hover:border-app-text-muted'
                } ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,application/zip"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
            />
            <div className="flex flex-col items-center text-center">
                {isProcessing ? (
                    <>
                        <SpinnerIcon className="w-8 h-8 text-app-primary animate-spin" />
                        <p className="mt-2 text-lg font-semibold text-app-text">Processing...</p>
                        <p className="text-sm text-app-text-muted">Please wait while we analyze your files.</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-app-surface-hover flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-app-text-muted" />
                        </div>
                        <p className="text-lg font-semibold text-app-text">
                            Drag & drop files here or <span className="text-app-primary">browse</span>
                        </p>
                        <p className="text-sm text-app-text-muted mt-1">Supports multiple PDF and ZIP files</p>
                    </>
                )}
            </div>
        </div>
    );
};
