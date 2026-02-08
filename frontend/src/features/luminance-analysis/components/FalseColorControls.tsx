import React from 'react';
import { Palette } from 'lucide-react';
import { TOOL_CARD_PADDED, TOOL_INPUT, TOOL_SELECT } from '../../../styles/toolStyleTokens';

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
        <div className={`${TOOL_CARD_PADDED} space-y-4`}>
            <div className="flex items-center justify-between border-b border-app-border pb-2">
                <div className="flex items-center gap-2 text-app-text font-semibold">
                    <Palette className="w-4 h-4 text-app-accent" />
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
                    <div className="w-9 h-5 bg-app-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-app-accent"></div>
                </label>
            </div>

            {enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        <label className="text-xs text-app-text-muted uppercase font-bold tracking-wider">Colormap</label>
                        <select
                            value={colormap}
                            onChange={(e) => onColormapChange(e.target.value)}
                            className={TOOL_SELECT}
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
                            <label className="text-xs text-app-text-muted uppercase font-bold tracking-wider">Min (cd/m²)</label>
                            <input
                                type="number"
                                value={min}
                                onChange={(e) => onMinChange(parseFloat(e.target.value))}
                                className={TOOL_INPUT}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-app-text-muted uppercase font-bold tracking-wider">Max (cd/m²)</label>
                            <input
                                type="number"
                                value={max}
                                onChange={(e) => onMaxChange(parseFloat(e.target.value))}
                                className={TOOL_INPUT}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
