'use client';

import { useState } from 'react';
import { Investment } from '@/lib/apiClient';
import { ChevronDown, ChevronUp, Wallet, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlatformColor } from '@/lib/constants';

interface InvestmentPlatformCardProps {
    platformName: string;
    investments: Investment[];
    totalValue: number;
    platformCash?: number;
    onEdit: (inv: Investment) => void;
    onDelete: (id: number) => void;
    onUpdateCash: (platform: string, amount: number) => Promise<void>;
}

export function InvestmentPlatformCard({
    platformName,
    investments,
    totalValue,
    platformCash = 0,
    onEdit,
    onDelete,
    onUpdateCash,
    onEditPlatform,
    customColor
}: InvestmentPlatformCardProps & { onEditPlatform: (platform: string) => void, customColor?: string }) {
    const [isOpen, setIsOpen] = useState(true);
    const [cashInput, setCashInput] = useState(platformCash.toString());
    const [isUpdatingCash, setIsUpdatingCash] = useState(false);

    // If customColor is provided (hex), use it. otherwise use default class logic
    const hasCustomColor = !!customColor;
    const defaultPlatformColor = getPlatformColor(platformName);
    const isCashPlatform = investments.length === 0;

    // ... calculations ...
    const totalHoldingsValue = investments.reduce((sum, inv) => sum + (inv.holdings * inv.current_price), 0);
    const totalSpent = investments.reduce((sum, inv) => sum + inv.amount_spent, 0);
    const totalGain = totalHoldingsValue - totalSpent;
    const totalGainPercent = totalSpent > 0 ? (totalGain / totalSpent) * 100 : 0;

    const grandTotal = totalHoldingsValue + platformCash;

    const handleCashUpdate = async () => {
        try {
            setIsUpdatingCash(true);
            await onUpdateCash(platformName, parseFloat(cashInput));
        } catch (error) {
            console.error("Failed to update cash", error);
        } finally {
            setIsUpdatingCash(false);
        }
    };

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden mb-6">
            {/* Header */}
            <div
                className="p-4 sm:px-6 sm:py-4 cursor-pointer hover:bg-slate-800/30 transition-colors flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-3 h-3 rounded-full ${!hasCustomColor ? defaultPlatformColor : ''}`}
                        style={hasCustomColor ? { backgroundColor: customColor } : {}}
                    />
                    <h3 className="font-bold text-white text-lg">{platformName}</h3>
                    {!isCashPlatform && (
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                            {investments.length} investments
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditPlatform(platformName); }}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                        title="Edit Platform"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-xl font-bold text-white">£{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-slate-500">Total Value (incl. cash)</div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
            </div>

            {/* Content */}
            <div className={cn("border-t border-slate-800", !isOpen && "hidden")}>

                {/* Only show table if there are investments */}
                {!isCashPlatform && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#0f1522] text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Current Price</th>
                                    <th className="px-6 py-4">Holdings</th>
                                    <th className="px-6 py-4">Current Value</th>
                                    <th className="px-6 py-4">Average Buy Price</th>
                                    <th className="px-6 py-4">Amount Spent</th>
                                    <th className="px-6 py-4">Percentage P/L</th>
                                    <th className="px-6 py-4">Total P/L</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {investments.map((inv) => {
                                    const currentValue = inv.holdings * inv.current_price;
                                    const gain = currentValue - inv.amount_spent;
                                    const gainPercent = inv.amount_spent > 0 ? (gain / inv.amount_spent) * 100 : 0;
                                    const isPositive = gain >= 0;

                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{inv.name}</div>
                                                <span className="bg-blue-900/30 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 font-medium">
                                                    {inv.symbol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">
                                                £{inv.current_price.toLocaleString('en-GB', { maximumFractionDigits: 4 })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">
                                                {inv.holdings.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                £{currentValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">
                                                £{inv.average_buy_price.toLocaleString('en-GB', { maximumFractionDigits: 4 })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">
                                                £{inv.amount_spent.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isPositive ? '+' : ''}{gain.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(inv.id); }}
                                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals Row */}
                            <tfoot className="bg-[#0f1522] border-t border-slate-800 font-bold text-sm">
                                <tr>
                                    <td className="px-6 py-4 text-white">Total</td>
                                    <td colSpan={2}></td>
                                    <td className="px-6 py-4 text-white">£{totalHoldingsValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                    <td className="px-6 py-4 text-white">£{totalSpent.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={`px-6 py-4 ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                                    </td>
                                    <td className={`px-6 py-4 ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* Cash Balance Section */}
                <div className={cn("p-4 flex flex-col sm:flex-row justify-between items-center gap-4", isCashPlatform ? "bg-[#0B101B]" : "bg-slate-900/30 border-t border-slate-800")}>
                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <Wallet className="w-4 h-4 text-slate-500" />
                        Cash Balance: £
                        <span className="text-white">{platformCash.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step="0.01"
                            value={cashInput}
                            onChange={(e) => setCashInput(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            onClick={handleCashUpdate}
                            disabled={isUpdatingCash}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isUpdatingCash ? '...' : 'Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
