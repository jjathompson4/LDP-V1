
import React, { useState, useRef, useEffect } from 'react';
import { ScheduleTable } from './components/ScheduleTable';
import { ProcessingLog } from './components/ProcessingLog';
import { exportToXLSX } from './utils/export';
import type { ColumnConfig } from './types';
import { ArrowDownAZ, Table2 } from 'lucide-react';
import { DEFAULT_COLUMNS } from './utils/columns';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getApiKey, setApiKey } from './utils/apiKey';

// Hooks
import { useScheduleData } from './hooks/useScheduleData';
import { useColumnSizing } from './hooks/useColumnSizing';

// Components
import { ScheduleUploadPane } from './components/ScheduleUploadPane';
import { ColumnSettingsModal } from './components/ColumnSettingsModal';

const ScheduleBuilderPage: React.FC = () => {
    // UI Visibility State
    const [isUploadVisible, setIsUploadVisible] = useState(true);
    // const [isScheduleVisible, setIsScheduleVisible] = useState(true);
    const [isLogVisible, setIsLogVisible] = useState<boolean>(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState<boolean>(false);

    // Columns State
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        try {
            const savedColumns = localStorage.getItem('lightingScheduleColumns');
            return savedColumns ? JSON.parse(savedColumns) : DEFAULT_COLUMNS;
        } catch (error) {
            console.error("Failed to parse columns from localStorage", error);
            return DEFAULT_COLUMNS;
        }
    });

    // Custom Hooks
    const {
        fixtures,
        processedFiles,
        isProcessing,
        sortFixtures,
        updateFixture,
        updateMultipleFixtures,
        deleteFixture,
        handleFilesUpload,
        handleReanalyze
    } = useScheduleData({
        columns,
        onApiKeyRequired: () => setIsApiKeyModalVisible(true),
        onScheduleVisibilityChange: () => { } // Visibility handled by layout now
    });

    const {
        columnWidths,
        setColumnWidths,
        rowHeights,
        setRowHeights,
        columnMeasureRef,
        rowMeasureRef,
        contentContainerRef
    } = useColumnSizing({ fixtures, columns });

    // Content Resizing Logic 
    // const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
    // const isResizingContent = useRef(false);
    // const contentResizeStartX = useRef(0);
    // const contentResizeStartWidth = useRef(0);
    const uploadModuleRef = useRef<HTMLDivElement>(null);
    // const [uploadModuleHeight, setUploadModuleHeight] = useState<number>(0);
    // const [uploadModuleTop, setUploadModuleTop] = useState<number>(0);

    // Initial Auth Check
    useEffect(() => {
        if (!getApiKey()) {
            setIsApiKeyModalVisible(true);
        }
    }, []);

    // Save columns
    useEffect(() => {
        try {
            localStorage.setItem('lightingScheduleColumns', JSON.stringify(columns));
        } catch (error) {
            console.error("Failed to save columns to localStorage", error);
        }
    }, [columns]);

    const handleSaveApiKey = (key: string) => {
        setApiKey(key);
        setIsApiKeyModalVisible(false);
    };

    return (
        <div className="h-full flex flex-col bg-app-bg overflow-hidden">
            <ApiKeyModal isVisible={isApiKeyModalVisible} onSave={handleSaveApiKey} />
            <ColumnSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                columns={columns}
                setColumns={setColumns}
            />

            {/* Measurement tools for auto-sizing */}
            <div style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
                <span ref={columnMeasureRef} style={{ fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}></span>
                <textarea ref={rowMeasureRef} style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '20px', resize: 'none', padding: '8px', border: 'none', boxSizing: 'border-box' }} rows={1}></textarea>
            </div>

            {/* Standardized Header */}
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                        <Table2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-app-text">Lighting Schedule Builder</h1>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Sidebar: Controls & Uploads */}
                <aside className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                    <div ref={uploadModuleRef}>
                        <ScheduleUploadPane
                            isExpanded={isUploadVisible}
                            onToggle={() => setIsUploadVisible(prev => !prev)}
                            onFilesUpload={handleFilesUpload}
                            isProcessing={isProcessing}
                        />
                    </div>

                    <ProcessingLog
                        files={processedFiles}
                        isProcessing={isProcessing}
                        isVisible={isLogVisible}
                        toggleVisibility={() => setIsLogVisible(prev => !prev)}
                    />

                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-app-text">Actions</h3>
                        <button
                            onClick={sortFixtures}
                            disabled={isProcessing || fixtures.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-app-surface-hover hover:bg-app-border border border-app-border text-app-text py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <ArrowDownAZ className="w-4 h-4" /> Sort A-Z
                        </button>
                        <button
                            onClick={() => exportToXLSX(fixtures, columns.filter(c => c.visible), 'Lighting-Equipment-Schedule', columnWidths, rowHeights)}
                            disabled={isProcessing || fixtures.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-app-primary text-white hover:bg-app-primary-hover py-2.5 rounded-lg transition-colors text-sm font-bold shadow-md disabled:bg-app-surface-hover disabled:text-app-text-muted"
                        >
                            Export to Excel
                        </button>
                    </div>
                </aside>

                {/* Main Content: Table */}
                <main className="flex-1 bg-app-bg border border-app-border rounded-2xl overflow-hidden relative flex flex-col">
                    <div ref={contentContainerRef} className="flex-1 overflow-auto bg-app-surface/30 relative">
                        <ScheduleTable
                            fixtures={fixtures}
                            columns={columns.filter(c => c.visible)}
                            updateFixture={updateFixture}
                            updateMultipleFixtures={updateMultipleFixtures}
                            deleteFixture={deleteFixture}
                            onReanalyze={handleReanalyze}
                            columnWidths={columnWidths}
                            setColumnWidths={setColumnWidths}
                            rowHeights={rowHeights}
                            setRowHeights={setRowHeights}
                            onOpenSettings={() => setIsSettingsModalOpen(true)}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ScheduleBuilderPage;
