import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DropZoneProps {
    onFilesSelected: (files: File[]) => void;
    acceptedTypes?: string[]; // e.g. ['.pdf', '.zip'] or ['image/*']
    maxFiles?: number;
    title?: string;
    description?: string;
    isProcessing?: boolean;
    disabled?: boolean;
    className?: string;
    compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
    onFilesSelected,
    acceptedTypes,
    maxFiles,
    title = "Upload Files",
    description = "Drag & drop or click",
    isProcessing = false,
    disabled = false,
    className,
    compact = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = useCallback((files: File[]): File[] => {
        setError(null);
        if (maxFiles && files.length > maxFiles) {
            setError(`Max ${maxFiles} files allowed.`);
            return [];
        }

        const validFiles: File[] = [];
        const invalidDetails: string[] = [];

        for (const file of files) {
            if (acceptedTypes && acceptedTypes.length > 0) {
                const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
                const isValid = acceptedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        const baseType = type.slice(0, -2);
                        return file.type.startsWith(baseType);
                    }
                    return type.toLowerCase() === fileExt || type.toLowerCase() === file.type;
                });

                if (!isValid) {
                    invalidDetails.push(`${file.name} (invalid type)`);
                    continue;
                }
            }
            validFiles.push(file);
        }

        if (invalidDetails.length > 0) {
            setError(`Rejected: ${invalidDetails.join(', ')}`);
        }

        return validFiles;
    }, [acceptedTypes, maxFiles]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled || isProcessing) return;
        setIsDragging(true);
    }, [disabled, isProcessing]);

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
        if (disabled || isProcessing) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const validFiles = validateFiles(files);
            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
            e.dataTransfer.clearData();
        }
    }, [disabled, isProcessing, onFilesSelected, validateFiles]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const validFiles = validateFiles(files);
            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
            e.target.value = '';
        }
    }, [onFilesSelected, validateFiles]);

    const handleClick = () => {
        if (!disabled && !isProcessing) {
            fileInputRef.current?.click();
        }
    };

    const acceptAttribute = acceptedTypes?.join(',');

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out group cursor-pointer",
                    compact ? "p-4" : "p-6 sm:p-8",
                    isDragging
                        ? "border-app-primary bg-app-surface-hover scale-[1.01]"
                        : "border-app-border bg-app-surface hover:border-app-text-muted hover:bg-app-surface-hover",
                    (isProcessing || disabled) && "opacity-60 cursor-not-allowed hover:border-app-border hover:bg-app-surface",
                    className
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptAttribute}
                    multiple={maxFiles !== 1}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled || isProcessing}
                />

                <div className={cn("flex items-center text-center", compact ? "gap-3 flex-row" : "flex-col space-y-3")}>
                    {isProcessing ? (
                        <>
                            <Loader2 className={cn("text-app-primary animate-spin", compact ? "w-5 h-5" : "w-8 h-8")} />
                            <div className="text-left">
                                <p className={cn("font-medium text-app-text", compact ? "text-sm" : "text-lg")}>Processing...</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={cn(
                                "rounded-full transition-colors duration-200",
                                isDragging ? "bg-app-primary/20" : "bg-app-surface-hover group-hover:bg-app-primary/10",
                                compact ? "p-2" : "p-3"
                            )}>
                                <UploadCloud className={cn(
                                    "transition-colors duration-200",
                                    isDragging ? "text-app-primary" : "text-app-text-muted group-hover:text-app-primary",
                                    compact ? "w-5 h-5" : "w-8 h-8"
                                )} />
                            </div>
                            <div className={compact ? "text-left" : "space-y-1"}>
                                <p className={cn("font-medium text-app-text", compact ? "text-sm" : "text-lg")}>
                                    {title}
                                </p>
                                {!compact && (
                                    <p className="text-sm text-app-text-muted">
                                        {description}
                                    </p>
                                )}
                                {compact && description && (
                                    <p className="text-xs text-app-text-muted">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 p-2 text-xs text-app-error bg-app-error/10 border border-app-error/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
