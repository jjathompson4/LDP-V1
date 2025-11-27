import React, { useState } from 'react';
import type { Event } from '../../services/dashboardService';
import { X } from 'lucide-react'; // Assuming X icon is from lucide-react

interface UpcomingEventsProps {
    events: Event[];
    onAdd: (event: { title: string; type: string; startDateTime: string; location?: string }) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, onAdd, isOpen, onClose }) => {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Presentation': return '📊';
            case 'Deliverable': return '📦';
            case 'InternalReview': return '👀';
            case 'SiteVisit': return '🏗️';
            case 'Travel': return '✈️';
            case 'Meeting': return '🤝'; // Added for new type
            case 'Deadline': return '⏰'; // Added for new type
            default: return '📅';
        }
    };

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Meeting',
        date: '',
        time: '',
        location: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const startDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
            await onAdd({
                title: formData.title,
                type: formData.type,
                startDateTime,
                location: formData.location
            });
            onClose();
            setFormData({ title: '', type: 'Meeting', date: '', time: '', location: '' });
        } catch (error) {
            console.error('Failed to create event:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="p-0 overflow-y-auto flex-1 max-h-[400px]">
                {events.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">No upcoming events.</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {events.map(event => (
                            <div key={event.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-xl">
                                        {getTypeIcon(event.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-200 truncate">{event.title}</div>
                                        <div className="text-sm text-slate-400">
                                            {new Date(event.startDateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {' • '}
                                            {new Date(event.startDateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                        {event.location && (
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                📍 {event.location}
                                            </div>
                                        )}
                                    </div>
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
                            <h3 className="font-bold text-slate-100">Add New Event</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Client Presentation"
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
                                        <option value="Meeting">Meeting</option>
                                        <option value="Deadline">Deadline</option>
                                        <option value="Site Visit">Site Visit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
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
                                    {loading ? 'Adding...' : 'Add Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
