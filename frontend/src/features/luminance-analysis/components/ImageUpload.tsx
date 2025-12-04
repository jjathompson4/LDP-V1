import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    onUpload: (file: File) => void;
    isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.toLowerCase().endsWith('.hdr') || file.name.toLowerCase().endsWith('.exr')) {
                onUpload(file);
            } else {
                alert("Please upload an .hdr or .exr file.");
            }
            e.dataTransfer.clearData();
        }
    }, [onUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files[0]);
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
                accept=".hdr,.exr"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
            />
            <div className="flex flex-col items-center text-center">
                {isProcessing ? (
                    <>
                        <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
                        <p className="mt-2 text-lg font-semibold text-app-text">Processing...</p>
                        <p className="text-sm text-app-text-muted">Analyzing luminance values...</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-app-surface-hover flex items-center justify-center mb-4">
                            <UploadCloud className="w-8 h-8 text-app-text-muted" />
                        </div>
                        <p className="text-lg font-semibold text-app-text">
                            Drag & drop HDR image here or <span className="text-app-primary">browse</span>
                        </p>
                        <p className="text-sm text-app-text-muted mt-1">Supports .hdr and .exr files</p>
                    </>
                )}
            </div>
        </div>
    );
};
