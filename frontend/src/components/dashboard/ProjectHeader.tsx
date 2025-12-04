import React from 'react';
import type { Project } from '../../services/dashboardService';

interface ProjectHeaderProps {
    project: Project;
    projects: Project[];
    onProjectChange: (projectId: string) => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, projects, onProjectChange }) => {
    return (
        <div className="bg-app-surface rounded-lg p-6 shadow-lg border border-app-border mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <select
                            value={project.id}
                            onChange={(e) => onProjectChange(e.target.value)}
                            className="bg-app-surface-hover text-app-text text-xl font-bold rounded px-3 py-1 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        {project.number && (
                            <span className="text-app-text-muted text-sm font-mono bg-app-bg px-2 py-1 rounded">
                                {project.number}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-app-text-muted">
                        {project.client && (
                            <div className="flex items-center gap-1">
                                <span className="text-app-text-muted">Client:</span>
                                <span className="text-app-text">{project.client}</span>
                            </div>
                        )}
                        {project.phase && (
                            <div className="flex items-center gap-1">
                                <span className="text-app-text-muted">Phase:</span>
                                <span className="px-2 py-0.5 rounded-full bg-app-primary-soft text-app-primary border border-app-primary/20 text-xs font-medium">
                                    {project.phase}
                                </span>
                            </div>
                        )}
                        {project.location && (
                            <div className="flex items-center gap-1">
                                <span className="text-app-text-muted">Location:</span>
                                <span className="text-app-text">{project.location}</span>
                            </div>
                        )}
                    </div>
                </div>
                {project.lightingLead && (
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-app-text-muted uppercase tracking-wider mb-1">Lighting Lead</div>
                        <div className="flex items-center gap-2 justify-end">
                            <div className="w-8 h-8 rounded-full bg-app-surface-hover flex items-center justify-center text-xs font-bold text-app-text">
                                {project.lightingLead.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-app-text font-medium">{project.lightingLead}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
