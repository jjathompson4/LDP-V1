import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Fixture } from '../features/schedule-builder/types';
import type { AnalysisResult } from '../features/luminance-analysis/services/analysisService';

interface ProjectData {
    name: string;
    fixtures: Fixture[];
    analysisResults: AnalysisResult[];
}

interface ProjectContextType {
    project: ProjectData;
    setProjectName: (name: string) => void;
    setFixtures: (fixtures: Fixture[]) => void;
    addAnalysisResult: (result: AnalysisResult) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [project, setProject] = useState<ProjectData>({
        name: 'Untitled Project',
        fixtures: [],
        analysisResults: [],
    });

    const setProjectName = (name: string) => {
        setProject(prev => ({ ...prev, name }));
    };

    const setFixtures = (fixtures: Fixture[]) => {
        setProject(prev => ({ ...prev, fixtures }));
    };

    const addAnalysisResult = (result: AnalysisResult) => {
        setProject(prev => ({ ...prev, analysisResults: [...prev.analysisResults, result] }));
    };

    return (
        <ProjectContext.Provider value={{ project, setProjectName, setFixtures, addAnalysisResult }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
