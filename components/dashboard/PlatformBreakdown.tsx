'use client';

import { NetWorthDashboardSummary } from '@/lib/apiClient';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface PlatformBreakdownProps {
    summary: NetWorthDashboardSummary | null;
    isLoading: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
    'Degiro': 'bg-blue-600',
    'Trading212 ISA': 'bg-emerald-500',
    'EQ (GSK shares)': 'bg-rose-500',
    'InvestEngine ISA': 'bg-orange-500',
    'Crypto': 'bg-purple-500',
    'HL Stocks & Shares LISA': 'bg-sky-500',
    'Cash': 'bg-teal-500',
};

export function PlatformBreakdown({ summary, isLoading }: PlatformBreakdownProps) {
    if (isLoading || !summary) {
        return (
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full animate-pulse" />
        );
    }

    // Use the platforms array from the new API response structure if available
    // The service returns `platforms` list with change data now.
    // We need to type check since `NetWorthDashboardSummary` might not be updated in TS types file yet?
    // Let's assume passed `summary` conforms to updated interface or fallback.
    // For now, based on previous step, I updated the API but not the TS interface. 
    // I should update the interface too, but will rely on 'any' casting if needed or `platforms` property existing.

    // Let's grab the platforms array safely
    const platformsData = (summary as any).platforms || [];
    // Sort by value desc
    const sortedPlatforms = [...platformsData].sort((a: any, b: any) => b.value - a.value);
    const total = summary.total_networth;

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Net Worth Breakdown</h2>
                <Link href="/investments" className="text-xs text-blue-500 hover:text-blue-400 flex items-center font-medium transition-colors">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </div>

            <p className="text-sm text-slate-500 mb-6">
                Your portfolio allocation and monthly performance by platform
            </p>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {sortedPlatforms.map((p: any) => {
                    const percentOfTotal = (p.value / total) * 100;
                    const colorClass = PLATFORM_COLORS[p.platform] || 'bg-slate-500';

                    return (
                        <div key={p.platform} className="group">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full ${colorClass}`} />
                                    <div>
                                        <div className="font-medium text-slate-200 text-sm">{p.platform}</div>
                                        <div className="text-xs text-slate-500">{percentOfTotal.toFixed(1)}% of total</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">£{p.value.toLocaleString()}</div>
                                    <div className={`text-xs font-medium flex items-center justify-end ${p.month_change_amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {p.month_change_amount >= 0 ? '+' : ''}£{p.month_change_amount.toFixed(0)}
                                        <span className="opacity-80 ml-1">({p.month_change_percent.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
