'use client';

import { NetWorthDashboardSummary } from '@/lib/apiClient';
import { Eye, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';
import CountUp from 'react-countup';

interface ChartDataPoint {
    date: string;
    value: number;
}

interface NetWorthCardProps {
    summary: NetWorthDashboardSummary | null;
    chartData: ChartDataPoint[];
    isLoading: boolean;
    onTimeRangeChange?: (range: string) => void;
    isPrivacyMode: boolean;
    onTogglePrivacy: () => void;
}

export function NetWorthCard({ summary, chartData, isLoading, onTimeRangeChange, isPrivacyMode, onTogglePrivacy }: NetWorthCardProps) {
    const [timeRange, setTimeRange] = useState('24H'); // Default

    if (isLoading || !summary) {
        return <div className="bg-[#0B101B] border border-slate-800 rounded-2xl h-[500px] animate-pulse" />;
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);

    const formatPercent = (val: number) =>
        `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

    const handleTimeRangeClick = (range: string) => {
        setTimeRange(range);
        if (onTimeRangeChange) {
            onTimeRangeChange(range);
        }
    };

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-8 flex flex-col h-full relative overflow-hidden">
            {/* Background Glow Effect - Optional but matches premium look */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-4 mb-1">
                        <h1 className={cn("text-5xl font-bold text-white tracking-tight transition-all duration-300", isPrivacyMode ? "blur-md" : "")}>
                            <CountUp
                                start={0}
                                end={summary.total_networth}
                                duration={2.5}
                                separator=","
                                decimals={0}
                                prefix="£"
                            />
                        </h1>
                        <button
                            onClick={onTogglePrivacy}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title={isPrivacyMode ? "Show details" : "Hide details"}
                        >
                            <Eye className={cn("w-5 h-5", isPrivacyMode ? "text-blue-500" : "")} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Current Net Worth</span>
                        <span className="text-slate-600">•</span>
                        <span>Last updated: {format(new Date(), 'HH:mm')}</span>
                    </div>
                </div>

                <div className="flex gap-8 text-right">
                    <div>
                        <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">This Month</div>
                        <div className={cn("font-medium text-lg", summary.mom_change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {summary.mom_change >= 0 ? '+' : ''}£{summary.mom_change.toFixed(0)}
                        </div>
                        <div className={cn("text-xs font-medium", summary.mom_change >= 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                            ({formatPercent(summary.mom_change_percent)})
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">This Year</div>
                        <div className={cn("font-medium text-lg", summary.ytd_change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {summary.ytd_change >= 0 ? '+' : ''}£{summary.ytd_change.toFixed(0)}
                        </div>
                        <div className={cn("text-xs font-medium", summary.ytd_change >= 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                            ({formatPercent(summary.ytd_change_percent)})
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Header & Controls */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-lg font-semibold text-white">Net Worth Performance</h2>

                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
                    {['24H', '1W', '1M', '3M', '6M', '1Y', 'Max'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeClick(range)}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                timeRange === range
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-grow w-full min-h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                if (timeRange === '24H') return format(date, 'HH:mm');
                                if (timeRange === '1W') return format(date, 'EEE');
                                if (['1M', '3M', '6M'].includes(timeRange)) return format(date, 'd MMM');
                                return format(date, 'MMM yy');
                            }}
                            stroke="#475569"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            orientation="right"
                            tickFormatter={(val) => isPrivacyMode ? '****' : `£${(val / 1000).toFixed(1)}k`}
                            stroke="#475569"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                        />
                        {!isPrivacyMode && (
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #1e293b',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: '#f8fafc'
                                }}
                                itemStyle={{ color: '#60a5fa' }}
                                formatter={(value: number) => [`£${value.toLocaleString()}`, 'Net Worth']}
                                labelFormatter={(label) => {
                                    const date = new Date(label);
                                    if (timeRange === '24H') {
                                        return format(date, 'd MMM HH:mm');
                                    }
                                    return format(date, 'd MMM yyyy');
                                }}
                            />
                        )}
                        <Area
                            type="basis"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Bottom Time Axis Labels (Mocked in Chart but styling wrapper here) */}
            <div className="flex justify-between text-xs text-slate-600 mt-2 px-2">
                {/* Recharts handles this via XAxis, just creating space if needed */}
            </div>
        </div>
    );
}
