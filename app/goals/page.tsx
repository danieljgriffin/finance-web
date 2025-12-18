'use client';

import { useEffect, useState } from 'react';
import { api, Goal } from '@/lib/apiClient';
import { Plus, Target, Calendar, CheckSquare, Trash2, Edit2, CheckCircle, MoreVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [netWorth, setNetWorth] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Goal>>({
        title: '',
        target_amount: 0,
        target_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setIsLoading(true);
            const [goalsData, summaryData] = await Promise.all([
                api.getGoals(),
                api.getNetWorthSummary().catch(() => ({ total_networth: 0 }))
            ]);

            setGoals(goalsData);
            setNetWorth(summaryData.total_networth || 0);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setIsLoading(false);
        }
    }

    const openCreateModal = () => {
        setEditingGoal(null);
        setFormData({
            title: '',
            target_amount: 0,
            target_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'active'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            target_amount: goal.target_amount,
            target_date: goal.target_date,
            status: goal.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingGoal) {
                await api.updateGoal(editingGoal.id, formData);
            } else {
                await api.createGoal(formData as any);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Failed to save goal", err);
            alert("Failed to save goal");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            await api.deleteGoal(id);
            fetchData();
        } catch (err) {
            console.error("Failed to delete goal", err);
        }
    };

    const toggleStatus = async (goal: Goal) => {
        try {
            const newStatus = goal.status === 'active' ? 'completed' : 'active';
            await api.updateGoal(goal.id, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const setAsPrimary = async (goal: Goal, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.updateGoal(goal.id, { is_primary: true });
            fetchData();
        } catch (err) {
            console.error("Failed to set primary goal", err);
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active');

    // Determine the "Current Active Goal"
    // 1. Explicitly marked as primary
    // 2. OR Defaults to nearest target date
    const sortedActiveGoals = [...activeGoals].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
    const primaryGoal = activeGoals.find(g => g.is_primary) || sortedActiveGoals[0];

    // Upcoming are all active goals that are NOT the primary one
    const upcomingGoals = primaryGoal ? sortedActiveGoals.filter(g => g.id !== primaryGoal.id) : [];

    const completedGoals = goals.filter(g => g.status === 'completed');
    const displayGoals = activeTab === 'completed' ? completedGoals : upcomingGoals;

    // Helper to render a goal card
    const renderGoalCard = (goal: Goal, isPrimaryView: boolean = false) => {
        const progress = Math.min(100, Math.max(0, (netWorth / goal.target_amount) * 100));

        return (
            <div key={goal.id} className={cn(
                "group bg-[#0B101B] border rounded-xl p-6 transition-all relative",
                isPrimaryView ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-slate-800 hover:border-slate-700"
            )}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl border", isPrimaryView ? "bg-blue-500/10 border-blue-500/20" : "bg-slate-900 border-slate-800")}>
                            <Target className={cn("w-6 h-6", isPrimaryView ? "text-blue-500" : "text-emerald-500")} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                                {isPrimaryView && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white">
                                        Current Focus
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(new Date(goal.target_date), 'MMM yyyy')}
                                </span>
                                {!isPrimaryView && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        goal.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                                            goal.status === 'completed' ? "bg-blue-500/10 text-blue-500" : "bg-slate-800 text-slate-400"
                                    )}>
                                        {goal.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isPrimaryView && activeTab === 'active' && (
                            <button
                                onClick={(e) => setAsPrimary(goal, e)}
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-xs flex items-center gap-2"
                                title="Set as Current Goal"
                            >
                                <Target className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => toggleStatus(goal)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title={goal.status === 'active' ? "Mark Complete" : "Mark Active"}
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => openEditModal(goal)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm text-slate-400">Target</span>
                        <div className="text-right">
                            <div className="text-white font-bold text-xl">£{goal.target_amount.toLocaleString()}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                <span className={cn("font-medium", isPrimaryView ? "text-blue-500" : "text-emerald-500")}>{progress.toFixed(1)}%</span> achieved
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", isPrimaryView ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-gradient-to-r from-emerald-600 to-emerald-400")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                        <span>£0</span>
                        <span>£{(goal.target_amount / 2).toLocaleString()}</span>
                        <span>£{goal.target_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header & Controls */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Goal
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative",
                            activeTab === 'active' ? "text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                    >
                        Active Goals
                        {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative",
                            activeTab === 'completed' ? "text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                    >
                        Completed
                        {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-white">
                                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Goal Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0B101B] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. £100k Net Worth"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Target (£)</label>
                                    <input
                                        type="number"
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                                        className="w-full bg-[#0B101B] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Target Date</label>
                                    <input
                                        type="date"
                                        value={formData.target_date} // Expects YYYY-MM-DD
                                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                        className="w-full bg-[#0B101B] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-[#0B101B] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="paused">Paused</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                                >
                                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="bg-slate-900 h-48 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Active Tab View */}
                    {activeTab === 'active' && primaryGoal && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-300">Active Goal</h2>
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                                {renderGoalCard(primaryGoal, true)}
                            </div>
                        </div>
                    )}

                    {/* Upcoming or Completed View */}
                    {displayGoals.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-300">
                                {activeTab === 'active' ? 'Upcoming Goals' : 'Completed Goals'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayGoals.map(g => renderGoalCard(g, false))}
                            </div>
                        </div>
                    )}

                    {activeGoals.length === 0 && activeTab === 'active' && !isLoading && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-[#0B101B]/50 border border-slate-800 border-dashed rounded-xl">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                <Target className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-white font-medium mb-1">No active goals found</h3>
                            <button
                                onClick={openCreateModal}
                                className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Create First Goal
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
