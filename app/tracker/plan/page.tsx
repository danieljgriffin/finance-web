'use client';

import { FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, FinancePlan, Investment, InstrumentReference, PlannedBill, PlanItem } from '@/lib/apiClient';

const pounds = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const percentage = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 });
const money = (pence: number) => pounds.format(pence / 100);
const total = (items: PlanItem[] | FinancePlan['allocations']) =>
    items.reduce((sum, item) => sum + item.amount_pence, 0);
const billAnnual = (bill: PlannedBill) => bill.amount_pence * (bill.frequency === 'monthly' ? 12 : 1);
const emptyPlan: FinancePlan = { take_home_monthly_pence: 0, bills: [], allocations: [] };
const input = 'min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white';
const panel = 'rounded-xl border border-slate-800 bg-[#0B101B] p-4 sm:p-5';
const action = 'rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60';
const quiet = 'rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60';
const numericCell = 'whitespace-nowrap py-3 pl-4 text-right tabular-nums';
type PlanSection = 'pay' | 'bills' | 'investments';

function financeTotals(plan: FinancePlan) {
    const annualPay = plan.take_home_monthly_pence * 12;
    const annualInvestments = total(plan.allocations) * 12;
    const annualBills = plan.bills.reduce((sum, bill) => sum + billAnnual(bill), 0);
    return { annualPay, annualInvestments, annualBills, annualFree: annualPay - annualBills - annualInvestments };
}

function platformOrder(platform: string) {
    if (/\b(crypto|coinbase|bitcoin)\b/i.test(platform)) return 2;
    if (/\b(l?isa)\b/i.test(platform)) return 0;
    return 1;
}

export default function FinancePlanPage() {
    const [editing, setEditing] = useState<PlanSection | null>(null);
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: ['financePlan'], queryFn: () => api.getFinancePlan() });
    const holdings = useQuery({
        queryKey: ['financePlanPlatforms'],
        queryFn: () => api.getHoldings(),
        enabled: editing === 'investments',
    });
    const plan = query.data ?? emptyPlan;

    return (
        <div className="mx-auto max-w-6xl space-y-5 text-slate-100">
            {!editing && <PlanHeader />}

            {query.isPending && <p role="status">Loading finance plan…</p>}
            {query.isError && <div role="alert" className={panel}>Couldn’t load the finance plan. <button onClick={() => void query.refetch()} className={quiet}>Try again</button></div>}

            {editing && <PlanEditor
                key={editing}
                section={editing}
                initial={plan}
                holdings={holdings.data ?? {}}
                accountsLoading={holdings.isPending}
                onRetryAccounts={holdings.isError ? () => void holdings.refetch() : undefined}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                    queryClient.setQueryData(['financePlan'], saved);
                    setEditing(null);
                }}
            />}

            {query.isSuccess && !editing && <>
                <PlanOverview plan={plan} blank={!query.data} onEditPay={() => setEditing('pay')} />
                <Bills plan={plan} onEdit={() => setEditing('bills')} />
                <Investments plan={plan} onEdit={() => setEditing('investments')} />
            </>}
        </div>
    );
}

function PlanHeader({ children }: { children?: ReactNode }) {
    return <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Finance plan</h1>
            <p className="mt-1 text-sm text-slate-400">Your ongoing plan for take-home pay, bills and investments.</p>
        </div>
        {children}
    </header>;
}

function PlanOverview({ plan, blank = false, onEditPay }: { plan: FinancePlan; blank?: boolean; onEditPay?: () => void }) {
    const { annualFree, annualPay } = financeTotals(plan);
    return <div className="grid gap-4 sm:grid-cols-2" aria-live="polite">
        <PeriodCard label="Free to spend" annual={annualFree} blank={blank} highlight />
        <PeriodCard label="Take-home pay" annual={annualPay} blank={blank}>
            {onEditPay && <button type="button" className={quiet} onClick={onEditPay}>Edit take-home pay</button>}
        </PeriodCard>
    </div>;
}

function PeriodCard({ label, annual, blank, highlight = false, children }: {
    label: string; annual: number; blank: boolean; highlight?: boolean; children?: ReactNode;
}) {
    const style = highlight && !blank ? (annual < 0 ? 'text-rose-300' : 'text-emerald-300') : 'text-slate-100';
    return <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{label}</h2>
            {children}
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
            <div>
                <dt className="text-sm text-slate-400">Monthly</dt>
                <dd className={`text-2xl font-bold tabular-nums ${style}`}>{blank ? '—' : money(annual / 12)}</dd>
            </div>
            <div>
                <dt className="text-sm text-slate-400">Annual</dt>
                <dd className={`text-2xl font-bold tabular-nums ${style}`}>{blank ? '—' : money(annual)}</dd>
            </div>
        </dl>
    </section>;
}

