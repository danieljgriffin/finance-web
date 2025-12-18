'use client';

import Link from 'next/link';
import { Goal } from '@/lib/apiClient';
import { ArrowRight, CalendarClock, Coins } from 'lucide-react';

interface GoalsWidgetProps {
    goals: Goal[];
    isLoading: boolean;
    currentNetWorth: number;
    isPrivacyMode: boolean;
}

export function GoalsWidget({ goals, isLoading, currentNetWorth, isPrivacyMode }: GoalsWidgetProps) {
    if (isLoading) {
        return <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full animate-pulse" />;
    }

    const activeGoals = goals
        .filter(g => g.status === 'active')
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

    const currentGoal = activeGoals[0]; // Top priority goal
    const upcomingGoals = activeGoals.slice(1, 4);

    if (!currentGoal) {
        return (
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-center items-center text-center">
                <Coins className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-white font-medium">No Active Goals</h3>
                <Link href="/goals" className="text-blue-500 text-sm mt-2 hover:underline">Set a goal</Link>
            </div>
        );
    }

    const progress = Math.min((currentNetWorth / currentGoal.target_amount) * 100, 100);
    const remainingAmount = Math.max(currentGoal.target_amount - currentNetWorth, 0);

    // Calculate days remaining
    const targetDate = new Date(currentGoal.target_date);
    const now = new Date();
    const diffTime = Math.abs(targetDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Current Goal</h2>
                <Link href="/goals" className="text-xs text-blue-500 hover:text-blue-400 flex items-center font-medium transition-colors">
                    View Goals <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </div>

            {/* Main Goal Progress */}
            <div className="mb-8">
                <div className="text-sm text-slate-400 mb-4">
                    <span className={isPrivacyMode ? "blur-sm" : ""}>
                        £{currentGoal.target_amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </span>
                    {' '}by {targetDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>

                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
                    <span className="text-lg font-bold text-white">{progress.toFixed(1)}%</span>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-sm">
                    <div>
                        <div className={`text-blue-400 font-bold ${isPrivacyMode ? 'blur-sm' : ''}`}>
                            £{currentNetWorth.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-white font-bold ${isPrivacyMode ? 'blur-sm' : ''}`}>
                            £{currentGoal.target_amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <div className="text-xs text-slate-500 uppercase mb-1">Days Remaining</div>
                    <div className="text-2xl font-bold text-white">{diffDays}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 uppercase mb-1">Amount Remaining</div>
                    <div className={`text-2xl font-bold text-white ${isPrivacyMode ? 'blur-sm' : ''}`}>
                        £{remainingAmount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>

            {/* Upcoming Goals */}
            {upcomingGoals.length > 0 && (
                <div className="flex-grow">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Upcoming Goals:</div>
                    <div className="space-y-3">
                        {upcomingGoals.map(goal => (
                            <div key={goal.id} className="flex justify-between items-center text-sm group cursor-default">
                                <div>
                                    <div className="text-slate-300 font-medium group-hover:text-white transition-colors">
                                        {new Date(goal.target_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className={`font-bold text-slate-200 ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                    £{goal.target_amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
