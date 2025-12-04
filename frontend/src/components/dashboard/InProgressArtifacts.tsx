import React from 'react';
import type { InProgressArtifact } from '../../services/dashboardService';

interface InProgressArtifactsProps {
    artifacts: InProgressArtifact[];
}

export const InProgressArtifacts: React.FC<InProgressArtifactsProps> = ({ artifacts }) => {
    return (
        <div className="p-4 grid gap-4">
            {artifacts.length === 0 ? (
                <div className="text-center text-app-text-muted italic py-4">No active drafts found.</div>
            ) : (
                artifacts.map(artifact => (
                    <div key={artifact.id} className="bg-app-surface-hover rounded p-3 border border-app-border hover:border-app-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-app-text">{artifact.name}</div>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {artifact.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-app-text-muted">
                                {artifact.artifactType} • {new Date(artifact.lastUpdatedAt).toLocaleDateString()}
                            </div>
                            <a
                                href={artifact.deepLinkUrl}
                                className="text-xs bg-app-primary hover:bg-app-primary-hover text-white px-3 py-1 rounded transition-colors"
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
