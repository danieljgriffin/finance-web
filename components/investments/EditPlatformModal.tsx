'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface EditPlatformModalProps {
    platformName: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (oldName: string, newName: string, newColor?: string) => Promise<void>;
}

export function EditPlatformModal({ platformName, isOpen, onClose, onSave }: EditPlatformModalProps) {
    const [newName, setNewName] = useState(platformName);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Preset colors matching Tailwind classes used + some hexes if needed,
    // but better to stick to classes for consistency OR use HEX if we want true freedom.
    // However, InvestmentPlatformCard uses `bg-blue-600` classes.
    // Let's offer a palette of tailwind-like hexes or class names.
    // Actually, `PLATFORM_COLORS` uses classes. If we save a class, we need to apply it as className.
    // If we save a Hex, we need style={{backgroundColor}}.
    // Let's stick to Classes for now to match the "Dot" style perfectly, or clear generic Colors.
    // Let's try Generic Hex so it's flexible.
    const PRESET_COLORS = [
        '#2563eb', // blue-600
        '#10b981', // emerald-500
        '#f43f5e', // rose-500
        '#f97316', // orange-500
        '#a855f7', // purple-500
        '#0ea5e9', // sky-500
        '#14b8a6', // teal-500
        '#dc2626', // red-600
        '#64748b', // slate-500
        '#eab308', // yellow-500
    ];

    // Reset state when platformName changes
    useEffect(() => {
        setNewName(platformName);
        // We could also reset color here if we had the current color passed in as a prop
        // But for now, platformName is the critical sync target
        setSelectedColor(null);
    }, [platformName]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            // We need to pass both name and color. The API might need strict separation if renaming logic is separate.
            // But we can bundle it in onSave wrapper in parent.
            await onSave(platformName, newName, selectedColor || undefined);
            onClose();
        } catch (error) {
            console.error("Failed to update platform", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Platform</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Platform Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Platform Color</label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
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

                {/* Trading212 Auto-Sync Section */}
                {platformName === 'Trading212 ISA' && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <h3 className="text-sm font-bold text-white mb-4">Auto-Sync Settings</h3>
                        <Trading212SyncSettings />
                    </div>
                )}
            </div>
        </div>
    );
}

function Trading212SyncSettings() {
    const [enabled, setEnabled] = useState(false);
    const [apiKeyId, setApiKeyId] = useState('');
    const [apiSecretKey, setApiSecretKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        // Check current status
        // Check current status
        api.request<{ enabled: boolean }>('/holdings/config/trading212')
            .then(data => setEnabled(data.enabled))
            .catch(err => console.error(err));
    }, []);

    const handleSaveConfig = async () => {
        setIsLoading(true);
        setStatusMsg('');
        try {
            const data = await api.request<{ status: string }>('/holdings/config/trading212', {
                method: 'POST',
                // Content-Type is handled by apiClient
                body: JSON.stringify({
                    api_key_id: apiKeyId,
                    api_secret_key: apiSecretKey
                })
            });
            if (data.status === 'success') {
                setStatusMsg('Saved & Enabled!');
                setEnabled(true);
                setApiKeyId(''); // Clear for security
                setApiSecretKey('');
            } else {
                setStatusMsg('Error saving config');
            }
        } catch (e) {
            setStatusMsg('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Enable Background Sync (Every 15s)</span>
                <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="New API Key ID (Optional)"
                    value={apiKeyId}
                    onChange={(e) => setApiKeyId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                    type="password"
                    placeholder="New API Secret Key (Optional)"
                    value={apiSecretKey}
                    onChange={(e) => setApiSecretKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                    onClick={handleSaveConfig}
                    disabled={isLoading || !apiKeyId || !apiSecretKey}
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Encrypting & Saving...' : 'Enable Auto-Sync'}
                </button>
                {statusMsg && <p className="text-xs text-center text-emerald-400">{statusMsg}</p>}
            </div>
        </div>
    );
}
