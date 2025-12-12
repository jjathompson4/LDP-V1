export interface Project {
    id: string;
    name: string;
    number?: string;
    client?: string;
    phase?: 'Concept' | 'SD' | 'DD' | 'CD' | 'CA';
    location?: string;
    lightingLead?: string;
    isPinned?: boolean;
}

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    type?: 'Schedule' | 'Controls' | 'Canvas' | 'RevitSync' | 'Other';
    status: 'todo' | 'in-progress' | 'done';
    dueDate?: string;
    toolSlug?: string;
    deepLinkUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Event {
    id: string;
    projectId: string;
    title: string;
    type: 'Presentation' | 'Deliverable' | 'InternalReview' | 'SiteVisit' | 'Travel';
    startDateTime: string;
    endDateTime?: string;
    location?: string;
    artifactUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InProgressArtifact {
    id: string;
    projectId: string;
    artifactType: 'Schedule' | 'Controls' | 'Canvas' | 'Analysis' | 'Other';
    name: string;
    status?: 'Draft' | 'NeedsReview' | 'Ready';
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
    deepLinkUrl: string;
}

export interface BudgetSnapshot {
    projectId: string;
    phase: string;
    budgetHours: number;
    spentHours: number;
    lastUpdatedAt: string;
}

export interface PlanSetStatus {
    projectId: string;
    currentPlanSetName: string;
    currentPlanSetDate: string;
    lastModelExportDate?: string;
    planSetUrl?: string;
}

export interface ActivityEvent {
    id: string;
    projectId: string;
    actor?: string;
    timestamp: string;
    summary: string;
    entityType?: string;
    entityId?: string;
    entityUrl?: string;
}

export interface DashboardSummary {
    project: Project;
    tasks: Task[];
    events: Event[];
    artifacts: InProgressArtifact[];
    budgetSnapshot?: BudgetSnapshot;
    planSetStatus?: PlanSetStatus;
    activity: ActivityEvent[];
}

import { API_BASE_URL as API_URL } from '../config';

export const getProjects = async (): Promise<Project[]> => {
    const response = await fetch(`${API_URL}/api/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
};

export const getDashboardSummary = async (projectId: string): Promise<DashboardSummary> => {
    const response = await fetch(`${API_URL}/api/dashboard/summary?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard summary');
    return response.json();
};

export const createTask = async (projectId: string, task: { title: string; type: string; dueDate?: string; description?: string }): Promise<Task> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
};

export const createEvent = async (projectId: string, event: { title: string; type: string; startDateTime: string; location?: string }): Promise<Event> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
};

export const updateBudget = async (projectId: string, budget: { phase: string; budgetHours: number; spentHours: number }): Promise<BudgetSnapshot> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
    });
    if (!response.ok) throw new Error('Failed to update budget');
    return response.json();
};

export const updatePlanSet = async (projectId: string, planSet: { currentPlanSetName: string; currentPlanSetDate: string }): Promise<PlanSetStatus> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/planset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planSet),
    });
    if (!response.ok) throw new Error('Failed to update plan set');
    return response.json();
};
