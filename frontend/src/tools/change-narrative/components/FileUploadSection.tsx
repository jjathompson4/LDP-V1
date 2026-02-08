import React from 'react';
import { Upload, FileText } from 'lucide-react';
import {
    TOOL_BUTTON_PRIMARY,
    TOOL_INPUT
} from '../../../styles/toolStyleTokens';

/* --------------------------------------------------------------------------------
 * Helper Component: FileUpload
 * -------------------------------------------------------------------------------- */
const FileUpload: React.FC<{
    label: string;
    file: File | null;
    onFileSelect: (file: File) => void;
}> = ({ label, file, onFileSelect }) => {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-app-text-muted">{label}</span>
            <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-colors ${file ? 'border-app-primary bg-app-primary/5' : 'border-app-border hover:border-app-text-muted hover:bg-app-surface-hover'}`}>
                <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                        if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
                    }}
                />
                {file ? (
                    <>
                        <FileText className="w-8 h-8 text-app-primary mb-2" />
                        <span className="text-sm font-medium text-app-text break-all text-center">{file.name}</span>
                        <span className="text-xs text-app-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-app-text-muted mb-2" />
                        <span className="text-sm text-app-text-muted">Click or Drop PDF</span>
                    </>
                )}
            </div>
        </div>
    );
};

/* --------------------------------------------------------------------------------
 * Component: FileUploadSection
 * -------------------------------------------------------------------------------- */
interface FileUploadSectionProps {
    project: string;
    setProject: (val: string) => void;
    revision: string;
    setRevision: (val: string) => void;
    prevPdf: File | null;
    setPrevPdf: (f: File) => void;
    currPdf: File | null;
    setCurrPdf: (f: File) => void;
    isComparing: boolean;
    onCompare: () => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
    project, setProject,
    revision, setRevision,
    prevPdf, setPrevPdf,
    currPdf, setCurrPdf,
    isComparing, onCompare
}) => {
    return (
        <div className="p-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-app-text-muted">Project Name</label>
                    <input
                        className={`${TOOL_INPUT} mt-1`}
                        value={project}
                        onChange={e => setProject(e.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-app-text-muted">Revision Label *</label>
                    <input
                        className={`${TOOL_INPUT} mt-1`}
                        value={revision}
                        onChange={e => setRevision(e.target.value)}
                        placeholder="e.g. Addendum 04"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FileUpload label="Previous PDF" file={prevPdf} onFileSelect={setPrevPdf} />
                <FileUpload label="Current PDF" file={currPdf} onFileSelect={setCurrPdf} />
            </div>

            <button
                onClick={onCompare}
                disabled={!prevPdf || !currPdf || !revision || isComparing}
                className={`w-full ${TOOL_BUTTON_PRIMARY} ${!prevPdf || !currPdf || !revision || isComparing
                    ? 'bg-app-surface-hover text-app-text-muted cursor-not-allowed'
                    : 'bg-app-primary text-white hover:bg-app-primary-hover'
                    }`}
            >
                {isComparing ? 'Comparing...' : 'Run Comparison'}
            </button>
        </div>
    );
};
