
import { useState, forwardRef, useImperativeHandle } from 'react';
import type { ComputeRequest, IsolineLevel } from '../../../services/isolineService';
import { DropZone } from '../../../components/shared/DropZone';

export interface InputPanelHandle {
    getParams: () => { params: ComputeRequest | null; error: string | null };
}

interface InputPanelProps {
    file: File | null;
    setFile: (file: File | null) => void;
    onError: (error: string | null) => void;
    isGenerating: boolean;
    scaleBarLength: number;
    setScaleBarLength: (val: number) => void;
    units: 'ft' | 'm';
    gridSize: number | null;
    setGridSize: (size: number | null) => void;
}

const InputPanel = forwardRef<InputPanelHandle, InputPanelProps>(({
    file,
    setFile,
    onError,
    isGenerating,
    scaleBarLength,
    setScaleBarLength,
    units: currentUnits,
    gridSize,
    setGridSize
}, ref) => {
    const [units, setUnits] = useState<'ft' | 'm'>('ft');
    const [mh, setMh] = useState<number>(25);
    const [calcPlane, setCalcPlane] = useState<number>(0);
    const [llf, setLlf] = useState<number>(1.0);
    const [radiusFactor, setRadiusFactor] = useState<number>(5);
    const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [illuminanceUnits, setIlluminanceUnits] = useState<'fc' | 'lux'>('fc');
    const [isoLevels, setIsoLevels] = useState<IsolineLevel[]>([
        { value: 0.1, color: '#0000ff' },
        { value: 0.5, color: '#00ff00' },
        { value: 1.0, color: '#ff0000' },
    ]);

    useImperativeHandle(ref, () => ({
        getParams: () => {
            if (isoLevels.length === 0) {
                return { params: null, error: 'At least one isoline level is required.' };
            }

            // Basic validation
            if (mh <= 0) {
                return { params: null, error: 'Mounting height must be positive.' };
            }

            const params: ComputeRequest = {
                units,
                mountingHeight: mh,
                calcPlaneHeight: calcPlane,
                radiusFactor,
                detailLevel,
                llf,
                isoLevels,
                illuminanceUnits,
            };
            return { params, error: null };
        }
    }));

    const handleFilesSelected = (files: File[]) => {
        if (files.length === 0) return;
        setFile(files[0]);
        onError(null);
    };

    const addIsoLevel = () => {
        if (isoLevels.length >= 5) return;
        setIsoLevels([...isoLevels, { value: 0, color: '#ffffff' }]);
    };

    const removeIsoLevel = (index: number) => {
        setIsoLevels(isoLevels.filter((_, i) => i !== index));
    };

    const updateIsoLevel = (index: number, field: keyof IsolineLevel, value: any) => {
        const newLevels = [...isoLevels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setIsoLevels(newLevels);
    };

    return (
        <div className="h-full overflow-y-auto pr-2 flex flex-col gap-4">

            {/* Card 1: Upload IES File */}
            <div className="p-4 bg-app-surface rounded-lg shadow-sm border border-app-border">
                <h3 className="text-sm font-medium text-app-text mb-3">1. Upload IES File</h3>
                <div className="w-full">
                    <DropZone
                        onFilesSelected={handleFilesSelected}
                        acceptedTypes={['.ies']}
                        maxFiles={1}
                        title="Upload IES File"
                        description="Drag & drop or click to browse"
                        isProcessing={isGenerating}
                        compact={true}
                    />
                    {file && (
                        <div className="mt-2 p-2 text-xs bg-app-surface-hover rounded text-app-text-muted border border-app-border">
                            Selected: <span className="font-semibold text-app-text">{file.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Card 2: Mounting & Geometry Info */}
            <div className="p-4 bg-app-surface rounded-lg shadow-sm border border-app-border">
                <h3 className="text-sm font-medium text-app-text mb-3">2. Mounting & Geometry</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Units</label>
                        <select
                            value={units}
                            onChange={(e) => setUnits(e.target.value as 'ft' | 'm')}
                            className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                        >
                            <option value="ft">Feet</option>
                            <option value="m">Meters</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Mounting Height</label>
                        <input
                            type="number"
                            value={mh}
                            onChange={(e) => setMh(parseFloat(e.target.value))}
                            className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Calc Plane Z</label>
                        <input
                            type="number"
                            value={calcPlane}
                            onChange={(e) => setCalcPlane(parseFloat(e.target.value))}
                            className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">LLF</label>
                        <input
                            type="number"
                            step="0.01"
                            value={llf}
                            onChange={(e) => setLlf(parseFloat(e.target.value))}
                            className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                            title="Light Loss Factor"
                        />
                    </div>
                </div>
            </div>

            {/* Card 3: Available Drawing Space, detail level, scale bar & grid */}
            <div className="p-4 bg-app-surface rounded-lg shadow-sm border border-app-border">
                <h3 className="text-sm font-medium text-app-text mb-3">3. Display Settings</h3>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Drawing Radius (x MH)</label>
                        <input
                            type="number"
                            value={radiusFactor}
                            onChange={(e) => setRadiusFactor(parseFloat(e.target.value))}
                            className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Detail Level</label>
                        <div className="flex gap-2">
                            {['low', 'medium', 'high'].map((level) => (
                                <label key={level} className="flex items-center gap-1 text-xs cursor-pointer text-app-text">
                                    <input
                                        type="radio"
                                        name="detailLevel"
                                        value={level}
                                        checked={detailLevel === level}
                                        onChange={(e) => setDetailLevel(e.target.value as any)}
                                        className="text-app-primary focus:ring-app-primary bg-app-bg border-app-border"
                                    />
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                            <label className="block text-xs text-app-text-muted mb-1">Scale Bar</label>
                            <input
                                type="number"
                                value={scaleBarLength}
                                onChange={(e) => setScaleBarLength(parseFloat(e.target.value))}
                                className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-app-text-muted mb-1">Grid Spacing</label>
                            <select
                                value={gridSize || ''}
                                onChange={(e) => setGridSize(e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm focus:ring-app-primary focus:border-app-primary"
                            >
                                <option value="">None</option>
                                <option value="1">1x1 {currentUnits}</option>
                                <option value="5">5x5 {currentUnits}</option>
                                <option value="10">10x10 {currentUnits}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 4: Output Units & Isoline Parameters */}
            <div className="p-4 bg-app-surface rounded-lg shadow-sm border border-app-border">
                <h3 className="text-sm font-medium text-app-text mb-3">4. Output & Isolines</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-app-text-muted mb-2">Output Units</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-app-text">
                                <input
                                    type="radio"
                                    name="illUnits"
                                    value="fc"
                                    checked={illuminanceUnits === 'fc'}
                                    onChange={() => setIlluminanceUnits('fc')}
                                    className="text-app-primary focus:ring-app-primary bg-app-bg border-app-border"
                                />
                                Footcandles (fc)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-app-text">
                                <input
                                    type="radio"
                                    name="illUnits"
                                    value="lux"
                                    checked={illuminanceUnits === 'lux'}
                                    onChange={() => setIlluminanceUnits('lux')}
                                    className="text-app-primary focus:ring-app-primary bg-app-bg border-app-border"
                                />
                                Lux
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-app-text-muted">Isoline Levels (Max 5)</label>
                            <button
                                onClick={addIsoLevel}
                                disabled={isoLevels.length >= 5}
                                className="text-xs text-app-primary hover:text-app-primary-hover disabled:text-app-text-muted"
                            >
                                + Add
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {isoLevels.map((level, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={level.value}
                                        onChange={(e) => updateIsoLevel(idx, 'value', parseFloat(e.target.value))}
                                        className="w-20 bg-app-bg border-app-border text-app-text rounded-md shadow-sm text-sm p-1 focus:ring-app-primary focus:border-app-primary"
                                        placeholder="Value"
                                    />
                                    <input
                                        type="color"
                                        value={level.color}
                                        onChange={(e) => updateIsoLevel(idx, 'color', e.target.value)}
                                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
                                    />
                                    <button
                                        onClick={() => removeIsoLevel(idx)}
                                        className="text-app-text-muted hover:text-app-accent"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <div className="text-xs text-app-text-muted border-t border-app-border pt-4">
                    <strong className="block mb-1 font-semibold text-app-text">Disclaimer:</strong>
                    This tool is intended for preliminary layout and visual reference only. It should not be used as a substitute for professional lighting design software or calculations. Always verify results with industry-standard tools (e.g., AGi32) for final documentation, code compliance, and construction purposes.
                </div>
            </div>
        </div>
    );
});

export default InputPanel;
