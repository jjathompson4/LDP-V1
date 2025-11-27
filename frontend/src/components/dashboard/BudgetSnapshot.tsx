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

    let statusColor = 'bg-green-500';
    let statusText = 'On Track';

    if (isOverBudget) {
        statusColor = 'bg-red-500';
        statusText = 'Over Budget';
    } else if (isNearBudget) {
        statusColor = 'bg-yellow-500';
        statusText = 'Near Limit';
    }

    return (
        <>
            <div className="flex-1 flex flex-col justify-center p-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-bold text-slate-100">
                        {percentage}%
                        <span className="text-sm font-normal text-slate-400 ml-2">spent</span>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor} bg-opacity-20 text-${statusColor.split('-')[1]}-300`}>
                        {statusText}
                    </div>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${statusColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                    <span>{snapshot.spentHours}h spent</span>
                    <span>{snapshot.budgetHours}h total</span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-100">Edit Budget</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Phase</label>
                                <select
                                    value={formData.phase}
                                    onChange={e => setFormData({ ...formData, phase: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Concept">Concept</option>
                                    <option value="SD">SD</option>
                                    <option value="DD">DD</option>
                                    <option value="CD">CD</option>
                                    <option value="CA">CA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Budget Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.budgetHours}
                                    onChange={e => setFormData({ ...formData, budgetHours: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Spent Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.spentHours}
                                    onChange={e => setFormData({ ...formData, spentHours: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
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
