import React, { useState, useEffect } from 'react';
import type { BudgetSnapshot } from '../../services/dashboardService';
import { X } from 'lucide-react'; // Assuming lucide-react for the X icon

interface BudgetSnapshotProps {
    snapshot?: BudgetSnapshot;
    onUpdate: (budget: { phase: string; budgetHours: number; spentHours: number }) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export const BudgetSnapshotComponent: React.FC<BudgetSnapshotProps> = ({ snapshot, onUpdate, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phase: '',
        budgetHours: 0,
        spentHours: 0
    });

    useEffect(() => {
        if (snapshot) {
            setFormData({
                phase: snapshot.phase,
                budgetHours: snapshot.budgetHours,
                spentHours: snapshot.spentHours
            });
        }
    }, [snapshot]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(formData);
            onClose();
        } catch (error) {
            console.error('Failed to update budget:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!snapshot) return null; // If no snapshot, render nothing for the main component

    const percentage = Math.min(100, Math.round((snapshot.spentHours / snapshot.budgetHours) * 100));
    const isOverBudget = (snapshot.spentHours / snapshot.budgetHours) * 100 > 100;
    const isNearBudget = (snapshot.spentHours / snapshot.budgetHours) * 100 > 85 && !isOverBudget;

    let statusBg = 'bg-app-success';
    let statusTextClass = 'text-app-success';
    let statusText = 'On Track';

    if (isOverBudget) {
        statusBg = 'bg-app-error';
        statusTextClass = 'text-app-error';
        statusText = 'Over Budget';
    } else if (isNearBudget) {
        statusBg = 'bg-yellow-500'; // Keeping hardcoded for now as no warning token exists
        statusTextClass = 'text-yellow-300';
        statusText = 'Near Limit';
    }

    return (
        <>
            <div className="flex-1 flex flex-col justify-center p-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-bold text-app-text">
                        {percentage}%
                        <span className="text-sm font-normal text-app-text-muted ml-2">spent</span>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${statusBg} bg-opacity-20 ${statusTextClass}`}>
                        {statusText}
                    </div>
                </div>

                <div className="w-full bg-app-surface-hover rounded-full h-3 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${statusBg} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-xs text-app-text-muted">
                    <span>{snapshot.spentHours}h spent</span>
                    <span>{snapshot.budgetHours}h total</span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-app-surface rounded-lg border border-app-primary/30 w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-app-border flex justify-between items-center">
                            <h3 className="font-bold text-app-text">Edit Budget</h3>
                            <button onClick={onClose} className="text-app-text-muted hover:text-app-text">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Phase</label>
                                <select
                                    value={formData.phase}
                                    onChange={e => setFormData({ ...formData, phase: e.target.value })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                >
                                    <option value="Concept">Concept</option>
                                    <option value="SD">SD</option>
                                    <option value="DD">DD</option>
                                    <option value="CD">CD</option>
                                    <option value="CA">CA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Budget Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.budgetHours}
                                    onChange={e => setFormData({ ...formData, budgetHours: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-app-text focus:outline-none focus:border-app-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-app-text-muted mb-1">Spent Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.spentHours}
                                    onChange={e => setFormData({ ...formData, spentHours: parseInt(e.target.value) || 0 })}
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
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
