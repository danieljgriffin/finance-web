export const PLATFORM_COLORS: Record<string, string> = {
    'Degiro': 'bg-blue-600',
    'Trading212 ISA': 'bg-emerald-500',
    'EQ (GSK shares)': 'bg-rose-500',
    'InvestEngine ISA': 'bg-orange-500',
    'Crypto': 'bg-purple-500',
    'HL Stocks & Shares LISA': 'bg-sky-500',
    'Cash': 'bg-teal-500',
    'Vanguard': 'bg-red-600', // Added common one
    'Other': 'bg-slate-500'
};

export const getPlatformColor = (platformName: string): string => {
    return PLATFORM_COLORS[platformName] || PLATFORM_COLORS['Other'];
};
