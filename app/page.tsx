'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { PlatformBreakdown } from '@/components/dashboard/PlatformBreakdown';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('24H');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // 1. Dashboard Summary
  const { data: summary, isLoading: isLoadingSummary, isError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.getDashboardSummary(),
  });

  // 2. Goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.getGoals(),
    initialData: [],
  });

  // 3. Chart Data (Depends on Time Range)
  const { data: rawChartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['chart', timeRange],
    queryFn: () => api.getGraphData(timeRange),
    // Refresh every minute for 24H view?
    refetchInterval: timeRange === '24H' ? 60000 : undefined,
  });

  // Transform / Fallback logic for chart
  const currentNetWorth = summary?.total_networth || 0;
  let chartData: { date: string; value: number }[] = [];

  if (rawChartData && rawChartData.length > 0) {
    chartData = rawChartData.map((d: any) => ({
      date: d.date || d.month || d.timestamp,
      value: d.value || d.total_networth || 0
    }));
  } else if (!isLoadingChart && (timeRange === '24H' || timeRange === '1W')) {
    // Fallback if API returns empty for short periods (new user)
    const now = new Date();
    const startStr = timeRange === '24H'
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    chartData = [
      { date: startStr, value: currentNetWorth },
      { date: now.toISOString(), value: currentNetWorth }
    ];
  }

  // NetWorthCard takes isLoading, let's pass general loading there likely.
  const errorMessage = isError ? "Failed to load dashboard data." : null;

  if (errorMessage) {
    return (
      <div className="text-center py-20">
        <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
        <p className="text-slate-400">{errorMessage}</p>
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
          isLoading={isLoadingSummary || isLoadingChart} // Show loading on card if chart is updating
          onTimeRangeChange={setTimeRange} // Now updates state -> triggers query
          isPrivacyMode={isPrivacyMode}
          onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        />
      </div>

      {/* Breakdown Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 lg:col-span-3 h-full">
        <PlatformBreakdown
          summary={summary}
          isLoading={isLoadingSummary}
          isPrivacyMode={isPrivacyMode}
        />
      </div>

      {/* Goals Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 lg:col-span-3 h-full">
        <GoalsWidget
          goals={goals}
          isLoading={isLoadingGoals}
          currentNetWorth={summary?.total_networth || 0}
          isPrivacyMode={isPrivacyMode}
        />
      </div>
    </div>
  );
}
