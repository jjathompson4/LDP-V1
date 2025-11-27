import React from 'react';
import type { Project } from '../../services/dashboardService';

interface ProjectHeaderProps {
    project: Project;
    projects: Project[];
    onProjectChange: (projectId: string) => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, projects, onProjectChange }) => {
    return (
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <select
                            value={project.id}
                            onChange={(e) => onProjectChange(e.target.value)}
                            className="bg-slate-700 text-slate-100 text-xl font-bold rounded px-3 py-1 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        {project.number && (
                            <span className="text-slate-400 text-sm font-mono bg-slate-900 px-2 py-1 rounded">
                                {project.number}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {project.client && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">Client:</span>
                                <span className="text-slate-300">{project.client}</span>
                            </div>
                        )}
                        {project.phase && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">Phase:</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/50 text-xs font-medium">
                                    {project.phase}
                                </span>
                            </div>
                        )}
                        {project.location && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">Location:</span>
                                <span className="text-slate-300">{project.location}</span>
                            </div>
                        )}
                    </div>
                </div>
                {project.lightingLead && (
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lighting Lead</div>
                        <div className="flex items-center gap-2 justify-end">
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
                                {project.lightingLead.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-slate-300 font-medium">{project.lightingLead}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
