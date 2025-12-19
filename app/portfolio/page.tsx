'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Investment } from '@/lib/apiClient';
import { InvestmentPlatformCard } from '@/components/investments/InvestmentPlatformCard';
import { InvestmentSummaryCard } from '@/components/investments/InvestmentSummaryCard';
import { EditInvestmentModal } from '@/components/investments/EditInvestmentModal';
import { EditPlatformModal } from '@/components/investments/EditPlatformModal';
import { AddInvestmentModal } from '@/components/investments/AddInvestmentModal';

// 1. Define Backend Response Types
interface PlatformSummary {
    name: string;
    total_value: number;
    total_invested: number;
    total_pl: number;
    total_pl_percent: number;
    cash_balance: number;
    investments: Investment[];
    color: string;
}

interface PortfolioSummary {
    total_value: number;
    total_invested: number;
    total_pl: number;
    total_pl_percent: number;
    platforms: PlatformSummary[];
}

export default function InvestmentsPage() {
    const queryClient = useQueryClient();

    // 1. Fetch Portfolio Summary (One Shot)
    const { data, isLoading: isLoadingHoldings, isError, error } = useQuery<PortfolioSummary>({
        queryKey: ['portfolio'],
        queryFn: () => api.fetch<PortfolioSummary>('/holdings/portfolio'),
    });

    // Mutations
    const updateInvestmentMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number, updates: Partial<Investment> }) => api.updateInvestment(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    });

    const deleteInvestmentMutation = useMutation({
        mutationFn: (id: number) => api.deleteInvestment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    });

    const updateCashMutation = useMutation({
        mutationFn: ({ platform, amount }: { platform: string, amount: number }) => api.updatePlatformCash(platform, amount),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    });

    const updatePlatformMutation = useMutation({
        mutationFn: async ({ oldName, newName, newColor }: { oldName: string, newName: string, newColor?: string }) => {
            if (oldName !== newName) await api.renamePlatform(oldName, newName);
            if (newColor) await api.updatePlatformColor(newName, newColor);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
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
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
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

    if (isError || !data) {
        return (
            <div className="text-center py-20">
                <h2 className="text-red-500 text-xl font-bold">Error</h2>
                <p className="text-slate-400">{error?.message || "No data available"}</p>
            </div>
        );
    }

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
                totalPortfolioValue={data.total_value}
                totalInvested={data.total_invested}
                totalProfit={data.total_pl}
                totalProfitPercent={data.total_pl_percent}
            />

            <div className="space-y-6">
                {data.platforms.map((platform) => (
                    <InvestmentPlatformCard
                        key={platform.name}
                        platformName={platform.name}
                        investments={platform.investments}
                        totalValue={platform.total_value}
                        platformCash={platform.cash_balance}
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
                existingPlatforms={data.platforms.map((p) => p.name)}
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
