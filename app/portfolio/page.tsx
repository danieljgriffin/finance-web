'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Investment } from '@/lib/apiClient';
import { InvestmentPlatformCard } from '@/components/investments/InvestmentPlatformCard';
import { InvestmentSummaryCard } from '@/components/investments/InvestmentSummaryCard';
import { EditInvestmentModal } from '@/components/investments/EditInvestmentModal';
import { EditPlatformModal } from '@/components/investments/EditPlatformModal';
import { AddInvestmentModal } from '@/components/investments/AddInvestmentModal';

export default function InvestmentsPage() {
    const queryClient = useQueryClient();

    // 1. Fetch Holdings
    const { data: holdings, isLoading: isLoadingHoldings, isError, error } = useQuery({
        queryKey: ['holdings'],
        queryFn: () => api.getHoldings(),
    });


    // 3. Fetch Cash (Dependent on Holdings)
    // We fetch ALL cash for platforms found in holdings.
    // Ideally use useQueries, but for simplicity/speed let's use a side-effect fetch or a composite query.
    // A better pattern: generic "fetch all platform cash" query if API supported it.
    // For now, let's keep the cash loading simple: fetch in standard useEffect when holdings change, 
    // OR use useQuery for each platform. 
    // Let's stick to state for cash for this iteration to minimize breaking changes, 
    // but trigger it from holdings data presence.

    // Better: useQueries? 
    // const results = useQueries({
    //    queries: platforms.map(p => ({ queryKey: ['cash', p], queryFn: () => api.getPlatformCash(p) }))
    // })
    // But hooks can't be conditional/looped easily without useQueries.
    // Let's implement a robust "Fetch All Cash" function in this component for now effectively.

    const [platformCash, setPlatformCash] = useState<Record<string, number>>({});

    useEffect(() => {
        if (holdings) {
            const fetchCash = async () => {
                const platforms = Object.keys(holdings);
                const results: Record<string, number> = {};
                await Promise.all(platforms.map(async (p) => {
                    try {
                        const data = await api.getPlatformCash(p);
                        results[p] = data.cash_balance;
                    } catch {
                        results[p] = 0;
                    }
                }));
                // Only update if changed to avoid expensive re-renders? 
                // Actually React batches this well.
                setPlatformCash(results);
            };
            fetchCash();
        }
    }, [holdings]);


    // Mutations

    const updateInvestmentMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number, updates: Partial<Investment> }) => api.updateInvestment(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holdings'] })
    });

    const deleteInvestmentMutation = useMutation({
        mutationFn: (id: number) => api.deleteInvestment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holdings'] })
    });

    const updateCashMutation = useMutation({
        mutationFn: ({ platform, amount }: { platform: string, amount: number }) => api.updatePlatformCash(platform, amount),
        onSuccess: (_, variables) => {
            // Optimistically update local cash state or refetch?
            // Refetching is safer. Or just update state manually.
            setPlatformCash(prev => ({ ...prev, [variables.platform]: variables.amount }));
        }
    });

    const updatePlatformMutation = useMutation({
        mutationFn: async ({ oldName, newName, newColor }: { oldName: string, newName: string, newColor?: string }) => {
            if (oldName !== newName) await api.renamePlatform(oldName, newName);
            if (newColor) await api.updatePlatformColor(newName, newColor);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holdings'] });
            queryClient.invalidateQueries({ queryKey: ['platformColors'] });
        }
    });

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPlatformEditModalOpen, setIsPlatformEditModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    // Handlers
    const handleEdit = (inv: Investment) => {
        setSelectedInvestment(inv);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this investment?')) {
            deleteInvestmentMutation.mutate(id);
        }
    };

    const handleSaveInvestment = async (id: number, updates: Partial<Investment>) => {
        updateInvestmentMutation.mutate({ id, updates });
        setIsEditModalOpen(false);
    };

    const handleAddInvestment = () => setIsAddModalOpen(true);

    const handleSaveNewInvestment = () => {
        // Modal handles the API call internally (based on previous logic), 
        // OR we need to verify if it passes data.
        // Based on previous code: handleSaveNewInvestment = () => fetchData();
        // So it just expects a refresh.
        queryClient.invalidateQueries({ queryKey: ['holdings'] });
        setIsAddModalOpen(false);
    };

    const handleUpdateCash = async (platform: string, amount: number) => {
        await updateCashMutation.mutateAsync({ platform, amount });
    };

    const handleEditPlatform = (platform: string) => {
        setSelectedPlatform(platform);
        setIsPlatformEditModalOpen(true);
    };

    const handleSavePlatform = async (oldName: string, newName: string, newColor?: string) => {
        await updatePlatformMutation.mutateAsync({ oldName, newName, newColor });
        setIsPlatformEditModalOpen(false);
        setSelectedPlatform(null);
    };



    if (isLoadingHoldings) {
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

    if (isError || !holdings) {
        return (
            <div className="text-center py-20">
                <h2 className="text-red-500 text-xl font-bold">Error</h2>
                <p className="text-slate-400">{error?.message || "No data available"}</p>
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
    // Calculate Summary Metrics
    let totalInvestmentsValue = 0;
    let totalSpent = 0;
    let totalCash = 0;

    sortedPlatforms.forEach(p => {
        // sum investments value
        totalInvestmentsValue += p.investments.reduce((sum, inv) => sum + (inv.holdings * inv.current_price), 0);
        // sum investments cost
        const platformInvestedSpent = p.investments.reduce((sum, inv) => sum + inv.amount_spent, 0);
        totalSpent += platformInvestedSpent;
        // sum cash
        totalCash += p.cash;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Portfolio</h1>
                <button
                    onClick={handleAddInvestment}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Investment
                </button>
            </div>

            <InvestmentSummaryCard
                totalValue={totalInvestmentsValue}
                totalCash={totalCash}
                totalSpent={totalSpent}
            />

            <div className="space-y-6">
                {sortedPlatforms.map((platform) => (
                    <InvestmentPlatformCard
                        key={platform.name}
                        platformName={platform.name}
                        investments={platform.investments}
                        totalValue={platform.totalValue}
                        platformCash={platform.cash}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUpdateCash={handleUpdateCash}
                        onEditPlatform={handleEditPlatform}
                    />
                ))}
            </div>

            {/* Modals */}
            <AddInvestmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveNewInvestment}
                existingPlatforms={platforms.map(([name]) => name)}
            />

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
                    key={selectedPlatform}
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
