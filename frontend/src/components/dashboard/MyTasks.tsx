import React from 'react';
import type { Task } from '../../services/dashboardService';
import { X } from 'lucide-react';

interface MyTasksProps {
    tasks: Task[];
    onAdd: (task: { title: string; type: string; dueDate?: string; description?: string }) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export const MyTasks: React.FC<MyTasksProps> = ({ tasks, onAdd, isOpen, onClose }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-app-surface-hover text-app-text-muted border-app-border';
            case 'in-progress': return 'bg-app-primary-soft text-app-primary border-app-primary/20';
            case 'done': return 'bg-app-success/10 text-app-success border-app-success/20';
            default: return 'bg-app-surface-hover text-app-text-muted';
        }
    };

    const getTypeColor = (type?: string) => {
        // Using arbitrary colors for types, but could map to tokens if we had them.
        // For now, keeping them somewhat consistent but using opacity utilities if possible,
        // or just hardcoded colors that work on both backgrounds (or we need specific tokens).
        // Let's use specific colors but with theme-aware opacity if possible.
        // Since we don't have specific type tokens, I'll use hardcoded colors that should work on dark/light
        // or map them to primary/accent/etc.
        switch (type) {
            case 'Schedule': return 'text-purple-400 bg-purple-500/10';
            case 'Controls': return 'text-orange-400 bg-orange-500/10';
            case 'Canvas': return 'text-pink-400 bg-pink-500/10';
            case 'RevitSync': return 'text-cyan-400 bg-cyan-500/10';
            default: return 'text-app-text-muted bg-app-surface-hover';
        }
    };

    const [loading, setLoading] = React.useState(false);

    const [formData, setFormData] = React.useState({
        title: '',
        type: 'General',
        dueDate: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(formData);
            onClose();
            setFormData({ title: '', type: 'General', dueDate: '', description: '' });
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="p-0 overflow-y-auto flex-1 max-h-[400px]">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-app-text-muted italic">No tasks assigned.</div>
                ) : (
                    <div className="divide-y divide-app-border">
                        {tasks.map(task => (
                            <div key={task.id} className="p-4 hover:bg-app-surface-hover transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-app-text group-hover:text-app-primary transition-colors cursor-pointer">
                                        {task.title}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                        {task.status.replace('-', ' ')}
                                    </span>
                                </div>
                                {task.description && (
                                    <div className="text-sm text-app-text-muted mb-2 line-clamp-1">{task.description}</div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    {task.type && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(task.type)}`}>
                                            {task.type}
                                        </span>
                                    )}
                                    {task.dueDate && (
                                        <span className="text-xs text-app-text-muted flex items-center gap-1">
                                            <span>Due</span>
                                            <span className={new Date(task.dueDate) < new Date() ? 'text-app-error font-medium' : ''}>
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        </span>
                                    )}
                                    {task.deepLinkUrl && (
                                        <a href={task.deepLinkUrl} className="ml-auto text-xs text-app-primary hover:text-app-primary-hover hover:underline">
                                            Open &rarr;
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-app-surface rounded-lg border border-app-primary/30 w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-app-border flex justify-between items-center">
                            <h3 className="font-bold text-app-text">Add New Task</h3>
                            <button onClick={onClose} className="text-app-text-muted hover:text-app-text">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                    placeholder="e.g. Review lighting specs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-app-text-muted mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                    >
                                        <option value="General">General</option>
                                        <option value="Review">Review</option>
                                        <option value="Coordination">Coordination</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-app-text-muted mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary h-24 resize-none"
                                    placeholder="Optional details..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-app-text-muted hover:text-app-text"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-app-primary hover:bg-app-primary-hover text-white rounded font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
