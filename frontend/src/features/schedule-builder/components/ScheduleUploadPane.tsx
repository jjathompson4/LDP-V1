import React from 'react';
import { UploadCloud, ChevronUp, ChevronDown } from 'lucide-react';
import { DropZone } from '../../../components/shared/DropZone';
import { TOOL_CARD, TOOL_CARD_TITLE, TOOL_ICON_BUTTON } from '../../../styles/toolStyleTokens';

interface ScheduleUploadPaneProps {
    isExpanded: boolean;
    onToggle: () => void;
    onFilesUpload: (files: File[]) => void;
    isProcessing: boolean;
}

export const ScheduleUploadPane: React.FC<ScheduleUploadPaneProps> = ({
    isExpanded,
    onToggle,
    onFilesUpload,
    isProcessing
}) => {
    return (
        <div className={TOOL_CARD}>
            <div className={`p-3 sm:p-4 ${isExpanded ? 'border-b border-app-border/50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UploadCloud className="w-5 h-5 text-app-text-muted" />
                        <h3 className={TOOL_CARD_TITLE}>Upload Product Data Sheets</h3>
                    </div>
                    <button
                        onClick={onToggle}
                        aria-label={isExpanded ? "Collapse upload section" : "Expand upload section"}
                        className={TOOL_ICON_BUTTON}
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="p-6 sm:p-8">
                    <p className="text-app-text-muted mb-6">Drag and drop your PDF files here. We'll extract the lighting data for you.</p>
                    <DropZone
                        onFilesSelected={onFilesUpload}
                        isProcessing={isProcessing}
                        acceptedTypes={['.pdf']}
                        maxFiles={20}
                        title="Upload PDF Specifications"
                        description="Drag & drop or click"
                        compact={true}
                    />
                </div>
            )}
        </div>
    );
};
