'use client';

import { useState, useEffect } from 'react';
import { Investment } from '@/lib/apiClient';
import { X, Save } from 'lucide-react';

interface EditInvestmentModalProps {
    investment: Investment;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, updates: Partial<Investment>) => Promise<void>;
}

export function EditInvestmentModal({ investment, isOpen, onClose, onSave }: EditInvestmentModalProps) {
    const [holdings, setHoldings] = useState(investment.holdings.toString());
    const [avgPrice, setAvgPrice] = useState(investment.average_buy_price.toString());
    const [amountSpent, setAmountSpent] = useState(investment.amount_spent.toString());
    const [isSaving, setIsSaving] = useState(false);

    // Reset form state when investment prop changes
    useEffect(() => {
        setHoldings(investment.holdings.toString());
        setAvgPrice(investment.average_buy_price.toString());
        setAmountSpent(investment.amount_spent.toString());
    }, [investment.id, investment.holdings, investment.average_buy_price, investment.amount_spent]);

    // Auto-calculate amount spent when holdings or avg price changes
    const handleHoldingsChange = (value: string) => {
        setHoldings(value);
        const h = parseFloat(value);
        const p = parseFloat(avgPrice);
        if (!isNaN(h) && !isNaN(p) && h > 0 && p > 0) {
            setAmountSpent((h * p).toFixed(2));
        }
    };

    const handleAvgPriceChange = (value: string) => {
        setAvgPrice(value);
        const h = parseFloat(holdings);
        const p = parseFloat(value);
        if (!isNaN(h) && !isNaN(p) && h > 0 && p > 0) {
            setAmountSpent((h * p).toFixed(2));
        }
    };

    // Auto-calculate avg price when amount spent changes (with holdings fixed)
    const handleAmountSpentChange = (value: string) => {
        setAmountSpent(value);
        const h = parseFloat(holdings);
        const spent = parseFloat(value);
        if (!isNaN(h) && !isNaN(spent) && h > 0 && spent > 0) {
            setAvgPrice((spent / h).toFixed(4));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(investment.id, {
                holdings: parseFloat(holdings),
                average_buy_price: parseFloat(avgPrice),
                amount_spent: parseFloat(amountSpent)
            });
            onClose();
        } catch (error) {
            console.error("Failed to update investment", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Investment</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="text-lg font-semibold text-white">{investment.name}</div>
                        <span className="bg-slate-800 text-blue-400 text-xs px-2 py-0.5 rounded font-medium">
                            {investment.symbol}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500">{investment.platform}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Holdings (Shares)</label>
                        <input
                            type="number"
                            step="any"
                            value={holdings}
                            onChange={(e) => handleHoldingsChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Average Buy Price (£)</label>
                        <input
                            type="number"
                            step="any"
                            value={avgPrice}
                            onChange={(e) => handleAvgPriceChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Total Amount Spent (£)</label>
                        <input
                            type="number"
                            step="any"
                            value={amountSpent}
                            onChange={(e) => handleAmountSpentChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Auto-calculated: Amount = Holdings × Avg Price
                        </p>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

