
import React, { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import {
    getProjects,
    getDashboardSummary,
    createTask,
    createEvent,
    updateBudget,
    updatePlanSet,
    type Project,
    type DashboardSummary
} from '../services/dashboardService';
import { ProjectHeader } from '../components/dashboard/ProjectHeader';
import { MyTasks } from '../components/dashboard/MyTasks';
import { UpcomingEvents } from '../components/dashboard/UpcomingEvents';
import { InProgressArtifacts } from '../components/dashboard/InProgressArtifacts';
import { BudgetSnapshotComponent } from '../components/dashboard/BudgetSnapshot';
import { PlanSetStatusComponent } from '../components/dashboard/PlanSetStatus';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { DashboardWidget } from '../components/dashboard/DashboardWidget';

const Dashboard: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
        return localStorage.getItem('selectedProjectId');
    });
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Widget Layout State
    // We have 3 columns: left, center, right.
    // Each column contains a list of widget IDs.
    const [layout, setLayout] = useState<{ left: string[], center: string[], right: string[] }>({
        left: ['tasks', 'events'],
        center: ['artifacts'],
        right: ['budget', 'plans', 'activity']
    });

    // Load projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await getProjects();
                setProjects(data);
                if (data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(data[0].id);
                }
            } catch (err) {
                setError('Failed to load projects');
                console.error(err);
            }
        };
        fetchProjects();
    }, []);

    // Load dashboard summary when selected project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setLoading(false);
            return;
        }

        localStorage.setItem('selectedProjectId', selectedProjectId);

        const fetchSummary = async () => {
            setLoading(true);
            try {
                const data = await getDashboardSummary(selectedProjectId);
                setSummary(data);
                setError(null);
            } catch (err) {
                setError('Failed to load dashboard summary');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [selectedProjectId]);

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
    };

    const handleCreateTask = async (task: { title: string; type: string; dueDate?: string; description?: string }) => {
        if (!selectedProjectId) return;
        await createTask(selectedProjectId, task);
        // Refresh data
        const data = await getDashboardSummary(selectedProjectId);
        setSummary(data);
    };

    const handleCreateEvent = async (event: { title: string; type: string; startDateTime: string; location?: string }) => {
        if (!selectedProjectId) return;
        await createEvent(selectedProjectId, event);
        const data = await getDashboardSummary(selectedProjectId);
        setSummary(data);
    };

    const handleUpdateBudget = async (budget: { phase: string; budgetHours: number; spentHours: number }) => {
        if (!selectedProjectId) return;
        await updateBudget(selectedProjectId, budget);
        const data = await getDashboardSummary(selectedProjectId);
        setSummary(data);
    };

    const handleUpdatePlanSet = async (planSet: { currentPlanSetName: string; currentPlanSetDate: string }) => {
        if (!selectedProjectId) return;
        await updatePlanSet(selectedProjectId, planSet);
        const data = await getDashboardSummary(selectedProjectId);
        setSummary(data);
    };

    const moveWidget = (widgetId: string, direction: 'up' | 'down' | 'left' | 'right') => {
        setLayout(prev => {
            const newLayout = { ...prev };
            let currentColumn: 'left' | 'center' | 'right' | undefined;
            let index = -1;

            // Find current position
            if (newLayout.left.includes(widgetId)) { currentColumn = 'left'; index = newLayout.left.indexOf(widgetId); }
            else if (newLayout.center.includes(widgetId)) { currentColumn = 'center'; index = newLayout.center.indexOf(widgetId); }
            else if (newLayout.right.includes(widgetId)) { currentColumn = 'right'; index = newLayout.right.indexOf(widgetId); }

            if (!currentColumn || index === -1) return prev;

            // Handle Up/Down (reorder within column)
            if (direction === 'up' && index > 0) {
                const col = [...newLayout[currentColumn]];
                [col[index], col[index - 1]] = [col[index - 1], col[index]];
                newLayout[currentColumn] = col;
            } else if (direction === 'down' && index < newLayout[currentColumn].length - 1) {
                const col = [...newLayout[currentColumn]];
                [col[index], col[index + 1]] = [col[index + 1], col[index]];
                newLayout[currentColumn] = col;
            }

            // Handle Left/Right (move between columns)
            else if (direction === 'left') {
                if (currentColumn === 'center') {
                    newLayout.center = newLayout.center.filter(id => id !== widgetId);
                    newLayout.left = [...newLayout.left, widgetId];
                } else if (currentColumn === 'right') {
                    newLayout.right = newLayout.right.filter(id => id !== widgetId);
                    newLayout.center = [...newLayout.center, widgetId];
                }
            } else if (direction === 'right') {
                if (currentColumn === 'left') {
                    newLayout.left = newLayout.left.filter(id => id !== widgetId);
                    newLayout.center = [...newLayout.center, widgetId];
                } else if (currentColumn === 'center') {
                    newLayout.center = newLayout.center.filter(id => id !== widgetId);
                    newLayout.right = [...newLayout.right, widgetId];
                }
            }

            return newLayout;
        });
    };

    // Modal State
    const [activeModal, setActiveModal] = useState<'task' | 'event' | 'budget' | 'plans' | null>(null);

    const renderWidget = (widgetId: string) => {
        if (!summary) return null;

        switch (widgetId) {
            case 'tasks':
                return (
                    <DashboardWidget
                        key="tasks"
                        title="My Tasks"
                        onMove={(dir) => moveWidget('tasks', dir)}
                        headerAction={
                            <button
                                className="text-xs bg-app-surface-hover hover:bg-app-border text-app-text px-2 py-1 rounded transition-colors border border-app-border"
                                onClick={() => setActiveModal('task')}
                            >
                                + Add Task
                            </button>
                        }
                    >
                        <MyTasks
                            tasks={summary.tasks}
                            onAdd={handleCreateTask}
                            isOpen={activeModal === 'task'}
                            onClose={() => setActiveModal(null)}
                        />
                    </DashboardWidget>
                );
            case 'events':
                return (
                    <DashboardWidget
                        key="events"
                        title="Upcoming Events"
                        onMove={(dir) => moveWidget('events', dir)}
                        headerAction={
                            <button
                                className="text-xs bg-app-surface-hover hover:bg-app-border text-app-text px-2 py-1 rounded transition-colors border border-app-border"
                                onClick={() => setActiveModal('event')}
                            >
                                + Add Event
                            </button>
                        }
                    >
                        <UpcomingEvents
                            events={summary.events}
                            onAdd={handleCreateEvent}
                            isOpen={activeModal === 'event'}
                            onClose={() => setActiveModal(null)}
                        />
                    </DashboardWidget>
                );
            case 'artifacts':
                return (
                    <DashboardWidget key="artifacts" title="In-Progress Artifacts" onMove={(dir) => moveWidget('artifacts', dir)}>
                        <InProgressArtifacts artifacts={summary.artifacts} />
                    </DashboardWidget>
                );
            case 'budget':
                return (
                    <DashboardWidget
                        key="budget"
                        title="Budget & Hours"
                        onMove={(dir) => moveWidget('budget', dir)}
                        headerAction={
                            <button
                                className="text-xs text-app-text-muted hover:text-app-text"
                                onClick={() => setActiveModal('budget')}
                            >
                                Edit
                            </button>
                        }
                    >
                        <BudgetSnapshotComponent
                            snapshot={summary.budgetSnapshot}
                            onUpdate={handleUpdateBudget}
                            isOpen={activeModal === 'budget'}
                            onClose={() => setActiveModal(null)}
                        />
                    </DashboardWidget>
                );
            case 'plans':
                return (
                    <DashboardWidget
                        key="plans"
                        title="Plan Sets & Models"
                        onMove={(dir) => moveWidget('plans', dir)}
                        headerAction={
                            <button
                                className="text-xs text-app-text-muted hover:text-app-text"
                                onClick={() => setActiveModal('plans')}
                            >
                                Update
                            </button>
                        }
                    >
                        <PlanSetStatusComponent
                            status={summary.planSetStatus}
                            onUpdate={handleUpdatePlanSet}
                            isOpen={activeModal === 'plans'}
                            onClose={() => setActiveModal(null)}
                        />
                    </DashboardWidget>
                );
            case 'activity':
                return (
                    <DashboardWidget key="activity" title="Recent Activity" onMove={(dir) => moveWidget('activity', dir)}>
                        <RecentActivity activity={summary.activity} />
                    </DashboardWidget>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-app-text flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-app-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen text-app-text flex flex-col items-center justify-center p-4">
                <div className="text-app-error text-xl mb-4">Error loading dashboard</div>
                <div className="text-app-text-muted mb-6">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-app-primary hover:bg-app-primary-hover text-white px-4 py-2 rounded transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text">
            <header className="bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6 shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-app-text tracking-tight">Dashboard</h1>
                </div>
            </header>
            <div className="p-4 md:p-8 overflow-auto flex-1">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    {selectedProject && (
                        <ProjectHeader
                            project={selectedProject}
                            projects={projects}
                            onProjectChange={handleProjectChange}
                        />
                    )}

                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                            {/* Left Column */}
                            <div className="flex flex-col gap-6">
                                {layout.left.map(renderWidget)}
                            </div>

                            {/* Center Column */}
                            <div className="flex flex-col gap-6">
                                {layout.center.map(renderWidget)}
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-6">
                                {layout.right.map(renderWidget)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



export default Dashboard;
