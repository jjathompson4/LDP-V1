import React from 'react';
import type { AnalysisResult as AnalysisResultType } from '../services/analysisService';

interface AnalysisResultProps {
    result: AnalysisResultType;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
    return (
        <div className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                    <h3 className="text-lg font-semibold text-slate-200 mb-3">Original Image (Tone Mapped)</h3>
                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={`data:image/png;base64,${result.original_image}`} alt="Original" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                    <h3 className="text-lg font-semibold text-slate-200 mb-3">False Color Analysis</h3>
                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={`data:image/png;base64,${result.false_color_image}`} alt="False Color" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Luminance Statistics (cd/m²)</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-4 rounded-lg text-center">
                        <p className="text-slate-400 text-sm mb-1">Minimum</p>
                        <p className="text-2xl font-bold text-slate-100">{result.stats.min.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg text-center">
                        <p className="text-slate-400 text-sm mb-1">Maximum</p>
                        <p className="text-2xl font-bold text-slate-100">{result.stats.max.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg text-center">
                        <p className="text-slate-400 text-sm mb-1">Average</p>
                        <p className="text-2xl font-bold text-slate-100">{result.stats.avg.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
