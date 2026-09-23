'use client';

import { FormEvent, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRightLeft, Info, LoaderCircle, Plus, X } from 'lucide-react';
import { CreateCashflowMovement, CreateTrackerEntry } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type ActivityMode = 'income_investment' | 'withdrawal' | 'transfer';

interface RecordActivityModalProps {
    platforms: string[];
    isSaving: boolean;
    onClose: () => void;
    onSaveEntry: (entry: CreateTrackerEntry) => Promise<void>;
    onSaveMovement: (movement: CreateCashflowMovement) => Promise<void>;
}

function getLocalDateValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createEntryKey(prefix: string) {
    const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${suffix}`;
}

export function RecordActivityModal({
    platforms,
    isSaving,
    onClose,
    onSaveEntry,
    onSaveMovement,
}: RecordActivityModalProps) {
    const today = getLocalDateValue();
    const [mode, setMode] = useState<ActivityMode>('income_investment');
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeDate, setIncomeDate] = useState(today);
    const [investmentAmount, setInvestmentAmount] = useState('');
    const [investmentDate, setInvestmentDate] = useState(today);
    const [investmentPlatform, setInvestmentPlatform] = useState('');
    const [movementAmount, setMovementAmount] = useState('');
    const [movementDate, setMovementDate] = useState(today);
    const [sourcePlatform, setSourcePlatform] = useState('');
    const [destinationPlatform, setDestinationPlatform] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submissionLock = useRef(false);
    const trackerEntryKey = useRef(createEntryKey('tracker-entry'));
    const movementEntryKey = useRef(createEntryKey('movement'));
    const isBusy = isSaving || isSubmitting;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submissionLock.current) return;
        setError(null);

        try {
            submissionLock.current = true;
            setIsSubmitting(true);

            if (mode === 'income_investment') {
                const numericIncome = incomeAmount.trim() ? Number(incomeAmount) : 0;
                const numericInvestment = investmentAmount.trim() ? Number(investmentAmount) : 0;

                if (!Number.isFinite(numericIncome) || numericIncome < 0
                    || !Number.isFinite(numericInvestment) || numericInvestment < 0) {
                    throw new Error('Amounts must be valid positive numbers.');
                }
                if (numericIncome <= 0 && numericInvestment <= 0) {
                    throw new Error('Enter an income amount, an investment amount, or both.');
                }
                if (investmentPlatform.trim().toLowerCase() === 'cash') {
                    throw new Error('Choose the brokerage receiving the investment, not standalone Cash.');
                }

                await onSaveEntry({
                    entry_key: trackerEntryKey.current,
                    income_amount: numericIncome,
                    ...(numericIncome > 0 ? { income_date: incomeDate } : {}),
                    investment_amount: numericInvestment,
                    ...(numericInvestment > 0 ? { investment_date: investmentDate } : {}),
                    ...(numericInvestment > 0 && investmentPlatform.trim()
                        ? { destination_platform: investmentPlatform.trim() }
                        : {}),
                    ...(note.trim() ? { note: note.trim() } : {}),
                });
            } else {
                const numericAmount = Number(movementAmount);
                const source = sourcePlatform.trim();
                const destination = destinationPlatform.trim();

                if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                    throw new Error('Enter a positive movement amount.');
                }
                if (!source) {
                    throw new Error('Choose or enter the source platform.');
                }
                if (source.toLowerCase() === 'cash' || destination.toLowerCase() === 'cash') {
                    throw new Error('Standalone Cash is outside portfolio performance. Use Withdrawal when money leaves a brokerage.');
                }
                if (mode === 'transfer' && !destination) {
                    throw new Error('Choose or enter the destination platform.');
                }
                if (mode === 'transfer' && source.toLowerCase() === destination.toLowerCase()) {
                    throw new Error('Source and destination must be different.');
                }

                await onSaveMovement({
                    effective_date: movementDate,
                    amount: numericAmount,
                    flow_type: mode,
                    source_platform: source,
                    ...(mode === 'transfer' ? { destination_platform: destination } : {}),
                    ...(note.trim() ? { note: note.trim() } : {}),
                    event_key: movementEntryKey.current,
                });
            }

            onClose();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Unable to record this activity.');
        } finally {
            submissionLock.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <button
                type="button"
                aria-label="Close activity dialog"
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => {
                    if (!isBusy) onClose();
                }}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="record-activity-title"
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0B101B] shadow-2xl shadow-black/50"
            >
                <div className="border-b border-slate-800 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 id="record-activity-title" className="text-xl font-semibold text-white">Record financial activity</h2>
                            <p className="mt-1 text-sm text-slate-400">Update your yearly totals and portfolio cash-flow record.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Activity type</label>
                        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-1.5 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => setMode('income_investment')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                    mode === 'income_investment'
                                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                )}
                            >
                                <Plus className="h-4 w-4" />
                                Income & investment
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('withdrawal')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                    mode === 'withdrawal'
                                        ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                )}
                            >
                                <ArrowDownToLine className="h-4 w-4" />
                                Withdrawal
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('transfer')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                    mode === 'transfer'
                                        ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                )}
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                                Internal transfer
                            </button>
                        </div>
                    </div>

                    <datalist id="activity-platform-options">
                        {platforms.map((platform) => <option key={platform} value={platform} />)}
                    </datalist>

                    {mode === 'income_investment' ? (
                        <>
                            <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-white">Take-home income <span className="font-normal text-slate-500">(optional)</span></h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <AmountInput id="income-amount" label="Amount received" value={incomeAmount} onChange={setIncomeAmount} />
                                    <DateInput id="income-date" label="Date received" value={incomeDate} max={today} onChange={setIncomeDate} />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-white">New investment <span className="font-normal text-slate-500">(optional)</span></h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <AmountInput id="investment-amount" label="Amount invested" value={investmentAmount} onChange={setInvestmentAmount} />
                                    <DateInput id="investment-date" label="Date invested" value={investmentDate} max={today} onChange={setInvestmentDate} />
                                    <div className="sm:col-span-2">
                                        <label htmlFor="investment-platform" className="mb-1.5 block text-xs font-medium text-slate-400">Brokerage <span className="text-slate-600">(optional)</span></label>
                                        <input
                                            id="investment-platform"
                                            type="text"
                                            list="activity-platform-options"
                                            value={investmentPlatform}
                                            onChange={(event) => setInvestmentPlatform(event.target.value)}
                                            placeholder="e.g. Trading 212"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-700 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs leading-relaxed text-slate-400">
                                <Info className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                                <p>Use the real dates. Income on 20 September and an investment on 26 September are stored separately, grouped into September, and added to the 2026 totals automatically.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <AmountInput id="movement-amount" label="Amount" value={movementAmount} onChange={setMovementAmount} required />
                                <DateInput id="movement-date" label="Effective date" value={movementDate} max={today} onChange={setMovementDate} required />
                            </div>
                            <div className={cn('grid grid-cols-1 gap-4', mode === 'transfer' && 'sm:grid-cols-2')}>
                                <div>
                                    <label htmlFor="movement-source" className="mb-1.5 block text-xs font-medium text-slate-400">Source platform</label>
                                    <input
                                        id="movement-source"
                                        type="text"
                                        list="activity-platform-options"
                                        value={sourcePlatform}
                                        onChange={(event) => setSourcePlatform(event.target.value)}
                                        required
                                        placeholder="e.g. Trading 212"
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-700 focus:border-blue-500"
                                    />
                                </div>
                                {mode === 'transfer' && (
                                    <div>
                                        <label htmlFor="movement-destination" className="mb-1.5 block text-xs font-medium text-slate-400">Destination platform</label>
                                        <input
                                            id="movement-destination"
                                            type="text"
                                            list="activity-platform-options"
                                            value={destinationPlatform}
                                            onChange={(event) => setDestinationPlatform(event.target.value)}
                                            required
                                            placeholder="e.g. Vanguard"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-700 focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-xs leading-relaxed text-slate-400">
                                <Info className="mt-0.5 h-4 w-4 flex-none text-blue-400" />
                                <p>{mode === 'transfer'
                                    ? 'Moving money between investment platforms does not change portfolio performance.'
                                    : 'Use Withdrawal when money leaves the investment portfolio for your bank or standalone cash.'}</p>
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="activity-note" className="mb-1.5 block text-xs font-medium text-slate-400">Note <span className="text-slate-600">(optional)</span></label>
                        <textarea
                            id="activity-note"
                            rows={2}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Add context for your future self"
                            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-700 focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {isBusy ? 'Recording…' : mode === 'income_investment' ? 'Add to tracker' : 'Record movement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface AmountInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

function AmountInput({ id, label, value, onChange, required = false }: AmountInputProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                <input
                    id={id}
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-7 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-700 focus:border-blue-500"
                />
            </div>
        </div>
    );
}

interface DateInputProps {
    id: string;
    label: string;
    value: string;
    max: string;
    onChange: (value: string) => void;
    required?: boolean;
}

function DateInput({ id, label, value, max, onChange, required = false }: DateInputProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
            <input
                id={id}
                type="date"
                value={value}
                max={max}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
            />
        </div>
    );
}
