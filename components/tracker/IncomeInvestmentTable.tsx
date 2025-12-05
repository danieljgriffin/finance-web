'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, IncomeData } from '@/lib/apiClient';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IncomeInvestmentTable() {
    const [data, setData] = useState<IncomeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit state
    const [editData, setEditData] = useState<IncomeData[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const result = await api.getIncomeData();
            // Sort by year ascending (e.g., 2017, 2018 ...)
            const sorted = result.sort((a, b) => a.year.localeCompare(b.year));
            setData(sorted);
            setEditData(sorted);
        } catch (error) {
            console.error("Failed to fetch income data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setEditData([...data]); // Reset to current data
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData([...data]);
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            // Save all rows that changed
            // In a real app we might batch this or only save changes. 
            // The API updates one by one.
            const promises = editData.map(item =>
                api.updateIncomeData(item.year, item.income, item.investment)
            );
            await Promise.all(promises);

            await fetchData(); // Refresh
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save data", error);
            alert("Failed to save changes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (index: number, field: 'income' | 'investment' | 'year', value: string | number) => {
        const newData = [...editData];
        newData[index] = { ...newData[index], [field]: value };
        setEditData(newData);
    };

    const addNewRow = () => {
        const nextYear = (new Date().getFullYear()).toString();
        // Check if exists, if so increment? Or just let user type.
        // User can type the year.
        setEditData([...editData, { year: '', income: 0, investment: 0 }]);
    };

    const removeRow = (index: number) => {
        // Only allow removing in edit mode (visually), but API doesn't have delete yet?
        // The prompt says "update numbers", doesn't explicitly ask for delete.
        // Let's assume we can't delete from DB easily without an endpoint, so just UI remove for new unsaved rows?
        // Or actually, if we just want to update numbers, maybe we assume rows exist or only "add new" works for new years.
        // For now, let's just allow adding new rows and editing existing.
        // If user wants to "delete", setup 0/0? 
        const newData = [...editData];
        newData.splice(index, 1);
        setEditData(newData);
    };

    // Calculate totals
    const totals = useMemo(() => {
        const sourceData = isEditing ? editData : data;
        const totalIncome = sourceData.reduce((sum, item) => sum + (Number(item.income) || 0), 0);
        const totalInvested = sourceData.reduce((sum, item) => sum + (Number(item.investment) || 0), 0);
        const percentInvested = totalIncome > 0 ? (totalInvested / totalIncome) * 100 : 0;
        return { totalIncome, totalInvested, percentInvested };
    }, [data, editData, isEditing]);

    if (isLoading && data.length === 0) {
        return <div className="animate-pulse bg-slate-900 h-64 rounded-xl border border-slate-800" />;
    }

    const displayData = isEditing ? editData : data;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-white">Income vs Investments Overview</h2>
                    <p className="text-slate-400 text-sm">Track yearly take-home income and investment amounts</p>
                </div>
                <div>
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#0f1623] border-b border-slate-800">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Year</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Take Home Income</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Invested</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">% Invested</th>
                                {isEditing && <th className="p-4 w-10"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {displayData.map((row, index) => {
                                const income = Number(row.income) || 0;
                                const invested = Number(row.investment) || 0;
                                const percent = income > 0 ? (invested / income) * 100 : 0;

                                return (
                                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-white font-medium">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={row.year}
                                                    onChange={(e) => handleInputChange(index, 'year', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-32 focus:outline-none focus:border-blue-500"
                                                    placeholder="Year"
                                                />
                                            ) : (
                                                row.year
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-slate-500">£</span>
                                                    <input
                                                        type="number"
                                                        value={row.income}
                                                        onChange={(e) => handleInputChange(index, 'income', Number(e.target.value))}
                                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-32 text-right focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-300 text-sm font-medium">
                                                    £{income.toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-slate-500">£</span>
                                                    <input
                                                        type="number"
                                                        value={row.investment}
                                                        onChange={(e) => handleInputChange(index, 'investment', Number(e.target.value))}
                                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-32 text-right focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-300 text-sm font-medium">
                                                    £{invested.toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-slate-300 font-medium">
                                                {percent.toFixed(1)}%
                                            </span>
                                        </td>
                                        {isEditing && (
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => removeRow(index)}
                                                    className="text-slate-500 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}

                            {/* Total Row */}
                            <tr className="bg-[#0f1623] font-bold border-t-2 border-slate-700">
                                <td className="p-4 text-white">TOTAL</td>
                                <td className="p-4 text-right text-white">£{totals.totalIncome.toLocaleString()}</td>
                                <td className="p-4 text-right text-white">£{totals.totalInvested.toLocaleString()}</td>
                                <td className="p-4 text-right text-emerald-500">{totals.percentInvested.toFixed(1)}%</td>
                                {isEditing && <td></td>}
                            </tr>
                        </tbody>
                    </table>

                    {isEditing && (
                        <div className="p-4 border-t border-slate-800">
                            <button
                                onClick={addNewRow}
                                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Year
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
