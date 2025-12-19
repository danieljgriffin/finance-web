'use client';

interface InvestmentSummaryCardProps {
    totalValue: number; // Investments Only
    totalCash: number;  // Cash Only
    totalSpent: number; // Investments Cost
}

export function InvestmentSummaryCard({ totalValue, totalCash, totalSpent }: InvestmentSummaryCardProps) {
    // Portfolio Value = Investments + Cash
    const totalPortfolioValue = totalValue + totalCash;

    // Profit is based on Investments performance generally, 
    // unless we consider Cash as 0 profit.
    // If we want P/L of the *Investments*, we use totalValue - totalSpent.
    const totalProfit = totalValue - totalSpent;
    const profitPercent = totalSpent > 0 ? (totalProfit / totalSpent) * 100 : 0;
    const isPositive = totalProfit >= 0;

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-6">Portfolio Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Total Portfolio Value */}
                <div className="text-center md:text-left">
                    <div className="text-3xl font-bold text-white mb-1">
                        £{totalPortfolioValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Total Portfolio Value</div>
                </div>

                {/* Total Spent */}
                <div className="text-center md:text-left">
                    <div className="text-3xl font-bold text-white mb-1">
                        £{totalSpent.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Total Amount Spent</div>
                </div>

                {/* Percentage P/L */}
                <div className="text-center md:text-left">
                    <div className={`text-3xl font-bold mb-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? '+' : ''}{profitPercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Percentage Profit/Loss</div>
                </div>

                {/* Total P/L */}
                <div className="text-center md:text-left">
                    <div className={`text-3xl font-bold mb-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? '+' : ''}£{totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Total Profit/Loss</div>
                </div>
            </div>
        </div>
    );
}
