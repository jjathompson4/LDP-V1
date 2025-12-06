import { useState, useCallback } from 'react';
import type { Fixture, ProcessedFile, ColumnConfig, SelectedCell } from '../types';
import { extractFixtureDataFromPdf } from '../services/geminiService';
import { getApiKey } from '../utils/apiKey';

interface UseScheduleDataProps {
    columns: ColumnConfig[];
    onApiKeyRequired: () => void;
    onScheduleVisibilityChange?: (visible: boolean) => void;
}

export const useScheduleData = ({ columns, onApiKeyRequired, onScheduleVisibilityChange }: UseScheduleDataProps) => {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const sortFixtures = useCallback(() => {
        setFixtures(prevFixtures =>
            [...prevFixtures].sort((a, b) => a.designation.localeCompare(b.designation))
        );
    }, []);

    const updateFixture = useCallback((id: string, field: keyof Fixture | string, value: string) => {
        setFixtures(prevFixtures =>
            prevFixtures.map(fixture =>
                fixture.id === id ? { ...fixture, [field]: value } : fixture
            )
        );
    }, []);

    const updateMultipleFixtures = useCallback((cells: SelectedCell[], value: string) => {
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
    }, []);

    const deleteFixture = useCallback((id: string) => {
        setFixtures(prev => prev.filter(f => f.id !== id));
    }, []);

    const handleFilesUpload = useCallback(async (files: File[]) => {
        if (!getApiKey()) {
            onApiKeyRequired();
            return;
        }
        setIsProcessing(true);
        if (onScheduleVisibilityChange) onScheduleVisibilityChange(true);

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
    }, [columns, onApiKeyRequired, onScheduleVisibilityChange]);

    const handleReanalyze = useCallback(async (fixtureId: string, file: File) => {
        if (!getApiKey()) {
            onApiKeyRequired();
            return;
        }
        setIsProcessing(true);
        setProcessedFiles(prev => prev.map(pf => pf.name === file.name ? { ...pf, status: 'processing' } : { ...pf, status: 'pending' }));
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
    }, [columns, onApiKeyRequired]);

    return {
        fixtures,
        processedFiles,
        isProcessing,
        sortFixtures,
        updateFixture,
        updateMultipleFixtures,
        deleteFixture,
        handleFilesUpload,
        handleReanalyze
    };
};
