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
            case 'todo': return 'bg-slate-700 text-slate-300 border-slate-600';
            case 'in-progress': return 'bg-blue-900/30 text-blue-300 border-blue-800/50';
            case 'done': return 'bg-green-900/30 text-green-300 border-green-800/50';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'Schedule': return 'text-purple-300 bg-purple-900/20';
            case 'Controls': return 'text-orange-300 bg-orange-900/20';
            case 'Canvas': return 'text-pink-300 bg-pink-900/20';
            case 'RevitSync': return 'text-cyan-300 bg-cyan-900/20';
            default: return 'text-slate-300 bg-slate-700';
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
                    <div className="p-8 text-center text-slate-500 italic">No tasks assigned.</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {tasks.map(task => (
                            <div key={task.id} className="p-4 hover:bg-slate-700/30 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors cursor-pointer">
                                        {task.title}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                        {task.status.replace('-', ' ')}
                                    </span>
                                </div>
                                {task.description && (
                                    <div className="text-sm text-slate-400 mb-2 line-clamp-1">{task.description}</div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    {task.type && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(task.type)}`}>
                                            {task.type}
                                        </span>
                                    )}
                                    {task.dueDate && (
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <span>Due</span>
                                            <span className={new Date(task.dueDate) < new Date() ? 'text-red-400 font-medium' : ''}>
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        </span>
                                    )}
                                    {task.deepLinkUrl && (
                                        <a href={task.deepLinkUrl} className="ml-auto text-xs text-blue-400 hover:text-blue-300 hover:underline">
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
                    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-100">Add New Task</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Review lighting specs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="General">General</option>
                                        <option value="Review">Review</option>
                                        <option value="Coordination">Coordination</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 h-24 resize-none"
                                    placeholder="Optional details..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium disabled:opacity-50"
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
