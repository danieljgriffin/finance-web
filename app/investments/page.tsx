'use client';

import { useEffect, useState } from 'react';
import { api, Investment } from '@/lib/apiClient';
import { InvestmentPlatformCard } from '@/components/investments/InvestmentPlatformCard';

export default function InvestmentsPage() {
    const [holdings, setHoldings] = useState<Record<string, Investment[]> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const data = await api.getHoldings();
                setHoldings(data);
            } catch (err) {
                console.error("Failed to load investments", err);
                setError("Failed to load investments.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6">Investments</h1>
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error || !holdings) {
        return (
            <div className="text-center py-20">
                <h2 className="text-red-500 text-xl font-bold">Error</h2>
                <p className="text-slate-400">{error || "No data available"}</p>
            </div>
        );
    }

    const platforms = Object.entries(holdings);

    // Sort platforms by total value
    const sortedPlatforms = platforms.map(([name, investments]) => {
        const total = investments.reduce((sum, inv) => sum + (inv.holdings * inv.current_price), 0);
        return { name, investments, total };
    }).sort((a, b) => b.total - a.total);

    const grandTotal = sortedPlatforms.reduce((sum, p) => sum + p.total, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold text-white">Investments</h1>
                <div className="text-left sm:text-right">
                    <p className="text-slate-400 text-sm">Total Invested Assets</p>
                    <p className="text-3xl font-bold text-white">£{grandTotal.toLocaleString()}</p>
                </div>
            </div>

            <div className="space-y-6">
                {sortedPlatforms.map((platform) => (
                    <InvestmentPlatformCard
                        key={platform.name}
                        platformName={platform.name}
                        investments={platform.investments}
                        totalValue={platform.total}
                    />
                ))}
            </div>
        </div>
    );
}
