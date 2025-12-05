'use client';

import { useEffect, useState } from 'react';
import { api, NetWorthDashboardSummary, Goal } from '@/lib/apiClient';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { PlatformBreakdown } from '@/components/dashboard/PlatformBreakdown';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';

export default function Dashboard() {
  const [summary, setSummary] = useState<NetWorthDashboardSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory(range: string, currentNetWorth: number) {
    try {
      if (range === '24H') {
        const data = await api.getIntradayHistory(24);
        if (data && data.length > 0) {
          setChartData(data);
        } else {
          // Fallback to flat line if no data yet (until cron/snapshot runs)
          const now = new Date();
          const startDate = new Date();
          startDate.setHours(now.getHours() - 24);
          setChartData([
            { date: startDate.toISOString(), value: currentNetWorth },
            { date: now.toISOString(), value: currentNetWorth }
          ]);
        }
      } else if (range === '1W') {
        const data = await api.getIntradayHistory(168);
        if (data && data.length > 0) {
          setChartData(data);
        } else {
          // Fallback
          const now = new Date();
          const startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          setChartData([
            { date: startDate.toISOString(), value: currentNetWorth },
            { date: now.toISOString(), value: currentNetWorth }
          ]);
        }
      } else if (range === 'Max') {
        const historyData = await api.getNetWorthHistory('all');
        setChartData((historyData as any).map((d: any) => ({
          date: d.date || d.month,
          value: d.value || d.total_networth || 0
        })));
      } else {
        // 1Y or Default
        // Map ranges to monthly granularity for now if not intraday
        const historyData = await api.getNetWorthHistory(new Date().getFullYear());
        setChartData((historyData as any).map((d: any) => ({
          date: d.date || d.month,
          value: d.value || d.total_networth || 0
        })));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // In a real app we'd verify auth here or redirect

        const [summaryData, goalsData] = await Promise.all([
          api.getDashboardSummary(),
          api.getGoals()
        ]);

        setSummary(summaryData);
        setGoals(goalsData);

        // Default to 24H view
        if (summaryData) {
          try {
            const intraday = await api.getIntradayHistory(24);
            if (intraday && intraday.length > 0) {
              setChartData(intraday);
            } else {
              // Synthetic fallback
              const now = new Date();
              const yesterday = new Date(now);
              yesterday.setHours(now.getHours() - 24);
              setChartData([
                { date: yesterday.toISOString(), value: summaryData.total_networth },
                { date: now.toISOString(), value: summaryData.total_networth }
              ]);
            }
          } catch (e) {
            console.error("Failed initial history load", e);
          }
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data. Please check if backend is running.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-6rem)]">
      {/* Main Panel (Net Worth + Chart) - Spans 6 columns (50%) */}
      <div className="col-span-12 lg:col-span-6 h-full">
        <NetWorthCard
          summary={summary}
          chartData={chartData}
          isLoading={isLoading}
          onTimeRangeChange={(range) => summary && loadHistory(range, summary.total_networth)}
        />
      </div>

      {/* Breakdown Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 lg:col-span-3 h-full">
        <PlatformBreakdown summary={summary} isLoading={isLoading} />
      </div>

      {/* Goals Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 lg:col-span-3 h-full">
        <GoalsWidget
          goals={goals}
          isLoading={isLoading}
          currentNetWorth={summary?.total_networth || 0}
        />
      </div>
    </div>
  );
}
