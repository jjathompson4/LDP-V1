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
            className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${isDragging ? 'border-cyan-500 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
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
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <p className="mt-2 text-lg font-semibold text-slate-200">Processing...</p>
                        <p className="text-sm text-slate-400">Analyzing luminance values...</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                            <UploadCloud className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-lg font-semibold text-slate-200">
                            Drag & drop HDR image here or <span className="text-cyan-500">browse</span>
                        </p>
                        <p className="text-sm text-slate-400 mt-1">Supports .hdr and .exr files</p>
                    </>
                )}
            </div>
        </div>
    );
};
