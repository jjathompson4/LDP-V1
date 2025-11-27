import React from 'react';
import { Monitor } from 'lucide-react';

interface DisplayControlsProps {
    exposure: number;
    gamma: number;
    useSrgb: boolean;
    disabled: boolean;
    onExposureChange: (val: number) => void;
    onGammaChange: (val: number) => void;
    onSrgbChange: (val: boolean) => void;
}

export const DisplayControls: React.FC<DisplayControlsProps> = ({
    exposure,
    gamma,
    useSrgb,
    disabled,
    onExposureChange,
    onGammaChange,
    onSrgbChange,
}) => {
    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-700 pb-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <h3>Display Controls</h3>
            </div>

            <div className="space-y-4">
                {/* Exposure */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Exposure (EV)</span>
                        <span className="text-slate-200 font-mono">{exposure.toFixed(1)}</span>
                    </div>
                    <input
                        type="range"
                        min="-10"
                        max="20"
                        step="0.5"
                        value={exposure}
                        disabled={disabled}
                        onChange={(e) => onExposureChange(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>

                {/* Gamma */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Gamma</span>
                        <span className="text-slate-200 font-mono">{gamma.toFixed(1)}</span>
                    </div>
                    <input
                        type="range"
                        min="1.0"
                        max="3.0"
                        step="0.1"
                        value={gamma}
                        disabled={disabled || useSrgb}
                        onChange={(e) => onGammaChange(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>

                {/* sRGB Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={useSrgb}
                            disabled={disabled}
                            onChange={(e) => onSrgbChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Use sRGB Curve</span>
                </label>
            </div>
        </div>
    );
};
