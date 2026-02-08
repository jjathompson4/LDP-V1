import React, { useState, useEffect } from 'react';
import type { PlanSetStatus } from '../../services/dashboardService';
import { X } from 'lucide-react'; // Assuming lucide-react for the X icon

interface PlanSetStatusProps {
    status?: PlanSetStatus;
    onUpdate: (planSet: { currentPlanSetName: string; currentPlanSetDate: string }) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export const PlanSetStatusComponent: React.FC<PlanSetStatusProps> = ({ status, onUpdate, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPlanSetName: '',
        currentPlanSetDate: ''
    });

    useEffect(() => {
        if (status) {
            setFormData({
                currentPlanSetName: status.currentPlanSetName,
                currentPlanSetDate: status.currentPlanSetDate.split('T')[0] // Format for date input
            });
        }
    }, [status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate({
                currentPlanSetName: formData.currentPlanSetName,
                currentPlanSetDate: new Date(formData.currentPlanSetDate).toISOString()
            });
            onClose();
        } catch (error) {
            console.error('Failed to update plan set:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!status) return null;

    const isOutdated = status.lastModelExportDate && status.currentPlanSetDate &&
        new Date(status.lastModelExportDate) > new Date(status.currentPlanSetDate);

    const renderContent = () => {
        return (
            <>
                <div className="flex-1 flex flex-col justify-center gap-4 p-4">
                    <div>
                        <div className="text-xs text-app-text-muted uppercase tracking-wider mb-1">Current Posted Set</div>
                        <div className="font-medium text-app-text">{status.currentPlanSetName}</div>
                        <div className="text-sm text-app-text-muted">
                            {new Date(status.currentPlanSetDate).toLocaleDateString()}
                        </div>
                    </div>

                    {status.lastModelExportDate && (
                        <div className={`p-3 rounded border ${isOutdated ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-app-success/10 border-app-success/20'}`}>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{isOutdated ? '⚠️' : '✓'}</span>
                                <div>
                                    <div className={`text-sm font-bold ${isOutdated ? 'text-yellow-500' : 'text-app-success'}`}>
                                        {isOutdated ? 'Newer model detected' : 'Up to date'}
                                    </div>
                                    <div className="text-xs text-app-text-muted mt-1">
                                        Last export: {new Date(status.lastModelExportDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <>
            {renderContent()}

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-app-surface rounded-lg border border-app-primary/30 w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-app-border flex justify-between items-center">
                            <h3 className="font-bold text-app-text">Update Plan Set</h3>
                            <button onClick={onClose} className="text-app-text-muted hover:text-app-text">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Set Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.currentPlanSetName}
                                    onChange={e => setFormData({ ...formData, currentPlanSetName: e.target.value })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                    placeholder="e.g. 50% DD Submission"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.currentPlanSetDate}
                                    onChange={e => setFormData({ ...formData, currentPlanSetDate: e.target.value })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
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
                                    {loading ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
