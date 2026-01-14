import React, { useState, useMemo } from 'react';
import { useAiConfig } from '../../shared/ai/aiConfigContext';
import { FileDiff } from 'lucide-react';
import { GeminiKeyModal } from '../../shared/ai/GeminiKeyModal';
import { callGemini } from '../../shared/ai/geminiClient';
import type { ComparisonResponse, SheetData } from './types';
import { SheetStatus } from './types';
import { API_BASE_URL as API_URL } from '../../config';

// Components
import { FileUploadSection } from './components/FileUploadSection';
import { SidebarList } from './components/SidebarList';
import { SheetDetailView } from './components/SheetDetailView';
import { TransmittalModal } from './components/TransmittalModal';

const ChangeNarrativePage: React.FC = () => {
    const { geminiApiKey } = useAiConfig();
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    // Inputs
    const [project, setProject] = useState('');
    const [revision, setRevision] = useState('');
    const [prevPdf, setPrevPdf] = useState<File | null>(null);
    const [currPdf, setCurrPdf] = useState<File | null>(null);

    // State
    const [isComparing, setIsComparing] = useState(false);
    const [results, setResults] = useState<ComparisonResponse | null>(null);
    const [sheets, setSheets] = useState<SheetData[]>([]); // Copy of results.sheets for local edits
    const [filterStatus, setFilterStatus] = useState<string>('CHANGED'); // 'ALL', 'CHANGED', 'NEW', 'REVISED'

    // Detail View
    const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);

    // AI State
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    // Derived
    const displayedSheets = useMemo(() => {
        if (!sheets) return [];
        return sheets.filter(s => {
            if (filterStatus === 'ALL') return true;
            if (filterStatus === 'CHANGED') return s.status !== SheetStatus.UNCHANGED;
            return s.status === filterStatus;
        });
    }, [sheets, filterStatus]);

    const handleCompare = async () => {
        if (!prevPdf || !currPdf) return;
        setIsComparing(true);
        try {
            const formData = new FormData();
            formData.append('previousPdf', prevPdf);
            formData.append('currentPdf', currPdf);

            // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/change-narrative/compare`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                let errorMsg = "Comparison failed";
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.detail || errorMsg;
                } catch (e) {
                    try { const text = await res.text(); if (text) errorMsg = text; } catch (e2) { }
                }
                throw new Error(errorMsg);
            }

            const data: ComparisonResponse = await res.json();
            setResults(data);
            setSheets(data.sheets.map(s => ({ ...s, isIncluded: s.status !== SheetStatus.UNCHANGED })));
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setIsComparing(false);
        }
    };

    const handleGenerateSummaries = async () => {
        if (!geminiApiKey) {
            setIsKeyModalOpen(true);
            return;
        }
        setIsGeneratingAi(true);

        const newSheets = [...sheets];

        try {
            for (let i = 0; i < newSheets.length; i++) {
                const sheet = newSheets[i];
                if (!sheet.isIncluded) continue;

                const warningsContext = sheet.warningsForSheet.length > 0
                    ? `\nIMPORTANT WARNINGS: The following inconsistencies were detected: ${sheet.warningsForSheet.join('; ')}. Mention these in the detailed narrative.`
                    : "";

                let changesContext = "";
                if (sheet.changes && sheet.changes.length > 0) {
                    const changeList = sheet.changes.map(c =>
                        `- [${c.type}] "${c.text}" (Near: ${c.location_context || 'General'})`
                    ).join('\n');

                    changesContext = `\nSPECIFIC CHANGES DETECTED:\n${changeList}\n\nINSTRUCTIONS: You are a Lighting Design Construction Administrator. Use the above changes to write the narrative. \n\nREQUIRED FORMAT RULES:\n1. OUTPUT FORMAT:\n   - Provide ONLY a bulleted list.\n   - Do NOT include the Sheet Number/Title in the bullets (that is handled by the system).\n   - TEMPLATE for each bullet: "* [Room Name OR Grid Location] - [1 Sentence description]"\n\n2. EXAMPLES:\n   - "* Vestibule 101 - Added luminaire type TB, removed type TA."\n   - "* General Note 4 - Revised requirements for wireless testing."\n   - "* B-4 Region - Relocated Type X fixture to match grid."\n\n3. CONCISENESS & COMPLETENESS:\n   - Be CONCISE (max 20 words per bullet).
   - GROUP repetitive changes (e.g. "* Entire Sheet - Updated type L1 to L1A globally." or "* Corridors - Relocated Type X.").
   - DO NOT OMIT any valid change.

4. CONTENT RESTRICTIONS (CRITICAL based on user feedback):
   - DO NOT reference "Circuit" or "Relay" info (e.g. "71/R13", "R20", "Circuit 2") UNLESS the change itself is about modifying the circuit.
   - DO NOT use "Grid location near [Circuit Tag]" as a location. If specific room is unknown, use "General Plan Area" or similar generic term.
   - BAD: "* Grid location near 71/R13 - Added type X."
   - GOOD: "* General Plan Area - Added type X."`;
                }

                const prompt = `
                    Summarize the changes for this sheet based on the status: ${sheet.status}.
                    Sheet Number: ${sheet.sheetNumber}
                    Sheet Title: ${sheet.sheetTitle}
                    Kind: ${sheet.sheetKind}
                    ${warningsContext}
                    ${changesContext}
                    
                    Return a JSON object with:
                    {
                        "oneLineSummary": "concise 1 sentence summary",
                        "detailedNarrative": "The bulleted list string"
                    }
                    
                    If status is NEW, describe it as a new issuance.
                    If status is REMOVED, describe it as removed from set.
                    If status is REVISED, assume general revisions unless specific text changes are provided above.
                `;

                const response = await callGemini({
                    apiKey: geminiApiKey,
                    parts: [{ text: prompt }],
                    responseMimeType: "application/json",
                    temperature: 0.0 // Deterministic output
                });

                try {
                    const parsed = JSON.parse(response);
                    newSheets[i] = {
                        ...sheet,
                        oneLineSummary: parsed.oneLineSummary,
                        detailedNarrative: parsed.detailedNarrative
                    };
                    setSheets([...newSheets]); // Update UI incrementally
                } catch (e) {
                    console.error("Failed to parse AI response for sheet " + sheet.sheetNumber);
                }
            }

        } catch (e) {
            console.error("AI Generation failed", e);
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const [isNarrativeModalOpen, setIsNarrativeModalOpen] = useState(false);
    const [transmittalText, setTransmittalText] = useState('');

    const openTransmittalModal = () => {
        const header = `LIGHTING DESIGN NARRATIVE - ${revision || 'REVISION'}\n${project ? `PROJECT: ${project}\n` : ''}\n`;
        const body = displayedSheets
            .filter(s => s.isIncluded)
            .map(s => `${s.sheetNumber} - ${s.sheetTitle}:\n${s.detailedNarrative || s.oneLineSummary || 'No summary available.'}`)
            .join('\n\n');
        setTransmittalText(header + body);
        setIsNarrativeModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-app-bg text-app-text">
            <GeminiKeyModal isVisible={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
            <TransmittalModal
                isOpen={isNarrativeModalOpen}
                onClose={() => setIsNarrativeModalOpen(false)}
                text={transmittalText}
                setText={setTransmittalText}
            />

            {/* Standardized Header */}
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                            <FileDiff className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-app-text">Change Narrative Generator</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!geminiApiKey && (
                            <div className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                                AI Disconnected
                            </div>
                        )}
                        <button
                            onClick={() => setIsKeyModalOpen(true)}
                            className="text-sm text-app-primary hover:underline"
                        >
                            {geminiApiKey ? 'Update API Key' : 'Enter API Key'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Sidebar: Controls & Files */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-app-surface rounded-2xl shadow-lg border border-app-border p-4">
                        <FileUploadSection
                            project={project} setProject={setProject}
                            revision={revision} setRevision={setRevision}
                            prevPdf={prevPdf} setPrevPdf={setPrevPdf}
                            currPdf={currPdf} setCurrPdf={setCurrPdf}
                            isComparing={isComparing} onCompare={handleCompare}
                        />
                    </div>

                    <SidebarList
                        results={results}
                        displayedSheets={displayedSheets}
                        selectedSheetId={selectedSheetId}
                        setSelectedSheetId={setSelectedSheetId}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        isGeneratingAi={isGeneratingAi}
                        onGenerateSummaries={handleGenerateSummaries}
                        onOpenTransmittal={openTransmittalModal}
                    />
                </div>

                {/* Main Content: Detail View */}
                <div className="flex-1 bg-app-surface/30 border border-app-border rounded-2xl overflow-hidden relative">
                    <div className="h-full overflow-y-auto p-8">
                        <SheetDetailView
                            sheetId={selectedSheetId}
                            sheets={sheets}
                            setSheets={setSheets}
                            prevPdf={prevPdf}
                            currPdf={currPdf}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangeNarrativePage;
