'use client';

import { NetWorthDashboardSummary } from '@/lib/apiClient';
import { Eye } from 'lucide-react';
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

type MetricMode = 'net_worth' | 'performance';

export function NetWorthCard({
    summary,
    chartData,
    isLoading,
    onTimeRangeChange,
    isPrivacyMode,
    onTogglePrivacy,
}: NetWorthCardProps) {
    const [timeRange, setTimeRange] = useState('24H'); // Default
    const [metricMode, setMetricMode] = useState<MetricMode>('net_worth');

    if (isLoading || !summary) {
        return <div className="bg-[#0B101B] border border-slate-800 rounded-2xl h-[500px] animate-pulse" />;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
    }).format(Math.abs(val));

    const formatPercent = (val: number) =>
        `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

    const handleTimeRangeClick = (range: string) => {
        setTimeRange(range);
        if (onTimeRangeChange) {
            onTimeRangeChange(range);
        }
    };

    const performance = summary.portfolio_performance;
    const isPerformanceMode = metricMode === 'performance' && performance != null;
    const monthAmount = isPerformanceMode ? performance.month.amount : summary.mom_change;
    const monthPercent = isPerformanceMode ? performance.month.percent : summary.mom_change_percent;
    const yearAmount = isPerformanceMode ? performance.year.amount : summary.ytd_change;
    const yearPercent = isPerformanceMode ? performance.year.percent : summary.ytd_change_percent;
    const renderSignedCurrency = (value: number) => `${value >= 0 ? '+' : '-'}${formatCurrency(value)}`;

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-8 flex flex-col h-full relative overflow-hidden">
            {/* Background Glow Effect - Optional but matches premium look */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Metric mode */}
            <div className="relative z-10 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                    role="group"
                    aria-label="Dashboard metric"
                    className="inline-flex w-fit rounded-xl border border-slate-800 bg-slate-950/70 p-1"
                >
                    <button
                        type="button"
                        aria-pressed={metricMode === 'net_worth'}
                        onClick={() => setMetricMode('net_worth')}
                        className={cn(
                            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                            metricMode === 'net_worth'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-200'
                        )}
                    >
                        Net worth
                    </button>
                    <button
                        type="button"
                        aria-pressed={metricMode === 'performance'}
                        onClick={() => setMetricMode('performance')}
                        disabled={!performance}
                        className={cn(
                            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                            metricMode === 'performance'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 hover:text-slate-200',
                            !performance && 'cursor-not-allowed opacity-40'
                        )}
                    >
                        Portfolio performance
                    </button>
                </div>

            </div>

            {/* Header Section */}
            <div className="relative z-10 mb-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
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

                <div className="grid grid-cols-2 gap-8 text-left sm:text-right xl:min-w-[260px]">
                    <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                            {isPerformanceMode ? 'Month return' : 'This month'}
                        </div>
                        <div className={cn(
                            'text-lg font-medium transition-all',
                            monthAmount >= 0 ? 'text-emerald-400' : 'text-rose-400',
                            isPrivacyMode && 'blur-sm select-none'
                        )}>
                            {renderSignedCurrency(monthAmount)}
                        </div>
                        <div className={cn(
                            'text-xs font-medium transition-all',
                            monthAmount >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80',
                            isPrivacyMode && 'blur-sm select-none'
                        )}>
                            ({formatPercent(monthPercent)})
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                            {isPerformanceMode ? 'Year return' : 'This year'}
                        </div>
                        <div className={cn(
                            'text-lg font-medium transition-all',
                            yearAmount >= 0 ? 'text-emerald-400' : 'text-rose-400',
                            isPrivacyMode && 'blur-sm select-none'
                        )}>
                            {renderSignedCurrency(yearAmount)}
                        </div>
                        <div className={cn(
                            'text-xs font-medium transition-all',
                            yearAmount >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80',
                            isPrivacyMode && 'blur-sm select-none'
                        )}>
                            ({formatPercent(yearPercent)})
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Header & Controls */}
            <div className="relative z-10 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Net Worth Growth</h2>
                    {isPerformanceMode && (
                        <p className="text-[10px] text-slate-600">Month/year figures exclude recorded cash flows · chart remains net worth</p>
                    )}
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
                    {['24H', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'Max'].map((range) => (
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
            <div className="relative z-10 min-h-[220px] w-full flex-grow 2xl:min-h-[300px]">
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
