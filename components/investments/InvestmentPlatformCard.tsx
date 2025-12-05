'use client';

import { useState } from 'react';
import { Investment } from '@/lib/apiClient';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentPlatformCardProps {
    platformName: string;
    investments: Investment[];
    totalValue: number;
}

export function InvestmentPlatformCard({ platformName, investments, totalValue }: InvestmentPlatformCardProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{platformName}</h3>
                        <p className="text-sm text-slate-400">{investments.length} holdings</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-lg font-bold text-white">£{totalValue.toLocaleString()}</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
            </div>

            <div className={cn("border-t border-slate-800", !isOpen && "hidden")}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Instrument</th>
                                <th className="px-6 py-3 font-medium">Quantity</th>
                                <th className="px-6 py-3 font-medium">Price</th>
                                <th className="px-6 py-3 font-medium">Value</th>
                                <th className="px-6 py-3 font-medium">Gain/Loss</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {investments.map((inv) => {
                                const currentValue = inv.holdings * inv.current_price;
                                const costBasis = inv.amount_spent + inv.average_buy_price; // Basic approx if not provided
                                // Or use logic from API if available
                                // Looking at schemas, Investment has `amount_spent`.
                                // Gain = currentValue - amount_spent

                                // Fallback logic if 0
                                const gain = currentValue - inv.amount_spent;
                                const gainPercent = inv.amount_spent > 0 ? (gain / inv.amount_spent) * 100 : 0;

                                return (
                                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{inv.name}</div>
                                            <div className="text-xs text-slate-500">{inv.symbol}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {inv.holdings.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            £{inv.current_price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            £{currentValue.toLocaleString()}
                                        </td>
                                        <td className={cn("px-6 py-4 font-medium", gain >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {gain >= 0 ? '+' : ''}£{gain.toLocaleString()}
                                            <span className="text-xs opacity-70 ml-1">({gainPercent.toFixed(1)}%)</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-950/30 sm:hidden flex justify-between items-center border-t border-slate-800">
                    <span className="text-slate-400 font-medium">Total</span>
                    <span className="text-white font-bold">£{totalValue.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
