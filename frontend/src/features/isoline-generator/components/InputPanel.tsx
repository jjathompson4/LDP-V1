import React, { useState, useRef } from 'react';
import type { ComputeRequest, IsolineLevel } from '../../../services/isolineService';

interface InputPanelProps {
    onGenerate: (file: File, params: ComputeRequest) => void;
    isGenerating: boolean;
    scaleBarLength: number;
    setScaleBarLength: (val: number) => void;
    units: 'ft' | 'm';
    gridSize: number | null;
    setGridSize: (size: number | null) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
    onGenerate,
    isGenerating,
    scaleBarLength,
    setScaleBarLength,
    units: currentUnits,
    gridSize,
    setGridSize
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [units, setUnits] = useState<'ft' | 'm'>('ft');
    const [mh, setMh] = useState<number>(25);
    const [calcPlane, setCalcPlane] = useState<number>(0);
    const [llf, setLlf] = useState<number>(1.0);
    const [radiusFactor, setRadiusFactor] = useState<number>(5);
    const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [illuminanceUnits, setIlluminanceUnits] = useState<'fc' | 'lux'>('fc');
    const [isoLevels, setIsoLevels] = useState<IsolineLevel[]>([
        { value: 0.1, color: '#ff0000' },
        { value: 0.5, color: '#00ff00' },
        { value: 1.0, color: '#0000ff' },
    ]);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.toLowerCase().endsWith('.ies')) {
                setError('Please upload a .ies file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (!selectedFile.name.toLowerCase().endsWith('.ies')) {
                setError('Please upload a .ies file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
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

    const handleGenerate = () => {
        if (!file) {
            setError('Please upload an IES file.');
            return;
        }
        if (isoLevels.length === 0) {
            setError('At least one isoline level is required.');
            return;
        }

        // Basic validation
        if (mh <= 0) {
            setError('Mounting height must be positive.');
            return;
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

        onGenerate(file, params);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-neutral-900 rounded-lg shadow-sm border border-neutral-800 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-neutral-100">Input Parameters</h2>

            {/* Photometric File */}
            <div className="p-4 border border-dashed border-neutral-700 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}>
                <div className="flex flex-col items-center justify-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".ies"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-900/20 rounded-md hover:bg-cyan-900/30 border border-cyan-900/50"
                    >
                        {file ? 'Change File' : 'Upload IES File'}
                    </button>
                    <span className="text-sm text-neutral-400">
                        {file ? file.name : 'Drag & drop or click to upload'}
                    </span>
                </div>
            </div>

            {/* Mounting & Calc Plane */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-neutral-300">Mounting & Geometry</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Units</label>
                        <select
                            value={units}
                            onChange={(e) => setUnits(e.target.value as 'ft' | 'm')}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="ft">Feet</option>
                            <option value="m">Meters</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Mounting Height</label>
                        <input
                            type="number"
                            value={mh}
                            onChange={(e) => setMh(parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Calc Plane Z</label>
                        <input
                            type="number"
                            value={calcPlane}
                            onChange={(e) => setCalcPlane(parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">LLF</label>
                        <input
                            type="number"
                            step="0.01"
                            value={llf}
                            onChange={(e) => setLlf(parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            title="Light Loss Factor"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Settings */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-neutral-300">Grid Settings</h3>
                <div>
                    <label className="block text-xs text-neutral-500 mb-1">Radius (x MH)</label>
                    <input
                        type="number"
                        value={radiusFactor}
                        onChange={(e) => setRadiusFactor(parseFloat(e.target.value))}
                        className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-neutral-500 mb-1">Detail Level</label>
                    <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((level) => (
                            <label key={level} className="flex items-center gap-1 text-xs cursor-pointer text-neutral-300">
                                <input
                                    type="radio"
                                    name="detailLevel"
                                    value={level}
                                    checked={detailLevel === level}
                                    onChange={(e) => setDetailLevel(e.target.value as any)}
                                    className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                                />
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scale Bar & Grid Overlay */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-neutral-300">Scale Bar & Grid</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Length ({currentUnits})</label>
                        <input
                            type="number"
                            value={scaleBarLength}
                            onChange={(e) => setScaleBarLength(parseFloat(e.target.value))}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Grid Spacing</label>
                        <select
                            value={gridSize || ''}
                            onChange={(e) => setGridSize(e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="">None</option>
                            <option value="1">1x1 {currentUnits}</option>
                            <option value="5">5x5 {currentUnits}</option>
                            <option value="10">10x10 {currentUnits}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Photometric Output */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-neutral-300">Output Units</h3>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-neutral-300">
                        <input
                            type="radio"
                            name="illUnits"
                            value="fc"
                            checked={illuminanceUnits === 'fc'}
                            onChange={() => setIlluminanceUnits('fc')}
                            className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                        />
                        Footcandles (fc)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-300">
                        <input
                            type="radio"
                            name="illUnits"
                            value="lux"
                            checked={illuminanceUnits === 'lux'}
                            onChange={() => setIlluminanceUnits('lux')}
                            className="text-cyan-500 focus:ring-cyan-500 bg-neutral-800 border-neutral-600"
                        />
                        Lux
                    </label>
                </div>
            </div>

            {/* Isoline Configuration */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-neutral-300">Isolines (Max 5)</h3>
                    <button
                        onClick={addIsoLevel}
                        disabled={isoLevels.length >= 5}
                        className="text-xs text-cyan-400 hover:text-cyan-300 disabled:text-neutral-600"
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
                                className="w-20 bg-neutral-800 border-neutral-700 text-neutral-200 rounded-md shadow-sm text-sm p-1 focus:ring-cyan-500 focus:border-cyan-500"
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
                                className="text-neutral-500 hover:text-red-400"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 text-sm text-red-200 bg-red-900/20 rounded-md border border-red-900/50">
                    {error}
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !file}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isGenerating ? 'Generating...' : 'Generate Isolines'}
            </button>

            {/* Disclaimer */}
            <div className="text-xs text-neutral-500 italic mt-2">
                For preliminary layout and visual reference only; use full AGi32/Lighting design calculations for final documentation and compliance.
            </div>
        </div>
    );
};

export default InputPanel;
