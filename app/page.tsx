'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, HistoricalDataPoint } from '@/lib/apiClient';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { PlatformBreakdown } from '@/components/dashboard/PlatformBreakdown';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('24H');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const queryClient = useQueryClient();

  // Production keeps live prices fresh; isolated local demos never call market services.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE === 'true') return;

    // We don't await this to avoid blocking UI rendering
    api.refreshPrices().then(() => {
      // After backend refresh, invalidate cache to refetch updated numbers
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }).catch(err => console.error("Auto-refresh trigger failed", err));
  }, [queryClient]);

  // 1. Dashboard Summary
  const { data: summary, isLoading: isLoadingSummary, isError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // 3. Goals
  const { data: goals, isLoading: isLoadingGoals, isError: isGoalsError, error: goalsError } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.getGoals(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (typeof window !== 'undefined' && goalsError) {
    console.error("Goals Query Error Object:", goalsError);
  }

  // 4. Chart Data (Depends on Time Range)
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
    chartData = rawChartData.map((dataPoint) => {
      const point = dataPoint as HistoricalDataPoint & {
        month?: string;
        timestamp?: string;
        total_networth?: number;
      };
      return {
        date: point.date || point.month || point.timestamp || '',
        value: point.value ?? point.total_networth ?? 0,
      };
    });
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
  const errorMessage = isError || isGoalsError ? "Failed to load dashboard data." : null;

  if (errorMessage) {
    return (
      <div className="text-center py-20">
        <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
        <p className="text-slate-400">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-6rem)] grid-cols-12 gap-6 2xl:h-[calc(100vh-6rem)]">
      {/* Main Panel (Net Worth + Chart) - Spans 6 columns (50%) */}
      <div className="col-span-12 min-h-[620px] 2xl:col-span-6 2xl:h-full 2xl:min-h-0">
        <NetWorthCard
          summary={summary ?? null}
          chartData={chartData}
          isLoading={isLoadingSummary || isLoadingChart} // Show loading on card if chart is updating
          onTimeRangeChange={setTimeRange} // Now updates state -> triggers query
          isPrivacyMode={isPrivacyMode}
          onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        />
      </div>

      {/* Breakdown Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 min-h-[420px] md:col-span-6 2xl:col-span-3 2xl:h-full 2xl:min-h-0">
        <PlatformBreakdown
          summary={summary ?? null}
          isLoading={isLoadingSummary}
          isPrivacyMode={isPrivacyMode}
        />
      </div>

      {/* Goals Panel - Spans 3 columns (25%) */}
      <div className="col-span-12 min-h-[420px] md:col-span-6 2xl:col-span-3 2xl:h-full 2xl:min-h-0">
        <GoalsWidget
          goals={goals || []}
          isLoading={isLoadingGoals}
          currentNetWorth={summary?.total_networth || 0}
          isPrivacyMode={isPrivacyMode}
        />
      </div>
    </div>
  );
}
