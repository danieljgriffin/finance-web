'use client';

import { useEffect, useState } from 'react';
import { api, Goal } from '@/lib/apiClient';
import { Plus, Target, Calendar, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Simple form state
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({
        title: '',
        target_amount: 0,
        target_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active'
    });

    async function fetchGoals() {
        try {
            setIsLoading(true);
            const data = await api.getGoals();
            setGoals(data);
        } catch (err) {
            console.error("Failed to load goals", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchGoals();
    }, []);

    async function handleCreateGoal(e: React.FormEvent) {
        e.preventDefault();
        if (!newGoal.title || !newGoal.target_amount || !newGoal.target_date) return;

        try {
            await api.createGoal({
                title: newGoal.title,
                target_amount: Number(newGoal.target_amount),
                target_date: newGoal.target_date,
                status: 'active',
                description: newGoal.description
            });
            setIsCreating(false);
            setNewGoal({ title: '', target_amount: 0, target_date: format(new Date(), 'yyyy-MM-dd'), status: 'active' });
            fetchGoals(); // Refresh list
        } catch (err) {
            console.error("Failed to create goal", err);
            alert("Failed to create goal");
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Goal
                </button>
            </div>

            {isCreating && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-200">
                    <h2 className="text-lg font-semibold text-white mb-4">Create New Goal</h2>
                    <form onSubmit={handleCreateGoal} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Goal Title</label>
                            <input
                                type="text"
                                value={newGoal.title}
                                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="e.g. House Deposit"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Target Amount (£)</label>
                                <input
                                    type="number"
                                    value={newGoal.target_amount}
                                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Target Date</label>
                                <input
                                    type="date"
                                    value={newGoal.target_date}
                                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Create Goal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="bg-slate-900 h-48 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((goal) => (
                        <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <Target className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(goal.target_date), 'MMM yyyy')}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full",
                                                goal.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-400"
                                            )}>
                                                {goal.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Target</span>
                                    <span className="text-white font-medium">£{goal.target_amount.toLocaleString()}</span>
                                </div>
                                {/* 
                   We don't have "current progress" specific to a goal in the Goal model itself 
                   (it's usually derived from total net worth or a specific account).
                   For now, we just show the target.
                */}
                            </div>
                        </div>
                    ))}

                    {goals.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl">
                            <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-400">No goals set yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