function Investments({ plan, onEdit }: { plan: FinancePlan; onEdit: () => void }) {
    const invested = total(plan.allocations);
    const share = (amount: number) => invested > 0 ? percentage.format(amount / invested) : '—';
    const allocations = plan.allocations.slice().sort((a, b) => platformOrder(a.platform) - platformOrder(b.platform));
    return <section className={panel} aria-labelledby="planned-investments">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id="planned-investments" className="text-lg font-semibold">Planned investments</h2>
                {plan.take_home_monthly_pence > 0 && <p className="text-sm text-slate-400">
                    {percentage.format(invested / plan.take_home_monthly_pence)} of annual take-home pay
                </p>}
            </div>
            <button type="button" className={quiet} onClick={onEdit}>Edit investments</button>
        </div>
        <p className="mt-1 text-sm text-slate-400">Each share is a percentage of your total planned investments.</p>
        {allocations.length === 0 ? <p className="mt-4 text-sm text-slate-400">Add a platform and the investments you plan to buy.</p> : <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
                <thead className="text-slate-400">
                    <tr>
                        <th scope="col" className="py-2 text-left font-medium">Platform / investment</th>
                        <th scope="col" className={numericCell}>Monthly</th>
                        <th scope="col" className={numericCell}>Annual</th>
                        <th scope="col" className={numericCell}>Share</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-y border-slate-700 bg-slate-800/30 font-semibold">
                        <th scope="row" className="py-3 pl-2 text-left">Total planned investments</th>
                        <InvestmentAmounts amount={invested} share={share(invested)} />
                    </tr>
                    {allocations.map((allocation) => {
                        const unallocated = allocation.amount_pence - total(allocation.funds);
                        return <Fragment key={allocation.platform}>
                            <tr className="border-t border-slate-800 font-semibold">
                                <th scope="row" className="py-3 text-left">{allocation.platform}</th>
                                <InvestmentAmounts amount={allocation.amount_pence} share={share(allocation.amount_pence)} />
                            </tr>
                            {allocation.funds.map((fund, i) => <tr key={i} className="border-t border-slate-800/60 text-slate-300">
                                <th scope="row" className="py-3 pl-4 text-left font-normal">
                                    {fund.name}
                                    {fund.instrument && <span className="mt-0.5 block text-xs text-slate-400">
                                        {fund.instrument.isin ?? fund.instrument.symbol}
                                    </span>}
                                </th>
                                <InvestmentAmounts amount={fund.amount_pence} share={share(fund.amount_pence)} />
                            </tr>)}
                            {allocation.funds.length > 0 && unallocated !== 0 && <tr>
                                <td colSpan={4} className={`pb-3 pl-4 text-xs ${unallocated < 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                                    {unallocated < 0 ? `Listed purchases exceed the platform plan by ${money(-unallocated)} per month.`
                                        : `${money(unallocated)} per month unallocated to investments on this platform.`}
                                </td>
                            </tr>}
                        </Fragment>;
                    })}
                </tbody>
            </table>
        </div>}
    </section>;
}

function InvestmentAmounts({ amount, share }: { amount: number; share: string }) {
    return <>
        <td className={numericCell}>{money(amount)}</td>
        <td className={numericCell}>{money(amount * 12)}</td>
        <td className={numericCell}>{share}</td>
    </>;
}

function Bills({ plan, onEdit }: { plan: FinancePlan; onEdit: () => void }) {
    const { annualBills } = financeTotals(plan);
    return <section className={panel} aria-labelledby="planned-bills">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="planned-bills" className="text-lg font-semibold">Bills and commitments</h2>
            <button type="button" className={quiet} onClick={onEdit}>Edit bills</button>
        </div>
        {plan.bills.length === 0 ? <p className="mt-2 text-sm text-slate-400">Add your recurring bills and commitments.</p> : <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-slate-400"><tr>
                    <th scope="col" className="py-2 text-left font-medium">Bill</th>
                    <th scope="col" className={numericCell}>Monthly equivalent</th>
                    <th scope="col" className={numericCell}>Annual</th>
                </tr></thead>
                <tbody>
                    {plan.bills.map((bill, i) => <tr key={i} className="border-t border-slate-800">
                        <th scope="row" className="py-3 text-left font-normal">{bill.name}{bill.frequency === 'annual' && <span className="ml-2 text-xs text-slate-400">Yearly bill</span>}</th>
                        <td className={numericCell}>{money(billAnnual(bill) / 12)}</td>
                        <td className={numericCell}>{money(billAnnual(bill))}</td>
                    </tr>)}
                    <tr className="border-t border-slate-700 font-semibold">
                        <th scope="row" className="py-3 text-left">Total bills</th>
                        <td className={numericCell}>{money(annualBills / 12)}</td>
                        <td className={numericCell}>{money(annualBills)}</td>
                    </tr>
                </tbody>
            </table>
        </div>}
    </section>;
}

type DraftItem = { name: string; amount: string };
type DraftBill = DraftItem & { frequency: PlannedBill['frequency'] };
type DraftFund = DraftItem & { instrument?: InstrumentReference };
type DraftAllocation = { platform: string; amount: string; funds: DraftFund[] };
const draftItem = (item: PlanItem): DraftItem => ({ name: item.name, amount: String(item.amount_pence / 100) });
const cents = (value: string) => Math.round(Number(value) * 100);
const planItem = (item: DraftItem): PlanItem => ({ name: item.name.trim(), amount_pence: cents(item.amount) });

function PlanEditor({ section, initial, holdings, accountsLoading, onRetryAccounts, onCancel, onSaved }: {
    section: PlanSection;
    initial: FinancePlan;
    holdings: Record<string, Investment[]>;
    accountsLoading: boolean;
    onRetryAccounts?: () => void;
    onCancel: () => void;
    onSaved: (saved: FinancePlan) => void;
}) {
    const [pay, setPay] = useState(String(initial.take_home_monthly_pence / 100));
    const [bills, setBills] = useState<DraftBill[]>(initial.bills.map((bill) => ({ ...draftItem(bill), frequency: bill.frequency })));
    const [allocations, setAllocations] = useState<DraftAllocation[]>(initial.allocations.map((row) => ({
        platform: row.platform, amount: String(row.amount_pence / 100),
        funds: row.funds.map((fund) => ({ ...draftItem(fund), instrument: fund.instrument })),
    })));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const lock = useRef(false);
    const platforms = Object.keys(holdings).filter((name) => name.trim().toLowerCase() !== 'cash').sort();
    const replaceAllocation = (index: number, row: DraftAllocation) =>
        setAllocations((previous) => previous.map((item, i) => i === index ? row : item));
    const changes = {
        pay: { take_home_monthly_pence: cents(pay) },
        bills: { bills: bills.map((bill) => ({ ...planItem(bill), frequency: bill.frequency })) },
        investments: { allocations: allocations.map((row) => ({
            platform: row.platform.trim(), amount_pence: cents(row.amount),
            funds: row.funds.map((fund) => ({ ...planItem(fund), instrument: fund.instrument })),
        })) },
    };
    const draft = { ...initial, ...changes[section] };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (lock.current) return;
        setError('');
        if ((section === 'bills' && draft.bills.some((row) => !row.name)) ||
            (section === 'investments' && draft.allocations.some((row) => row.funds.some((fund) => !fund.name)))) {
            setError('Enter a name for each bill and investment.'); return;
        }
        const names = draft.allocations.map((row) => row.platform.toLowerCase());
        if (section === 'investments' && (names.includes('') || names.includes('cash') || new Set(names).size !== names.length)) {
            setError('Enter each investment platform once.'); return;
        }
        lock.current = true;
        setSaving(true);
        try {
            const saved = await api.getFinancePlan();
            onSaved(await api.saveFinancePlan({ ...(saved ?? initial), ...changes[section] }));
        } catch {
            setError('Couldn’t save the plan. Your edits are still here.');
        } finally {
            lock.current = false;
            setSaving(false);
        }
    }

    const buttons = <div className="flex gap-2">
        <button type="button" className={quiet} onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className={action} disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</button>
    </div>;

    return <form onSubmit={save} className="space-y-5">
        <PlanHeader>{buttons}</PlanHeader>
        {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
        <PlanOverview plan={draft} />
        {section === 'pay' && <fieldset disabled={saving} className={panel}>
            <legend className="px-1 font-semibold">Edit take-home pay</legend>
            <div className="max-w-xs"><AmountField label="Monthly take-home pay (£)" value={pay} onChange={setPay} /></div>
        </fieldset>}
        {section === 'bills' && <fieldset disabled={saving} className={`${panel} space-y-3`}>
            <legend className="px-1 font-semibold">Edit bills</legend>
            {bills.map((bill, index) => {
                const replace = (update: DraftBill) => setBills(bills.map((row, i) => i === index ? update : row));
                return <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_9rem_9rem_auto]">
                    <NameField label="Bill name" value={bill.name} onChange={(name) => replace({ ...bill, name })} />
                    <AmountField label="Amount (£)" value={bill.amount} onChange={(amount) => replace({ ...bill, amount })} />
                    <label className="grid gap-1 text-sm">Frequency
                        <select className={input} value={bill.frequency} onChange={(event) => replace({ ...bill, frequency: event.target.value === 'annual' ? 'annual' : 'monthly' })}>
                            <option value="monthly">Monthly</option><option value="annual">Yearly</option>
                        </select>
                    </label>
                    <button type="button" className={quiet} onClick={() => setBills(bills.filter((_, i) => i !== index))}>Remove bill</button>
                </div>;
            })}
            <button type="button" className={quiet} onClick={() => setBills([...bills, { name: '', amount: '0', frequency: 'monthly' }])}>Add bill</button>
        </fieldset>}
        {section === 'investments' && <fieldset disabled={saving} className={`${panel} space-y-3`}>
            <legend className="px-1 font-semibold">Edit investments</legend>
            {accountsLoading && <p role="status" className="text-sm text-slate-400">Loading Portfolio accounts…</p>}
            {onRetryAccounts && <p className="text-sm text-slate-400">
                Couldn’t load Portfolio accounts. <button type="button" onClick={onRetryAccounts} className="underline">Try again</button>
            </p>}
            {allocations.map((row, index) => <fieldset key={index} className="space-y-3 rounded-lg border border-slate-800 p-3">
                <legend className="px-1 text-sm text-slate-400">{row.platform || 'New platform'}</legend>
                <div className="grid items-end gap-2 sm:grid-cols-[1fr_10rem_auto]">
                    <label className="grid gap-1 text-sm">Platform
                        <select required className={input} value={row.platform}
                            onChange={(event) => replaceAllocation(index, { ...row, platform: event.target.value })}>
                            <option value="" disabled>Select a Portfolio account</option>
                            {row.platform && !platforms.includes(row.platform) &&
                                <option value={row.platform}>{row.platform}{!accountsLoading && !onRetryAccounts ? ' (saved in plan)' : ''}</option>}
                            {platforms.map((platform) => <option key={platform} value={platform}
                                disabled={platform !== row.platform && allocations.some((allocation) => allocation.platform === platform)}>
                                {platform}
                            </option>)}
                        </select>
                    </label>
                    <AmountField label="Monthly platform total (£)" value={row.amount} onChange={(amount) => replaceAllocation(index, { ...row, amount })} />
                    <button type="button" className={quiet} onClick={() => setAllocations(allocations.filter((_, i) => i !== index))}>Remove platform</button>
                </div>
                <FundEditor key={row.platform} items={row.funds} holdings={holdings[row.platform] ?? []}
                    setItems={(funds) => replaceAllocation(index, { ...row, funds })} />
            </fieldset>)}
            <button type="button" className={quiet}
                disabled={allocations.some((row) => !row.platform) || !platforms.some((platform) => !allocations.some((row) => row.platform === platform))}
                onClick={() => setAllocations([...allocations, { platform: '', amount: '0', funds: [] }])}>Add platform</button>
        </fieldset>}
        <div className="flex justify-end border-t border-slate-800 pt-4">
            {buttons}
        </div>
    </form>;
}

function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label className="grid gap-1 text-sm">{label}<input type="number" inputMode="decimal" min="0" max="100000000" step="0.01"
        required value={value} onChange={(event) => onChange(event.target.value)} className={input} /></label>;
}

function NameField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label className="grid gap-1 text-sm">{label}<input required maxLength={200} className={input}
        value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function FundEditor({ items, holdings, setItems }: { items: DraftFund[]; holdings: Investment[]; setItems: (rows: DraftFund[]) => void }) {
    const [searchIndex, setSearchIndex] = useState<number | null>(null);
    const replace = (index: number, update: DraftFund) => setItems(items.map((item, i) => i === index ? update : item));
    return <section className="space-y-2">
        <h3 className="text-sm font-semibold">Investments on this platform</h3>
        {items.map((item, index) => <div key={index}>
            <div className="grid items-start gap-2 sm:grid-cols-[1fr_10rem_auto]">
                <div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                        <NameField label="Investment name" value={item.name}
                            onChange={(name) => replace(index, { name, amount: item.amount })} />
                        <button type="button" className={quiet} aria-expanded={searchIndex === index}
                            onClick={() => setSearchIndex(searchIndex === index ? null : index)}>Find investment</button>
                    </div>
                    {item.instrument && <p className="mt-1 text-xs text-emerald-300">
                        Linked · {item.instrument.isin ?? item.instrument.symbol}
                    </p>}
                </div>
                <AmountField label="Monthly amount (£)" value={item.amount} onChange={(amount) => replace(index, { ...item, amount })} />
                <button type="button" className={`${quiet} sm:mt-6`} onClick={() => {
                    setSearchIndex(null);
                    setItems(items.filter((_, i) => i !== index));
                }}>Remove investment</button>
            </div>
            {searchIndex === index && <FundSearch initialQuery={item.instrument?.symbol ?? item.name}
                holdings={holdings} onSelect={(name, instrument) => {
                    replace(index, { ...item, name, instrument });
                    setSearchIndex(null);
                }} />}
        </div>)}
        <button type="button" className={quiet} onClick={() => {
            setSearchIndex(items.length);
            setItems([...items, { name: '', amount: '0' }]);
        }}>Add investment</button>
    </section>;
}

function FundSearch({ initialQuery, holdings, onSelect }: {
    initialQuery: string;
    holdings: Investment[];
    onSelect: (name: string, instrument: InstrumentReference) => void;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [term, setTerm] = useState(initialQuery.trim());
    useEffect(() => {
        const timeout = window.setTimeout(() => setTerm(query.trim()), 300);
        return () => window.clearTimeout(timeout);
    }, [query]);

    const search = useQuery({
        queryKey: ['marketInstruments', term],
        queryFn: () => api.searchInvestments(term),
        enabled: term.length >= 2 && term === query.trim(),
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    const words = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const results = term === query.trim()
        ? (search.data ?? []).filter(({ type }) => ['stock', 'etf', 'fund', 'crypto'].includes(type))
        : [];
    const marketBySymbol = new Map(results.map((result) => [result.symbol.toUpperCase(), result]));
    const owned = holdings.filter(({ name, symbol }) => symbol && (marketBySymbol.has(symbol.toUpperCase()) ||
        words.every((word) => `${name} ${symbol}`.toLowerCase().includes(word))));
    const matches = results.filter(({ symbol }) =>
        !owned.some((holding) => holding.symbol?.toUpperCase() === symbol.toUpperCase()));
    const searching = query.trim().length >= 2 && (term !== query.trim() || search.isFetching);

    return <div className="mt-2 space-y-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
        <label className="grid gap-1 text-sm">Search investments
            <input type="search" maxLength={200} className={input} value={query} placeholder="Name, ticker or ISIN"
                onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                }} />
        </label>
        <div className="max-h-56 space-y-2 overflow-y-auto">
            {owned.length > 0 && <div>
                <p className="px-2 text-xs font-semibold text-slate-400">Held on this account</p>
                {owned.map(({ id, name, symbol }) => symbol && <button type="button" key={id}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800"
                    onClick={() => {
                        const result = marketBySymbol.get(symbol.toUpperCase());
                        onSelect(result?.name ?? name, {
                            symbol,
                            isin: result?.isin ?? (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(symbol) ? symbol : undefined),
                            type: result?.type,
                            exchange: result?.exchange,
                            currency: result?.currency,
                        });
                    }}>{name} <span className="text-slate-400">· {symbol}</span></button>)}
            </div>}
            {matches.length > 0 && <div>
                <p className="px-2 text-xs font-semibold text-slate-400">Market search</p>
                {matches.map(({ name, ...instrument }) => <button type="button" key={instrument.symbol}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800"
                    onClick={() => onSelect(name, instrument)}>
                    {name} <span className="block text-xs text-slate-400">
                        {[instrument.symbol, instrument.exchange, instrument.currency].filter(Boolean).join(' · ')}
                    </span>
                </button>)}
            </div>}
        </div>
        <p role="status" className="text-xs text-slate-400">
            {searching ? 'Searching…' : search.isError && term === query.trim() ? 'Market search is unavailable. You can keep the name as a manual entry.'
                : query.trim().length < 2 ? 'Enter at least two characters to search the market.'
                    : !matches.length && !owned.length ? 'No matches found. You can keep the name as a manual entry.' : ''}
        </p>
    </div>;
}
