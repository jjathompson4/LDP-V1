import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ScheduleTable } from './components/ScheduleTable';
import { ProcessingLog } from './components/ProcessingLog';
import { ExtractionSettings } from './components/ExtractionSettings';
import { extractFixtureDataFromPdf } from './services/geminiService';
import { exportToXLSX } from './utils/export';
import type { Fixture, ProcessedFile, ColumnConfig, SelectedCell } from './types';
import { ChevronUp, ChevronDown, Settings, UploadCloud, Table, ArrowDownAZ, Table2 } from 'lucide-react';
import { DEFAULT_COLUMNS } from './utils/columns';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getApiKey, setApiKey } from './utils/apiKey';

const ScheduleBuilderPage: React.FC = () => {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isLogVisible, setIsLogVisible] = useState<boolean>(false);
    const [isUploadVisible, setIsUploadVisible] = useState<boolean>(true);
    const [isScheduleVisible, setIsScheduleVisible] = useState<boolean>(false);
    const [isExtractionSettingsVisible, setIsExtractionSettingsVisible] = useState<boolean>(false);
    const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState<boolean>(false);
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        try {
            const savedColumns = localStorage.getItem('lightingScheduleColumns');
            return savedColumns ? JSON.parse(savedColumns) : DEFAULT_COLUMNS;
        } catch (error) {
            console.error("Failed to parse columns from localStorage", error);
            return DEFAULT_COLUMNS;
        }
    });
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const [rowHeights, setRowHeights] = useState<{ [key: string]: number }>({});

    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
    const isResizingContent = useRef(false);
    const contentResizeStartX = useRef(0);
    const contentResizeStartWidth = useRef(0);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const uploadModuleRef = useRef<HTMLDivElement>(null);
    const [uploadModuleHeight, setUploadModuleHeight] = useState<number>(0);
    const [uploadModuleTop, setUploadModuleTop] = useState<number>(0);

    // Refs for measurement elements
    const columnMeasureRef = useRef<HTMLSpanElement>(null);
    const rowMeasureRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!getApiKey()) {
            setIsApiKeyModalVisible(true);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('lightingScheduleColumns', JSON.stringify(columns));
        } catch (error) {
            console.error("Failed to save columns to localStorage", error);
        }
    }, [columns]);

    const calculateRowHeights = useCallback((fixturesToMeasure: Fixture[], currentColumnWidths: { [key: string]: number }) => {
        if (!rowMeasureRef.current || fixturesToMeasure.length === 0) return;

        const measuringArea = rowMeasureRef.current;
        // Ensure box-sizing is consistent. Tailwind uses border-box.
        measuringArea.style.boxSizing = 'border-box';

        const newRowHeights: { [key: string]: number } = {};
        const descriptionColumn = columns.find(c => c.key === 'description');

        if (descriptionColumn?.visible && currentColumnWidths.description > 0) {
            const descriptionColWidth = currentColumnWidths.description;

            fixturesToMeasure.forEach(fixture => {
                // With border-box, set the width to the full column width.
                // The padding is accounted for within this width.
                measuringArea.style.width = `${descriptionColWidth}px`;

                measuringArea.value = String(fixture.description || '');

                // scrollHeight gives the minimum height required for the content to be visible without a scrollbar.
                // This includes the vertical padding of the textarea.
                const requiredHeight = measuringArea.scrollHeight;

                // Use the calculated height, but enforce a minimum.
                newRowHeights[fixture.id] = Math.max(requiredHeight, 60);
            });
        } else {
            // Fallback if the description column isn't visible or sized.
            fixturesToMeasure.forEach(fixture => {
                newRowHeights[fixture.id] = 60; // Default height
            });
        }

        setRowHeights(prev => ({ ...prev, ...newRowHeights }));
    }, [columns]);


    // Effect for auto-sizing columns on first data load
    useEffect(() => {
        // Only run if fixtures exist but widths don't, to prevent re-running.
        if (fixtures.length > 0 && Object.keys(columnWidths).length === 0 && columnMeasureRef.current && contentContainerRef.current) {
            const visibleColumns = columns.filter(c => c.visible);
            const allHeaders = [...visibleColumns, { key: 'actions', label: 'Actions' } as ColumnConfig];

            const measuringSpan = columnMeasureRef.current;
            const idealWidths: { [key: string]: number } = {};

            // Measure headers and a sample of fixtures
            const sampleFixtures = fixtures.slice(0, 20);

            allHeaders.forEach(col => {
                const contents = [col.label, ...sampleFixtures.map(f => String(f[col.key] || ''))];
                let maxWidth = 0;

                contents.forEach(content => {
                    if (content && String(content).trim() !== '') {
                        measuringSpan.textContent = String(content);
                        maxWidth = Math.max(maxWidth, measuringSpan.offsetWidth);
                    }
                });

                let width = maxWidth + 32; // Padding (px-4 = 1rem = 16px on each side)
                if (col.key === 'actions') width = 80;
                if (col.key === 'description') width = Math.min(width, 400);
                if (col.key === 'series') width = Math.min(width, 350);

                idealWidths[col.key] = Math.max(width, 90); // Min width
            });

            const totalIdealWidth = Object.values(idealWidths).reduce((sum, w) => sum + w, 0);
            const containerPadding = 64; // p-8 on each side = 4rem = 64px
            const availableWidth = contentContainerRef.current.clientWidth - containerPadding;
            let newWidths: { [key: string]: number } = {};

            if (totalIdealWidth > availableWidth) {
                const shrinkRatio = availableWidth / totalIdealWidth;
                for (const key in idealWidths) {
                    newWidths[key] = Math.max(idealWidths[key] * shrinkRatio, 80);
                }
            } else {
                newWidths = idealWidths;
            }

            setColumnWidths(newWidths);
        }
    }, [fixtures, columns, columnWidths]);

    // Effect for auto-sizing rows for any unmeasured fixtures once column widths are set
    useEffect(() => {
        const hasColumnWidths = Object.keys(columnWidths).length > 0;
        if (!hasColumnWidths || fixtures.length === 0) {
            return; // Exit if widths aren't ready or there's nothing to measure
        }

        // Identify all fixtures that do not have a height calculated yet.
        const unmeasuredFixtures = fixtures.filter(f => !rowHeights[f.id]);

        if (unmeasuredFixtures.length > 0) {
            // Defer height calculation to ensure the DOM has updated with column widths
            requestAnimationFrame(() => calculateRowHeights(unmeasuredFixtures, columnWidths));
        }
    }, [fixtures, columnWidths, rowHeights, calculateRowHeights]);

    const handleContentResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingContent.current = true;
        contentResizeStartX.current = e.clientX;
        if (contentContainerRef.current) {
            contentResizeStartWidth.current = contentContainerRef.current.offsetWidth;
        }
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingContent.current) return;
            const deltaX = e.clientX - contentResizeStartX.current;
            const newWidth = contentResizeStartWidth.current + deltaX;
            // Set a min width, e.g., 1024px
            setContentWidth(Math.max(1024, newWidth));
        };

        const handleMouseUp = () => {
            isResizingContent.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        if (uploadModuleRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    setUploadModuleHeight(entry.target.getBoundingClientRect().height);
                    if (contentContainerRef.current) {
                        const containerRect = contentContainerRef.current.getBoundingClientRect();
                        const elementRect = entry.target.getBoundingClientRect();
                        setUploadModuleTop(elementRect.top - containerRect.top);
                    }
                }
            });
            resizeObserver.observe(uploadModuleRef.current);
            return () => resizeObserver.disconnect();
        }
    }, [isUploadVisible]);

    const sortFixtures = useCallback(() => {
        setFixtures(prevFixtures =>
            [...prevFixtures].sort((a, b) => a.designation.localeCompare(b.designation))
        );
    }, []);

    const handleFilesUpload = useCallback(async (files: File[]) => {
        if (!getApiKey()) {
            setIsApiKeyModalVisible(true);
            return;
        }
        setIsProcessing(true);
        if (!isScheduleVisible) setIsScheduleVisible(true);

        // Set initial pending status for all files
        const newProcessedFiles: ProcessedFile[] = files.map(file => ({
            name: file.name,
            status: 'pending',
        }));
        setProcessedFiles(prev => [...newProcessedFiles, ...prev]);

        const visibleColumns = columns.filter(c => c.visible);

        for (const file of files) {
            // Update status to processing for the current file
            setProcessedFiles(prev => prev.map(pf => (pf.name === file.name && pf.status === 'pending' ? { ...pf, status: 'processing' } : pf)));

            try {
                const extractedData = await extractFixtureDataFromPdf(file, visibleColumns);
                if (extractedData) {
                    const newFixture: Fixture = {
                        id: `${file.name}-${Date.now()}`,
                        sourceFile: file.name,
                        description: '',
                        manufacturer: '',
                        series: '',
                        lampType: '',
                        driverInfo: '',
                        ...extractedData,
                        designation: extractedData.designation || 'Untitled Fixture',
                        voltage: extractedData.voltage || extractedData.voltageOptions?.[0] || '',
                        wattage: extractedData.wattage || extractedData.wattageOptions?.[0] || '',
                        wattPerFoot: extractedData.wattPerFoot || extractedData.wattPerFootOptions?.[0] || '',
                        deliveredLumens: extractedData.deliveredLumens || extractedData.deliveredLumensOptions?.[0] || '',
                        cct: extractedData.cct || extractedData.cctOptions?.[0] || '',
                        cri: extractedData.cri || extractedData.criOptions?.[0] || '',
                        mounting: extractedData.mounting || extractedData.mountingOptions?.[0] || '',
                        finish: extractedData.finish || extractedData.finishOptions?.[0] || '',
                        notes: '',
                    };

                    setFixtures(prevFixtures => {
                        const allCurrentDesignations = new Set(prevFixtures.map(f => f.designation));
                        let finalDesignation = newFixture.designation;
                        let counter = 2;
                        while (allCurrentDesignations.has(finalDesignation)) {
                            finalDesignation = `${newFixture.designation} (${counter})`;
                            counter++;
                        }
                        const fixtureWithUniqueDesignation = { ...newFixture, designation: finalDesignation };
                        return [...prevFixtures, fixtureWithUniqueDesignation].sort((a, b) => a.designation.localeCompare(b.designation));
                    });

                    setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'success' } : pf));
                } else {
                    throw new Error("No data extracted");
                }
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'error', error: (error as Error).message } : pf));
            }
        }

        setIsProcessing(false);
    }, [columns, isScheduleVisible]);

    const handleReanalyze = useCallback(async (fixtureId: string, file: File) => {
        if (!getApiKey()) {
            setIsApiKeyModalVisible(true);
            return;
        }
        setIsProcessing(true);
        setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'processing' } : { ...pf, status: 'pending' })); // Reset others to pending for clarity
        try {
            const visibleColumns = columns.filter(c => c.visible);
            const extractedData = await extractFixtureDataFromPdf(file, visibleColumns);
            if (extractedData) {
                const updatedData = {
                    ...extractedData,
                    voltage: extractedData.voltage || extractedData.voltageOptions?.[0] || '',
                    wattage: extractedData.wattage || extractedData.wattageOptions?.[0] || '',
                    wattPerFoot: extractedData.wattPerFoot || extractedData.wattPerFootOptions?.[0] || '',
                    deliveredLumens: extractedData.deliveredLumens || extractedData.deliveredLumensOptions?.[0] || '',
                    cct: extractedData.cct || extractedData.cctOptions?.[0] || '',
                    cri: extractedData.cri || extractedData.criOptions?.[0] || '',
                    mounting: extractedData.mounting || extractedData.mountingOptions?.[0] || '',
                    finish: extractedData.finish || extractedData.finishOptions?.[0] || '',
                };
                setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, ...updatedData, sourceFile: file.name } : f).sort((a, b) => a.designation.localeCompare(b.designation)));
                setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'success' } : pf));
            } else {
                throw new Error("Re-analysis failed to extract data.");
            }
        } catch (error) {
            console.error(`Error re-analyzing ${file.name}:`, error);
            setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'error', error: (error as Error).message } : pf));
        }
        setIsProcessing(false);
    }, [columns]);

    const updateFixture = (id: string, field: keyof Fixture | string, value: string) => {
        setFixtures(prevFixtures =>
            prevFixtures.map(fixture =>
                fixture.id === id ? { ...fixture, [field]: value } : fixture
            )
        );
    };

    const updateMultipleFixtures = (cells: SelectedCell[], value: string) => {
        setFixtures(prevFixtures => {
            const fixturesToUpdate = new Map<string, Partial<Fixture>>();
            cells.forEach(cell => {
                if (!fixturesToUpdate.has(cell.fixtureId)) {
                    fixturesToUpdate.set(cell.fixtureId, {});
                }
                fixturesToUpdate.get(cell.fixtureId)![cell.field] = value;
            });

            return prevFixtures.map(fixture => {
                if (fixturesToUpdate.has(fixture.id)) {
                    return { ...fixture, ...fixturesToUpdate.get(fixture.id) };
                }
                return fixture;
            });
        });
    };

    const deleteFixture = (id: string) => {
        setFixtures(prev => prev.filter(f => f.id !== id));
    }

    const handleSaveApiKey = (key: string) => {
        setApiKey(key);
        setIsApiKeyModalVisible(false);
    };

    return (
        <div className="min-h-screen text-app-text-muted font-sans bg-app-bg">
            <ApiKeyModal isVisible={isApiKeyModalVisible} onSave={handleSaveApiKey} />

            {/* Measurement tools for auto-sizing */}
            <div style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
                <span ref={columnMeasureRef} style={{ fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}></span>
                <textarea ref={rowMeasureRef} style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '20px', resize: 'none', padding: '8px', border: 'none', boxSizing: 'border-box' }} rows={1}></textarea>
            </div>

            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border sticky top-0 z-10">
                <div className="container mx-auto p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                            <Table2 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-app-text tracking-tight">Lighting Equipment Schedule Builder</h1>
                    </div>
                </div>
            </header>

            <main className={`px-4 sm:px-6 lg:px-8 pt-8 ${fixtures.length > 0 ? 'pb-[332px]' : 'pb-8'}`}>
                <div
                    ref={contentContainerRef}
                    className="relative max-w-screen-2xl mx-auto"
                    style={{ maxWidth: contentWidth ? `${contentWidth}px` : undefined, width: contentWidth ? '100%' : undefined }}
                >
                    <div className="space-y-8">
                        <div ref={uploadModuleRef} className="bg-app-surface rounded-2xl shadow-lg border border-app-border">
                            <div className={`p-3 sm:p-4 ${isUploadVisible ? 'border-b border-app-border/50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UploadCloud className="w-5 h-5 text-app-text-muted" />
                                        <h3 className="text-lg font-semibold text-app-text">Upload Product Data Sheets</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsUploadVisible(prev => !prev)}
                                        aria-label={isUploadVisible ? "Collapse upload section" : "Expand upload section"}
                                        className="p-1.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary"
                                    >
                                        {isUploadVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            {isUploadVisible && (
                                <div className="p-6 sm:p-8">
                                    <p className="text-app-text-muted mb-6">Drag and drop your PDF files here. We'll extract the lighting data for you.</p>
                                    <FileUpload onFilesUpload={handleFilesUpload} isProcessing={isProcessing} />
                                </div>
                            )}
                        </div>

                        <div>
                            <ProcessingLog
                                files={processedFiles}
                                isProcessing={isProcessing}
                                isVisible={isLogVisible}
                                toggleVisibility={() => setIsLogVisible(prev => !prev)}
                            />
                        </div>

                        <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border">
                            <div className={`p-3 sm:p-4 ${isExtractionSettingsVisible ? 'border-b border-app-border/50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-5 h-5 text-app-text-muted" />
                                        <h3 className="text-lg font-semibold text-app-text">Extraction & Column Settings</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsExtractionSettingsVisible(prev => !prev)}
                                        aria-label={isExtractionSettingsVisible ? "Collapse extraction settings" : "Expand extraction settings"}
                                        className="p-1.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary"
                                    >
                                        {isExtractionSettingsVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            {isExtractionSettingsVisible && (
                                <ExtractionSettings
                                    columns={columns}
                                    setColumns={setColumns}
                                />
                            )}
                        </div>

                        <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border">
                            <div className={`p-3 sm:p-4 ${isScheduleVisible ? 'border-b border-app-border/50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Table className="w-5 h-5 text-app-text-muted" />
                                        <h3 className="text-lg font-semibold text-app-text">Review & Edit Schedule</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsScheduleVisible(prev => !prev)}
                                        aria-label={isScheduleVisible ? "Collapse schedule section" : "Expand schedule section"}
                                        className="p-1.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary"
                                    >
                                        {isScheduleVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {isScheduleVisible && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
                                        <div>
                                            <p className="text-app-text-muted">Click to select, Ctrl/Cmd-click for multiple, Shift-click for range.</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={sortFixtures}
                                                disabled={isProcessing || fixtures.length === 0}
                                                className="w-full sm:w-auto bg-app-surface-hover text-app-text font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-app-border disabled:bg-app-surface disabled:text-app-text-muted disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-bg flex items-center gap-2"
                                            >
                                                <ArrowDownAZ className="w-5 h-5" />
                                                Sort A-Z
                                            </button>

                                            <button
                                                onClick={() => exportToXLSX(fixtures, columns.filter(c => c.visible), 'Lighting-Equipment-Schedule', columnWidths, rowHeights)}
                                                disabled={isProcessing || fixtures.length === 0}
                                                className="w-full sm:w-auto bg-app-primary text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-app-primary-hover disabled:bg-app-surface-hover disabled:text-app-text-muted disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-bg"
                                            >
                                                Export to Excel
                                            </button>
                                        </div>
                                    </div>
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
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        onMouseDown={handleContentResizeMouseDown}
                        className="absolute top-0 right-[-8px] h-full w-4 cursor-col-resize z-20 group"
                        title="Resize width"
                    >
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-1 h-10 bg-app-border group-hover:bg-app-primary transition-colors rounded-full"
                            style={{
                                top: uploadModuleTop + (uploadModuleHeight / 2) - 20, // 20 is half of h-10 (40px)
                            }}
                        ></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ScheduleBuilderPage;
