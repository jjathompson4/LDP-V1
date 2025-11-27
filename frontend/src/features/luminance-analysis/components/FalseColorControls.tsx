import React from 'react';
import { Palette } from 'lucide-react';

interface FalseColorControlsProps {
    enabled: boolean;
    colormap: string;
    min: number;
    max: number;
    disabled: boolean;
    onToggle: (val: boolean) => void;
    onColormapChange: (val: string) => void;
    onMinChange: (val: number) => void;
    onMaxChange: (val: number) => void;
}

export const FalseColorControls: React.FC<FalseColorControlsProps> = ({
    enabled,
    colormap,
    min,
    max,
    disabled,
    onToggle,
    onColormapChange,
    onMinChange,
    onMaxChange,
}) => {
    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <h3>False Color</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        disabled={disabled}
                        onChange={(e) => onToggle(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
            </div>

            {enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Colormap</label>
                        <select
                            value={colormap}
                            onChange={(e) => onColormapChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                        >
                            <option value="jet">Jet</option>
                            <option value="viridis">Viridis</option>
                            <option value="plasma">Plasma</option>
                            <option value="inferno">Inferno</option>
                            <option value="magma">Magma</option>
                            <option value="cividis">Cividis</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Min (cd/m²)</label>
                            <input
                                type="number"
                                value={min}
                                onChange={(e) => onMinChange(parseFloat(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Max (cd/m²)</label>
                            <input
                                type="number"
                                value={max}
                                onChange={(e) => onMaxChange(parseFloat(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
