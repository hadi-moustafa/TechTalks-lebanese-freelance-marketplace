'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Edit2, Save, X, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AccountLevel = {
    id: number;
    level_name: string;
    min_projects_required: number;
    daily_post_limit: number | null;
    price_cap: number | null;
    analytics_visible: boolean;
};

export default function AccountLevelManager() {
    const [levels, setLevels] = useState<AccountLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Level State
    const [newName, setNewName] = useState('');
    const [newMinProjects, setNewMinProjects] = useState('0');
    const [newPostLimit, setNewPostLimit] = useState('');
    const [newPriceCap, setNewPriceCap] = useState('');
    const [newAnalytics, setNewAnalytics] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editMinProjects, setEditMinProjects] = useState('0');
    const [editPostLimit, setEditPostLimit] = useState('');
    const [editPriceCap, setEditPriceCap] = useState('');
    const [editAnalytics, setEditAnalytics] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('account_levels')
                .select('*')
                .order('min_projects_required');

            if (error) throw error;
            setLevels(data || []);
        } catch (error) {
            console.error('Error fetching levels:', error);
            toast.error('Failed to load account levels');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleAdd = async () => {
        if (!newName.trim()) {
            toast.error('Level name is required');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('account_levels')
                .insert({
                    level_name: newName.trim(),
                    min_projects_required: parseInt(newMinProjects) || 0,
                    daily_post_limit: newPostLimit ? parseInt(newPostLimit) : null,
                    price_cap: newPriceCap ? parseFloat(newPriceCap) : null,
                    analytics_visible: newAnalytics
                });

            if (error) throw error;

            toast.success('Level added successfully');
            setNewName('');
            setNewMinProjects('0');
            setNewPostLimit('');
            setNewPriceCap('');
            setNewAnalytics(false);
            setIsAdding(false);
            fetchLevels();
        } catch (error: any) {
            console.error('Error adding level:', error);
            toast.error(error.message || 'Failed to add level');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) {
            toast.error('Level name is required');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('account_levels')
                .update({
                    level_name: editName.trim(),
                    min_projects_required: parseInt(editMinProjects) || 0,
                    daily_post_limit: editPostLimit ? parseInt(editPostLimit) : null,
                    price_cap: editPriceCap ? parseFloat(editPriceCap) : null,
                    analytics_visible: editAnalytics
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('Level updated successfully');
            setEditingId(null);
            fetchLevels();
        } catch (error: any) {
            console.error('Error updating level:', error);
            toast.error(error.message || 'Failed to update level');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This might affect users currently on this level.')) {
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('account_levels')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Level deleted successfully');
            fetchLevels();
        } catch (error: any) {
            console.error('Error deleting level:', error);
            toast.error(error.message || 'Failed to delete level');
        } finally {
            setActionLoading(false);
        }
    };

    const startEditing = (level: AccountLevel) => {
        setEditingId(level.id);
        setEditName(level.level_name);
        setEditMinProjects(level.min_projects_required.toString());
        setEditPostLimit(level.daily_post_limit?.toString() || '');
        setEditPriceCap(level.price_cap?.toString() || '');
        setEditAnalytics(level.analytics_visible);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-lira-text" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-lira-pink-50k to-lira-pink-10k p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-lira-text" size={24} />
                        Account Levels
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Define user progression tiers and limits
                    </p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-lira-text hover:bg-gray-800 text-white"
                    size="sm"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add Level'}
                </Button>
            </div>

            <div className="p-6">
                {isAdding && (
                    <div className="mb-6 bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">New Level Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Level Name</label>
                                <Input
                                    value={newName}
                                    onChange={(e: any) => setNewName(e.target.value)}
                                    placeholder="e.g. Bronze"
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Min Projects</label>
                                <Input
                                    type="number"
                                    value={newMinProjects}
                                    onChange={(e: any) => setNewMinProjects(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Daily Post Limit</label>
                                <Input
                                    type="number"
                                    value={newPostLimit}
                                    onChange={(e: any) => setNewPostLimit(e.target.value)}
                                    placeholder="Unlimited"
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Price Cap ($)</label>
                                <Input
                                    type="number"
                                    value={newPriceCap}
                                    onChange={(e: any) => setNewPriceCap(e.target.value)}
                                    placeholder="No Cap"
                                    className="bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={newAnalytics}
                                    onChange={(e) => setNewAnalytics(e.target.checked)}
                                    className="h-4 w-4 text-lira-text rounded border-gray-300 focus:ring-lira-text"
                                    id="new-analytics"
                                />
                                <label htmlFor="new-analytics" className="text-sm text-gray-700">Analytics Visible</label>
                            </div>

                            <Button
                                onClick={handleAdd}
                                disabled={actionLoading || !newName.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} className="mr-2" />}
                                Create Level
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid gap-4">
                    {levels.map((level) => (
                        <div
                            key={level.id}
                            className={`border rounded-xl p-4 transition-all ${editingId === level.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:shadow-md'}`}
                        >
                            {editingId === level.id ? (
                                // Editing Mode
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <div className="lg:col-span-2">
                                            <label className="text-xs text-blue-600 font-semibold">Name</label>
                                            <Input
                                                value={editName}
                                                onChange={(e: any) => setEditName(e.target.value)}
                                                className="bg-white h-9"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-600 font-semibold">Min Projects</label>
                                            <Input
                                                type="number"
                                                value={editMinProjects}
                                                onChange={(e: any) => setEditMinProjects(e.target.value)}
                                                className="bg-white h-9"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-600 font-semibold">Post Limit</label>
                                            <Input
                                                type="number"
                                                value={editPostLimit}
                                                onChange={(e: any) => setEditPostLimit(e.target.value)}
                                                placeholder="Unlim."
                                                className="bg-white h-9"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-600 font-semibold">Price Cap</label>
                                            <Input
                                                type="number"
                                                value={editPriceCap}
                                                onChange={(e: any) => setEditPriceCap(e.target.value)}
                                                placeholder="None"
                                                className="bg-white h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={editAnalytics}
                                                onChange={(e) => setEditAnalytics(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Analytics Access</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdate(level.id)}
                                                disabled={actionLoading}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                            {level.min_projects_required}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{level.level_name}</h3>
                                            <div className="flex gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    Limit: <strong>{level.daily_post_limit || '∞'}</strong>
                                                </span>
                                                <span className="w-px h-4 bg-gray-300"></span>
                                                <span className="flex items-center gap-1">
                                                    Cap: <strong>{level.price_cap ? `$${level.price_cap}` : 'None'}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${level.analytics_visible ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                                            {level.analytics_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {level.analytics_visible ? 'Analytics' : 'Hidden'}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEditing(level)}
                                                className="text-gray-500 hover:bg-gray-100 h-8 w-8 p-0"
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(level.id)}
                                                className="text-red-400 hover:bg-red-50 h-8 w-8 p-0"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {levels.length === 0 && (
                        <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-xl">
                            No account levels defined.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
