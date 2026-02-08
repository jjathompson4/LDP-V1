
import React, { useState, useRef, useEffect } from 'react';
import { ScheduleTable } from './components/ScheduleTable';
import { ProcessingLog } from './components/ProcessingLog';
import { exportToXLSX } from './utils/export';
import type { ColumnConfig } from './types';
import { ArrowDownAZ, Table2 } from 'lucide-react';
import { DEFAULT_COLUMNS } from './utils/columns';
import { GeminiKeyModal } from '../../shared/ai/GeminiKeyModal';
import { useAiConfig } from '../../shared/ai/aiConfigContext';

// Hooks
import { useScheduleData } from './hooks/useScheduleData';
import { useColumnSizing } from './hooks/useColumnSizing';

// Components
import { ScheduleUploadPane } from './components/ScheduleUploadPane';
import { ColumnSettingsModal } from './components/ColumnSettingsModal';
import { PAGE_LAYOUT } from '../../layouts/pageLayoutTokens';
import {
    TOOL_BUTTON_PRIMARY,
    TOOL_BUTTON_SECONDARY,
    TOOL_CARD_PADDED,
    TOOL_PAGE_TITLE,
    TOOL_SECTION_LABEL
} from '../../styles/toolStyleTokens';

const ScheduleBuilderPage: React.FC = () => {
    // UI Visibility State
    const [isUploadVisible, setIsUploadVisible] = useState(true);
    const [isLogVisible, setIsLogVisible] = useState<boolean>(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

    // Shared AI Config
    const { geminiApiKey } = useAiConfig();
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
        apiKey: geminiApiKey,
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
    const uploadModuleRef = useRef<HTMLDivElement>(null);

    // Save columns
    useEffect(() => {
        try {
            localStorage.setItem('lightingScheduleColumns', JSON.stringify(columns));
        } catch (error) {
            console.error("Failed to save columns to localStorage", error);
        }
    }, [columns]);

    return (
        <div className={PAGE_LAYOUT.root}>
            <GeminiKeyModal isVisible={isApiKeyModalVisible || !geminiApiKey} onClose={() => setIsApiKeyModalVisible(false)} />
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
            <header className={PAGE_LAYOUT.header}>
                <div className="flex items-center gap-3">
                    <div className={PAGE_LAYOUT.headerIcon}>
                        <Table2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className={TOOL_PAGE_TITLE}>Lighting Schedule Builder</h1>
                    </div>
                </div>
            </header>

            <div className={PAGE_LAYOUT.body}>
                {/* Left Sidebar: Controls & Uploads */}
                <aside className={PAGE_LAYOUT.sidebar}>
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

                    <div className={`${TOOL_CARD_PADDED} space-y-3`}>
                        <h3 className={TOOL_SECTION_LABEL}>Actions</h3>
                        <button
                            onClick={sortFixtures}
                            disabled={isProcessing || fixtures.length === 0}
                            className={`w-full ${TOOL_BUTTON_SECONDARY}`}
                        >
                            <ArrowDownAZ className="w-4 h-4" /> Sort A-Z
                        </button>
                        <button
                            onClick={() => exportToXLSX(fixtures, columns.filter(c => c.visible), 'Lighting-Equipment-Schedule', columnWidths, rowHeights)}
                            disabled={isProcessing || fixtures.length === 0}
                            className={`w-full ${TOOL_BUTTON_PRIMARY} disabled:bg-app-surface-hover disabled:text-app-text-muted`}
                        >
                            Export to Excel
                        </button>
                    </div>
                </aside>

                {/* Main Content: Table */}
                <main className="flex-1 rounded-2xl overflow-hidden relative flex flex-col">
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
