'use client';

import { NetWorthDashboardSummary } from '@/lib/apiClient';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_COLORS } from '@/lib/constants';

interface PlatformBreakdownProps {
    summary: NetWorthDashboardSummary | null;
    isLoading: boolean;
    isPrivacyMode: boolean;
}

export function PlatformBreakdown({ summary, isLoading, isPrivacyMode }: PlatformBreakdownProps) {
    if (isLoading || !summary) {
        return (
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 h-full animate-pulse" />
        );
    }

    // Use the platforms array from the new API response structure if available
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
                                    <div className={`text-white font-bold ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                        £{p.value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className={`text-xs font-medium ${p.month_change_amount >= 0 ? 'text-green-500' : 'text-red-500'
                                        } ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                        {p.month_change_amount >= 0 ? '+' : ''}£{Math.abs(p.month_change_amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })} ({p.month_change_percent.toFixed(1)}%)
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
