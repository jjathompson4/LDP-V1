import React from 'react';
import type { ActivityEvent } from '../../services/dashboardService';

interface RecentActivityProps {
    activity: ActivityEvent[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activity }) => {
    return (
        <div className="p-0 overflow-y-auto flex-1 max-h-[300px]">
            {activity.length === 0 ? (
                <div className="p-8 text-center text-app-text-muted italic">No recent activity.</div>
            ) : (
                <div className="divide-y divide-app-border">
                    {activity.map(event => (
                        <div key={event.id} className="p-4 hover:bg-app-surface-hover transition-colors">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-app-surface flex items-center justify-center text-xs font-bold text-app-text-muted">
                                    {event.actor ? event.actor[0] : 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-app-text-muted">
                                        <span className="font-semibold text-app-text">{event.actor || 'System'}</span>
                                        {' '}
                                        {event.summary}
                                    </div>
                                    <div className="text-xs text-app-text-muted mt-1">
                                        {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {' at '}
                                        {new Date(event.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
