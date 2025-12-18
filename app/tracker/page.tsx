'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, MonthlyTrackerData } from '@/lib/apiClient';
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Plus, Edit2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import IncomeInvestmentTable from '@/components/tracker/IncomeInvestmentTable';

const MONTHS = [
    '1st Jan', '1st Feb', '1st Mar', '1st Apr', '1st May', '1st Jun',
    '1st Jul', '1st Aug', '1st Sep', '1st Oct', '1st Nov', '1st Dec', '31st Dec'
];

export default function TrackerPage() {
    const [trackerData, setTrackerData] = useState<MonthlyTrackerData[] | null>(null);
    const [customColors, setCustomColors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [data, colors] = await Promise.all([
                    api.getMonthlyTracker(),
                    api.getPlatformColors()
                ]);

                setCustomColors(colors || {});

                if (Array.isArray(data)) {
                    setTrackerData(data);

                    // Distinct years for dropdown - always include current year for "auto creation" effect
                    const dbYears = data.map(d => d.year);
                    const currentYear = new Date().getFullYear();
                    // Merge DB years with current year, unique and sorted descending
                    const distinctYears = Array.from(new Set([...dbYears, currentYear])).sort((a, b) => b - a);

                    setAvailableYears(distinctYears);

                    // Auto-select most recent year if not set
                    if (distinctYears.length > 0 && !distinctYears.includes(selectedYear)) {
                        setSelectedYear(distinctYears[0]); // Selects the newest year (e.g. 2026) defaults
                    }
                } else if (data && Array.isArray((data as any).data)) {
                    setTrackerData((data as any).data);
                } else {
                    setTrackerData([]);
                }
            } catch (err) {
                console.error("Failed to load tracker data", err);
                setError("Failed to load tracker data.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Process data for the selected year
    const yearData = useMemo(() => {
        if (!trackerData) return [];
        return trackerData.filter(d => d.year === selectedYear);
    }, [trackerData, selectedYear]);

    // Extract all unique platforms across ALL YEARS so structure persists for new years
    const platforms = useMemo(() => {
        if (!trackerData) return [];
        const platformSet = new Set<string>();
        // Check all historical data for platform names
        trackerData.forEach(month => {
            if (month.platform_breakdown) {
                Object.keys(month.platform_breakdown).forEach(p => platformSet.add(p));
            }
        });
        // Sort platforms: Cash last, others alphabetical
        return Array.from(platformSet).sort((a, b) => {
            if (a === 'Cash') return 1;
            if (b === 'Cash') return -1;
            return a.localeCompare(b);
        });
    }, [trackerData]); // Depend on all trackerData, not just yearData

    // Helper to get value for a cell
    const getValue = (platform: string, month: string) => {
        const monthData = yearData.find(d => d.month === month);
        return monthData?.platform_breakdown?.[platform] || 0;
    };

    // Helper to get total for a month
    const getMonthTotal = (month: string) => {
        const monthData = yearData.find(d => d.month === month);
        return monthData?.total_networth || 0;
    };

    // Helper to get MoM change
    const getMonthChange = (monthIndex: number) => {
        if (monthIndex === 0) return { change: 0, percent: 0 }; // Jan has no prev month in this view (unless we fetch prev year)

        const currentMonth = MONTHS[monthIndex];
        const prevMonth = MONTHS[monthIndex - 1];

        const currentTotal = getMonthTotal(currentMonth);
        const prevTotal = getMonthTotal(prevMonth);

        // If we have no data for current month, return 0 (don't show big drops if data is missing)
        const hasCurrentData = yearData.some(d => d.month === currentMonth);
        if (!hasCurrentData || prevTotal === 0) return { change: 0, percent: 0 };

        const change = currentTotal - prevTotal;
        const percent = (change / prevTotal) * 100;

        return { change, percent };
    };

    // Yearly change metric
    const yearlyIncrease = useMemo(() => {
        const janTotal = getMonthTotal('1st Jan');

        // Find the last month with data. Priority: 31st Dec, else work backwards
        let lastMonthIndex = MONTHS.length - 1;
        while (lastMonthIndex > 0 && !yearData.some(d => d.month === MONTHS[lastMonthIndex])) {
            lastMonthIndex--;
        }
        const lastTotal = getMonthTotal(MONTHS[lastMonthIndex]);

        if (janTotal === 0) return 0;
        return ((lastTotal - janTotal) / janTotal) * 100;
    }, [yearData]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Loading tracker data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    // Colors for platform rows dots - use custom or preset hash
    // Correcting the helper above to return consistent prop object or handle class vs style
    const renderPlatformDot = (platform: string) => {
        const custom = customColors[platform];
        if (custom) {
            return <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: custom }} />;
        }

        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-orange-500', 'bg-purple-500', 'bg-sky-500'];
        let hash = 0;
        for (let i = 0; i < platform.length; i++) {
            hash = platform.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorClass = colors[Math.abs(hash) % colors.length];
        return <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-4 rounded-xl border border-slate-800">
                <h1 className="text-2xl font-bold text-white">Yearly Tracker</h1>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="year-select" className="text-slate-400 text-sm">Year:</label>
                        <select
                            id="year-select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Year
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>

                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 ml-2">
                        <Bot className="w-4 h-4" />
                        Tracker auto-populated on 1st of each month
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden shadow-sm">

                {/* Card Header with Metric */}
                <div className="px-6 py-6 border-b border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{selectedYear} Monthly Net Worth Tracking</h2>
                        <p className="text-slate-400 text-sm">Track platform values on the 1st of each month and 31st December</p>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Yearly Net Worth Increase</div>
                        <div className={cn("text-2xl font-bold", yearlyIncrease >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {yearlyIncrease > 0 ? '+' : ''}{yearlyIncrease.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-[#0f1623] border-b border-slate-800">
                                <th
                                    className="sticky left-0 z-20 bg-[#0f1623] p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-800 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
                                    style={{ position: 'sticky', left: 0 }}
                                >
                                    Platform
                                </th>
                                {MONTHS.map(month => (
                                    <th key={month} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right min-w-[120px]">
                                        {month.toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {/* Platform Rows */}
                            {platforms.map(platform => (
                                <tr key={platform} className="hover:bg-slate-800/30 transition-colors group">
                                    <td
                                        className="sticky left-0 z-20 bg-[#0B101B] group-hover:bg-[#161e2e] p-0 border-r border-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
                                        style={{ position: 'sticky', left: 0 }}
                                    >
                                        <div className="flex items-center gap-3 p-4 h-full w-full">
                                            {renderPlatformDot(platform)}
                                            <span className="text-white font-medium text-sm truncate max-w-[180px]" title={platform}>{platform}</span>
                                        </div>
                                    </td>
                                    {MONTHS.map(month => {
                                        const value = getValue(platform, month);
                                        return (
                                            <td key={month} className="p-4 text-right">
                                                {value > 0 ? (
                                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-300 text-sm font-medium">
                                                        {Math.round(value).toLocaleString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-700">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {/* Spacer Row */}
                            <tr className="h-4 bg-[#0f1623]/50">
                                <td className="sticky left-0 z-20 bg-[#0f1623]/50 border-r border-slate-800" style={{ position: 'sticky', left: 0 }} />
                                <td colSpan={12} />
                            </tr>

                            {/* Total Net Worth Row */}
                            <tr className="bg-[#0f1623] font-bold">
                                <td
                                    className="sticky left-0 z-20 bg-[#0f1623] p-4 text-white text-sm border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
                                    style={{ position: 'sticky', left: 0 }}
                                >
                                    Total Net Worth
                                </td>
                                {MONTHS.map(month => {
                                    const total = getMonthTotal(month);
                                    return (
                                        <td key={month} className="p-4 text-right text-white">
                                            {total > 0 ? `£${Math.round(total).toLocaleString()}` : '-'}
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* Month-on-Month Change Row */}
                            <tr className="bg-[#0f1623] border-t border-slate-800">
                                <td
                                    className="sticky left-0 z-20 bg-[#0f1623] p-4 text-slate-400 text-sm border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
                                    style={{ position: 'sticky', left: 0 }}
                                >
                                    Month-on-Month Change
                                </td>
                                {MONTHS.map((month, idx) => {
                                    const { percent } = getMonthChange(idx);
                                    return (
                                        <td key={month} className="p-4 text-right text-sm">
                                            {percent !== 0 ? (
                                                <span className={percent > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                    {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                                                </span>
                                            ) : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Income vs Investment Section */}
            <IncomeInvestmentTable />
        </div>
    );
}
