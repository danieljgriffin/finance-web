import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
// Update frontend to use 'added' or 'added_new'
interface SyncResult {
    status: string;
    added?: number;
    updated?: number;
    deleted?: number;
    total_synced?: number;
}
import { api, Investment } from '@/lib/apiClient';

interface PlatformData {
    name: string;
    investments: Investment[];
}

interface AddInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    existingPlatforms: string[];
    platformsData?: PlatformData[];
}

type ViewState = 'selection' | 'manual' | 'trading212';

export function AddInvestmentModal({ isOpen, onClose, onSave, existingPlatforms, platformsData }: AddInvestmentModalProps) {
    const [view, setView] = useState<ViewState>('selection');
    const [isLoading, setIsLoading] = useState(false);

    // Manual Form State
    const [platform, setPlatform] = useState('');
    const [isNewPlatform, setIsNewPlatform] = useState(false);
    const [newPlatformName, setNewPlatformName] = useState('');
    const [name, setName] = useState('');
    const [holdings, setHoldings] = useState('');
    const [inputType, setInputType] = useState<'amount_spent' | 'avg_price'>('amount_spent');
    const [amount, setAmount] = useState('');
    const [symbol, setSymbol] = useState('');

    // Investment search/dropdown state
    const [investmentSearch, setInvestmentSearch] = useState('');
    const [showInvestmentDropdown, setShowInvestmentDropdown] = useState(false);
    const [selectedExistingInvestment, setSelectedExistingInvestment] = useState<Investment | null>(null);
    const [isNewInvestment, setIsNewInvestment] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Trading212 Form State
    const [apiKeyId, setApiKeyId] = useState('');
    const [apiSecretKey, setApiSecretKey] = useState('');

    // Get investments for the selected platform
    const platformInvestments = useMemo(() => {
        if (!platformsData || !platform || isNewPlatform) return [];
        const found = platformsData.find(p => p.name === platform);
        return found?.investments || [];
    }, [platformsData, platform, isNewPlatform]);

    // Filtered investments based on search
    const filteredInvestments = useMemo(() => {
        if (!investmentSearch.trim()) return platformInvestments;
        const query = investmentSearch.toLowerCase();
        return platformInvestments.filter(inv =>
            inv.name.toLowerCase().includes(query) ||
            (inv.symbol && inv.symbol.toLowerCase().includes(query))
        );
    }, [platformInvestments, investmentSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowInvestmentDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset investment selection when platform changes
    useEffect(() => {
        setSelectedExistingInvestment(null);
        setIsNewInvestment(false);
        setInvestmentSearch('');
        setName('');
        setSymbol('');
    }, [platform, isNewPlatform]);

    const handleSelectExistingInvestment = (inv: Investment) => {
        setSelectedExistingInvestment(inv);
        setIsNewInvestment(false);
        setName(inv.name);
        setSymbol(inv.symbol || '');
        setInvestmentSearch(inv.name);
        setShowInvestmentDropdown(false);
    };

    const handleSelectNewInvestment = () => {
        setSelectedExistingInvestment(null);
        setIsNewInvestment(true);
        setName('');
        setSymbol('');
        setInvestmentSearch('');
        setShowInvestmentDropdown(false);
        // Focus the input after state update
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleClose = () => {
        onClose();
        // Reset view after animation
        setTimeout(() => {
            setView('selection');
            setSelectedExistingInvestment(null);
            setIsNewInvestment(false);
            setInvestmentSearch('');
        }, 300);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const finalPlatform = isNewPlatform ? newPlatformName : platform;
            if (!finalPlatform) return;

            let amountSpent = 0;
            let avgPrice = 0;
            const quantity = parseFloat(holdings);
            const amt = parseFloat(amount);

            if (inputType === 'amount_spent') {
                amountSpent = amt;
                avgPrice = quantity > 0 ? amt / quantity : 0;
            } else {
                avgPrice = amt;
                amountSpent = quantity * amt;
            }

            const investmentName = selectedExistingInvestment ? selectedExistingInvestment.name : name;

            await api.addInvestment({
                platform: finalPlatform,
                name: investmentName,
                holdings: quantity,
                amount_spent: amountSpent,
                average_buy_price: avgPrice,
                symbol: symbol || undefined,
                current_price: 0
            });

            onSave();
            handleClose();
            // Reset form
            setName('');
            setHoldings('');
            setAmount('');
            setSymbol('');
            setSelectedExistingInvestment(null);
            setIsNewInvestment(false);
            setInvestmentSearch('');
        } catch (err) {
            console.error(err);
            alert('Failed to add investment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleT212Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await api.importTrading212(apiKeyId, apiSecretKey);
            alert(`Successfully synced! Added: ${result.added || result.added_new || 0}, Deleted Old: ${result.deleted || result.deleted_old || 0}`);
            onSave();
            handleClose();
        } catch (err: unknown) {
            console.error(err);
            alert('Failed to connect. Please REVOKE your current key in Trading212 and GENERATE A NEW ONE. Ensure "Account Data" and "Portfolio" are checked.');
        } finally {
            setIsLoading(false);
        }
    };

    const hasPlatformInvestments = platformInvestments.length > 0;
    const showSearchableDropdown = !isNewPlatform && platform && hasPlatformInvestments && !isNewInvestment;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="div" className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">
                                        {view === 'selection' && 'Add Investment'}
                                        {view === 'manual' && 'Add Manual Investment'}
                                        {view === 'trading212' && 'Connect Trading 212'}
                                    </h3>
                                    {view !== 'selection' && (
                                        <button
                                            onClick={() => setView('selection')}
                                            className="text-slate-400 hover:text-white text-sm"
                                        >
                                            Back
                                        </button>
                                    )}
                                </Dialog.Title>

                                {view === 'selection' && (
                                    <div className="space-y-4">
                                        <p className="text-slate-400 text-sm mb-6">Choose how you&apos;d like to add investments:</p>

                                        <button
                                            onClick={() => setView('manual')}
                                            className="w-full group relative flex items-center p-4 border border-blue-500 rounded-xl hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h4 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">Add Manual Investment</h4>
                                                <p className="text-sm text-slate-400 mt-1">Manually enter investment details for any platform</p>
                                            </div>
                                            <div className="ml-2 text-slate-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setView('trading212')}
                                            className="w-full group relative flex items-center p-4 border border-slate-700 rounded-xl hover:border-green-500 hover:bg-slate-800 transition-all text-left"
                                        >
                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h4 className="text-base font-medium text-white group-hover:text-green-400 transition-colors">Connect to Trading 212</h4>
                                                <p className="text-sm text-slate-400 mt-1">Automatically sync your Trading 212 portfolio</p>
                                            </div>
                                            <div className="ml-2 text-slate-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>

                                        <div className="flex justify-end mt-6">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {view === 'manual' && (
                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                                                <select
                                                    value={isNewPlatform ? 'new' : platform}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'new') {
                                                            setIsNewPlatform(true);
                                                        } else {
                                                            setIsNewPlatform(false);
                                                            setPlatform(e.target.value);
                                                        }
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="" disabled>Select Platform</option>
                                                    {existingPlatforms.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                    <option value="new">+ Add New Platform</option>
                                                </select>
                                            </div>
                                            {isNewPlatform && (
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">New Platform Name</label>
                                                    <input
                                                        type="text"
                                                        value={newPlatformName}
                                                        onChange={(e) => setNewPlatformName(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                        placeholder="e.g. Coinbase"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {/* Investment Name - Searchable Dropdown or Free Text */}
                                            <div className={isNewPlatform ? "col-span-2" : ""} ref={dropdownRef}>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                                    Investment Name
                                                </label>

                                                {showSearchableDropdown ? (
                                                    /* Searchable dropdown for existing platform */
                                                    <div className="relative">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={investmentSearch}
                                                                onChange={(e) => {
                                                                    setInvestmentSearch(e.target.value);
                                                                    setShowInvestmentDropdown(true);
                                                                    if (selectedExistingInvestment) {
                                                                        setSelectedExistingInvestment(null);
                                                                    }
                                                                }}
                                                                onFocus={() => setShowInvestmentDropdown(true)}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-blue-500"
                                                                placeholder="Search investments..."
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowInvestmentDropdown(!showInvestmentDropdown)}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-slate-300"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {showInvestmentDropdown && (
                                                            <div className="absolute z-50 w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                                                                {/* New investment option */}
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSelectNewInvestment}
                                                                    className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-slate-800 border-b border-slate-800 transition-colors"
                                                                >
                                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex-shrink-0">+</span>
                                                                    <span className="text-sm text-blue-400 font-medium">Add New Investment</span>
                                                                </button>

                                                                {/* Existing investments */}
                                                                {filteredInvestments.length > 0 ? (
                                                                    filteredInvestments.map(inv => (
                                                                        <button
                                                                            key={inv.id}
                                                                            type="button"
                                                                            onClick={() => handleSelectExistingInvestment(inv)}
                                                                            className={`w-full px-3 py-2.5 text-left hover:bg-slate-800 transition-colors ${selectedExistingInvestment?.id === inv.id ? 'bg-slate-800 border-l-2 border-blue-500' : ''
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-sm text-white truncate">{inv.name}</p>
                                                                                    <p className="text-[11px] text-slate-500">
                                                                                        {inv.symbol && <span className="text-slate-400 font-mono">{inv.symbol}</span>}
                                                                                        {inv.symbol && ' · '}
                                                                                        {inv.holdings.toFixed(2)} shares · £{inv.amount_spent.toFixed(2)} invested
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-right flex-shrink-0 ml-2">
                                                                                    <p className="text-xs text-slate-400">£{(inv.holdings * inv.current_price).toFixed(2)}</p>
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-3 py-3 text-center text-xs text-slate-500">
                                                                        No matching investments found
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Selected existing investment badge */}
                                                        {selectedExistingInvestment && (
                                                            <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                <span className="text-[11px] text-blue-300">
                                                                    Adding to existing · {selectedExistingInvestment.holdings.toFixed(2)} shares @ avg £{selectedExistingInvestment.average_buy_price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : isNewInvestment ? (
                                                    /* Free text input for new investment (after clicking "+ Add New") */
                                                    <div className="relative">
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                            placeholder="e.g. Tesla Stock"
                                                            required
                                                        />
                                                        {hasPlatformInvestments && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsNewInvestment(false);
                                                                    setInvestmentSearch('');
                                                                    setName('');
                                                                }}
                                                                className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                                                            >
                                                                ← Back to existing investments
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Default free text (no platform selected, or new platform, or no existing investments) */
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                        placeholder="e.g. Tesla Stock"
                                                        required={!selectedExistingInvestment}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                                    {selectedExistingInvestment ? 'New Shares to Add' : 'Holdings (Quantity)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={holdings}
                                                    onChange={(e) => setHoldings(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="e.g. 15.5"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Input Type</label>
                                                <select
                                                    value={inputType}
                                                    onChange={(e) => setInputType(e.target.value as 'amount_spent' | 'avg_price')}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="amount_spent">Total Amount Spent</option>
                                                    <option value="avg_price">Avg Buy Price</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                {inputType === 'amount_spent' ? 'Total Amount Spent (£)' : 'Average Buy Price (£)'}
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        {/* Preview of updated totals when adding to existing */}
                                        {selectedExistingInvestment && holdings && amount && (
                                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">After this transaction</p>
                                                {(() => {
                                                    const newQty = parseFloat(holdings) || 0;
                                                    const newAmt = parseFloat(amount) || 0;
                                                    const newAmountSpent = inputType === 'amount_spent' ? newAmt : newQty * newAmt;
                                                    const totalHoldings = selectedExistingInvestment.holdings + newQty;
                                                    const totalSpent = selectedExistingInvestment.amount_spent + newAmountSpent;
                                                    const newAvgPrice = totalHoldings > 0 ? totalSpent / totalHoldings : 0;
                                                    return (
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Total Shares</p>
                                                                <p className="text-sm text-white font-medium">{totalHoldings.toFixed(4)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Total Spent</p>
                                                                <p className="text-sm text-white font-medium">£{totalSpent.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Avg Buy Price</p>
                                                                <p className="text-sm text-emerald-400 font-medium">£{newAvgPrice.toFixed(4)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Symbol (Optional)</label>
                                            <input
                                                type="text"
                                                value={symbol}
                                                onChange={(e) => setSymbol(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="e.g. TSLA, BTC-USD"
                                                disabled={!!selectedExistingInvestment?.symbol}
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                {selectedExistingInvestment?.symbol
                                                    ? 'Symbol inherited from existing investment'
                                                    : 'Required for live price updates'}
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading || (!name && !selectedExistingInvestment)}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Saving...' : selectedExistingInvestment ? 'Add to Investment' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {view === 'trading212' && (
                                    <form onSubmit={handleT212Submit} className="space-y-6">
                                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-4 space-y-3">
                                            <h4 className="text-sm font-semibold text-white">How to connect:</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                                                <li>Open <strong>Trading 212</strong> and go to <strong>Settings</strong></li>
                                                <li>Navigate to <strong>API</strong> and click <strong>Generate Key</strong></li>
                                                <li>Ensure the following permissions are selected:
                                                    <ul className="list-disc list-inside ml-4 mt-1 text-slate-400">
                                                        <li>Account Data</li>
                                                        <li>History</li>
                                                        <li>Portfolio</li>
                                                    </ul>
                                                </li>
                                                <li>Copy your API Key details below</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">API Key ID</label>
                                                <input
                                                    type="text"
                                                    value={apiKeyId}
                                                    onChange={(e) => setApiKeyId(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                                                    placeholder="Enter your API Key ID"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Secret Key</label>
                                                <input
                                                    type="password"
                                                    value={apiSecretKey}
                                                    onChange={(e) => setApiSecretKey(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                                                    placeholder="Enter your Secret Key"
                                                    required
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1">If you only have one key, paste it in &quot;Secret Key&quot;.</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Syncing...' : 'Connect & Sync'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
