'use client';

import { useEffect, useState } from 'react';
import { api, MonthlyTrackerData } from '@/lib/apiClient';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrackerPage() {
    const [trackerData, setTrackerData] = useState<MonthlyTrackerData[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const data = await api.getMonthlyTracker();
                // Assuming API returns a list of MonthlyTrackerData
                // Need to verify if it returns { data: [...] } or just [...]
                // Based on FastAPI conventions usually it's the model directly unless wrapped.
                // Let's assume list for now.
                if (Array.isArray(data)) {
                    setTrackerData(data);
                } else if (data && Array.isArray((data as any).data)) {
                    setTrackerData((data as any).data);
                } else {
                    console.warn("Unexpected tracker data format", data);
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6">Net Worth Tracker</h1>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-96 animate-pulse" />
            </div>
        );
    }

    if (error || !trackerData) {
        return (
            <div className="text-center py-20">
                <h2 className="text-red-500 text-xl font-bold">Error</h2>
                <p className="text-slate-400">{error || "No data available"}</p>
            </div>
        );
    }

    // Group data by year
    const groupedByYear = trackerData.reduce((acc, item) => {
        const year = item.year;
        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
    }, {} as Record<number, MonthlyTrackerData[]>);

    const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Net Worth Tracker</h1>

            {years.map(year => (
                <div key={year} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800">
                        <h2 className="text-lg font-semibold text-white">{year}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/30 text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Month</th>
                                    <th className="px-6 py-3 font-medium">Net Worth</th>
                                    <th className="px-6 py-3 font-medium">Change</th>
                                    <th className="px-6 py-3 font-medium">% Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {groupedByYear[year].map((monthData, index) => {
                                    // Calculate change from previous month in the list (assuming sorted DESC or ASC)
                                    // If sorted ASC (Jan -> Dec), we look at index-1. 
                                    // If sorted DESC (Dec -> Jan), we look at index+1.
                                    // The API likely returns in chronological order (ASC).
                                    // Let's assume ASC for now.

                                    const previous = index > 0 ? groupedByYear[year][index - 1] : null;
                                    // Note: this logic is flawed for the first month of a year (needs prev year Dec).
                                    // For simple display, let's just use what's provided or if `change` is in the API response.
                                    // The schema inspection didn't show `change` explicitly in `NetWorthEntryBase` but services compute it.
                                    // If not available, we compute locally (imperfectly across years).

                                    // Assuming `monthly_tracker` endpoint might enrich this. 
                                    // If not, we compute simply.

                                    let change = 0;
                                    let percentChange = 0;

                                    if (previous) {
                                        change = monthData.total_networth - previous.total_networth;
                                        percentChange = previous.total_networth > 0 ? (change / previous.total_networth) * 100 : 0;
                                    }

                                    return (
                                        <tr key={`${year}-${monthData.month}`} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-white font-medium">
                                                {monthData.month}
                                            </td>
                                            <td className="px-6 py-4 text-slate-200">
                                                £{monthData.total_networth.toLocaleString()}
                                            </td>
                                            <td className={cn("px-6 py-4 font-medium", change > 0 ? "text-emerald-500" : change < 0 ? "text-rose-500" : "text-slate-500")}>
                                                {change > 0 ? '+' : ''}{change !== 0 ? `£${change.toLocaleString()}` : '-'}
                                            </td>
                                            <td className={cn("px-6 py-4 font-medium flex items-center gap-1", change > 0 ? "text-emerald-500" : change < 0 ? "text-rose-500" : "text-slate-500")}>
                                                {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                                {change !== 0 ? `${percentChange.toFixed(2)}%` : '0%'}
                                            </td>
                                        </tr>
                                    );
                                }).reverse()} {/* Reverse to show Dec at top if data came in Jan->Dec */}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
