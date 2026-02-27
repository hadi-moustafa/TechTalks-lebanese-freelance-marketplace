'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Shield, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Level = {
    id: string;
    name: string;
    privileges: string;
};

export default function AccountLevelManager() {
    const [loading, setLoading] = useState(true);
    const [levels, setLevels] = useState<Level[]>([]);
    const [newLevel, setNewLevel] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('account_levels').select('*');
            if (error) throw error;
            setLevels(data || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to fetch account levels');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleAddLevel = async () => {
        if (!newLevel.trim()) return toast.error('Enter a level name');
        setActionLoading('add');
        try {
            const { data, error } = await supabase
                .from('account_levels')
                .insert({ name: newLevel, privileges: '' })
                .select()
                .single();
            if (error) throw error;
            toast.success('Level added');
            setLevels([...levels, data]);
            setNewLevel('');
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to add level');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try {
            const { error } = await supabase.from('account_levels').delete().eq('id', id);
            if (error) throw error;
            toast.success('Level deleted');
            setLevels(levels.filter(l => l.id !== id));
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to delete level');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-lira-text" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="text-green-200" size={24} />
                        Account Levels
                    </h2>
                    <p className="text-green-100 text-sm mt-1">Manage user account tiers & privileges</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {levels.length} Levels
                </div>
            </div>

            <div className="overflow-auto flex-1 p-6">
                {levels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Shield size={48} className="mb-4 text-green-400 bg-green-100 p-2 rounded-full" />
                        <p className="text-lg font-medium">No account levels yet</p>
                        <p className="text-sm">Add your first level below.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {levels.map((level) => (
                            <li key={level.id} className="flex justify-between items-center py-3">
                                <div>
                                    <div className="font-medium text-gray-800">{level.name}</div>
                                    <div className="text-xs text-gray-500">{level.privileges || 'No privileges yet'}</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(level.id)}
                                    disabled={actionLoading === level.id}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === level.id ? <Loader2 className="animate-spin h-4 w-4" /> : <X size={16} />}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6 flex gap-2">
                    <input
                        type="text"
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        placeholder="New level name"
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-200 outline-none"
                    />
                    <Button
                        size="sm"
                        onClick={handleAddLevel}
                        disabled={actionLoading === 'add'}
                    >
                        {actionLoading === 'add' ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={16} />}
                    </Button>
                </div>
            </div>
        </div>
    );
}