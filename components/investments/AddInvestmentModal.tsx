import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
// Update frontend to use 'added' or 'added_new'
interface SyncResult {
    status: string;
    added?: number;
    updated?: number;
    deleted?: number;
    total_synced?: number;
}
import { api } from '@/lib/apiClient';

interface AddInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    existingPlatforms: string[];
}

type ViewState = 'selection' | 'manual' | 'trading212';

export function AddInvestmentModal({ isOpen, onClose, onSave, existingPlatforms }: AddInvestmentModalProps) {
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

    // Trading212 Form State
    const [apiKeyId, setApiKeyId] = useState('');
    const [apiSecretKey, setApiSecretKey] = useState('');

    const handleClose = () => {
        onClose();
        // Reset view after animation
        setTimeout(() => setView('selection'), 300);
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

            await api.addInvestment({
                platform: finalPlatform,
                name,
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

                                            <div className={isNewPlatform ? "col-span-2" : ""}>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Investment Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="e.g. Tesla Stock"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Holdings (Quantity)</label>
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

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Symbol (Optional)</label>
                                            <input
                                                type="text"
                                                value={symbol}
                                                onChange={(e) => setSymbol(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="e.g. TSLA, BTC-USD"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Required for live price updates</p>
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
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Saving...' : 'Save'}
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
