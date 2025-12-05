'use client';

import { useEffect, useState } from 'react';
import { api, Investment } from '@/lib/apiClient';
import { InvestmentPlatformCard } from '@/components/investments/InvestmentPlatformCard';
import { InvestmentSummaryCard } from '@/components/investments/InvestmentSummaryCard';
import { EditInvestmentModal } from '@/components/investments/EditInvestmentModal';
import { EditPlatformModal } from '@/components/investments/EditPlatformModal';

export default function InvestmentsPage() {
    const [holdings, setHoldings] = useState<Record<string, Investment[]> | null>(null);
    const [platformCash, setPlatformCash] = useState<Record<string, number>>({});
    const [customColors, setCustomColors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

    // Platform Edit State
    const [isPlatformEditModalOpen, setIsPlatformEditModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            let holdingsData = null; // To store holdings data if successful

            // Fetch holdings (critical)
            try {
                holdingsData = await api.getHoldings();
                setHoldings(holdingsData);

                // Fetch cash (non-critical, separate loop) - only if holdingsData is available
                if (holdingsData) {
                    const platforms = Object.keys(holdingsData);
                    const cashBalances: Record<string, number> = {};

                    // We run this in parallel but catch errors per request so one failure doesn't block others
                    await Promise.all(platforms.map(async (p) => {
                        try {
                            const result = await api.getPlatformCash(p);
                            cashBalances[p] = result.cash_balance;
                        } catch (e) {
                            cashBalances[p] = 0;
                        }
                    }));
                    setPlatformCash(cashBalances);
                }
            } catch (err) {
                console.error("Failed to load holdings", err);
                setError("Failed to load holdings.");
                // If holdings fail, we can't do much
            }

            // Fetch colors (non-critical)
            try {
                const colors = await api.getPlatformColors();
                setCustomColors(colors || {});
            } catch (err) {
                console.warn("Failed to load custom colors", err);
                // Don't set error state, just log it. Page can still function without custom colors.
            }

        } catch (err) {
            console.error("General fetch error", err);
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (inv: Investment) => {
        setSelectedInvestment(inv);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this investment?')) {
            try {
                await api.deleteInvestment(id);
                // Refresh data
                fetchData();
            } catch (err) {
                alert('Failed to delete investment');
            }
        }
    };

    const handleSaveInvestment = async (id: number, updates: Partial<Investment>) => {
        await api.updateInvestment(id, updates);
        fetchData();
    };

    const handleUpdateCash = async (platform: string, amount: number) => {
        await api.updatePlatformCash(platform, amount);
        // Refresh just cash or everything? 
        // Simple to refresh all or just update local state if we want optimistic UI
        fetchData();
    };

    const handleEditPlatform = (platform: string) => {
        setSelectedPlatform(platform);
        setIsPlatformEditModalOpen(true);
    };

    const handleSavePlatform = async (oldName: string, newName: string, newColor?: string) => {
        if (oldName !== newName) {
            await api.renamePlatform(oldName, newName);
        }
        if (newColor) {
            // Use newName here because if we just renamed it, the backend should hopefully have updated,
            // or the rename updated the color key automatically? 
            // My backend logic for rename updates the color key. So we should update color for the NEW name.
            await api.updatePlatformColor(newName, newColor);
        }
        fetchData();
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6">Investments</h1>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-48 animate-pulse mb-8" />
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
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.holdings * inv.current_price), 0);
        const cash = platformCash[name] || 0;
        const totalValue = totalInvested + cash;
        return { name, investments, totalValue, cash };
    }).sort((a, b) => b.totalValue - a.totalValue);

    // Calculate Summary Metrics
    let totalPortfolioValue = 0;
    let totalSpent = 0;

    sortedPlatforms.forEach(p => {
        // Platform total value (holdings + cash)
        totalPortfolioValue += p.totalValue;

        // Platform spent (sum of investment amount_spent + cash?? No, usually cash cost basis is cash itself)
        // Wait, "Total Amount Spent" usually means cost basis of investments. Cash is just cash.
        // If I have £1000 cash, did I "spend" £1000? No.
        // But for "Profit/Loss", usually it's (Current Value - Cost Basis).
        // If Cash is included in Value, it should be included in Cost Basis if we consider it "Net Worth".
        // HOWEVER, traditionally "Amount Spent" refers to invested capital.
        // Let's assume Total Portfolio Value = Investments Value + Cash.
        // Total Spent = Investments Cost Basis + Cash (since cash is its own basis).
        // So P/L on cash is 0. 
        // Let's stick to that logic so the math works out (Total P/L = Sum of Investment P/L).

        const platformInvestedSpent = p.investments.reduce((sum, inv) => sum + inv.amount_spent, 0);
        totalSpent += platformInvestedSpent + p.cash;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Investments</h1>

            <InvestmentSummaryCard
                totalValue={totalPortfolioValue}
                totalSpent={totalSpent}
            />

            <div className="space-y-6">
                {sortedPlatforms.map((platform) => (
                    <InvestmentPlatformCard
                        key={platform.name}
                        platformName={platform.name}
                        investments={platform.investments}
                        totalValue={platform.totalValue} // This now includes cash
                        platformCash={platform.cash}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUpdateCash={handleUpdateCash}
                        onEditPlatform={handleEditPlatform}
                    />
                ))}
            </div>

            {selectedInvestment && (
                <EditInvestmentModal
                    investment={selectedInvestment}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveInvestment}
                />
            )}

            {selectedPlatform && (
                <EditPlatformModal
                    key={selectedPlatform} // Fixes re-init bug
                    platformName={selectedPlatform}
                    isOpen={isPlatformEditModalOpen}
                    onClose={() => {
                        setIsPlatformEditModalOpen(false);
                        setSelectedPlatform(null);
                    }}
                    onSave={handleSavePlatform}
                />
            )}
        </div>
    );
}
