import React from 'react';
import type { InProgressArtifact } from '../../services/dashboardService';

interface InProgressArtifactsProps {
    artifacts: InProgressArtifact[];
}

export const InProgressArtifacts: React.FC<InProgressArtifactsProps> = ({ artifacts }) => {
    return (
        <div className="p-4 grid gap-4">
            {artifacts.length === 0 ? (
                <div className="text-center text-slate-500 italic py-4">No active drafts found.</div>
            ) : (
                artifacts.map(artifact => (
                    <div key={artifact.id} className="bg-slate-700/50 rounded p-3 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-slate-200">{artifact.name}</div>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/50">
                                {artifact.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-slate-500">
                                {artifact.artifactType} • {new Date(artifact.lastUpdatedAt).toLocaleDateString()}
                            </div>
                            <a
                                href={artifact.deepLinkUrl}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
                            >
                                Resume
                            </a>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
