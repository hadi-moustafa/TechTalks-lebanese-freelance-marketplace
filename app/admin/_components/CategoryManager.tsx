'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Edit2, Save, X, Loader2, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
    id: number;
    name: string;
    manual_override_price: number | null;
    calculated_median_price: number | null;
};

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryPrice, setNewCategoryPrice] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .insert({
                    name: newCategoryName.trim(),
                    manual_override_price: newCategoryPrice ? parseFloat(newCategoryPrice) : null
                });

            if (error) throw error;

            toast.success('Category added successfully');
            setNewCategoryName('');
            setNewCategoryPrice('');
            setIsAdding(false);
            fetchCategories();
        } catch (error: any) {
            console.error('Error adding category:', error);
            toast.error(error.message || 'Failed to add category');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    name: editName.trim(),
                    manual_override_price: editPrice ? parseFloat(editPrice) : null
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('Category updated successfully');
            setEditingId(null);
            fetchCategories();
        } catch (error: any) {
            console.error('Error updating category:', error);
            toast.error(error.message || 'Failed to update category');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category? This might affect existing services.')) {
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            toast.error(error.message || 'Failed to delete category');
        } finally {
            setActionLoading(false);
        }
    };

    const startEditing = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditPrice(category.manual_override_price?.toString() || '');
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
            <div className="bg-gradient-to-r from-lira-blue-50k to-lira-blue-10k p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Tag className="text-lira-text" size={24} />
                        Category Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage service categories and pricing overrides
                    </p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-lira-text hover:bg-gray-800 text-white"
                    size="sm"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add Category'}
                </Button>
            </div>

            <div className="p-6">
                {isAdding && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">New Category</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <Input
                                    value={newCategoryName}
                                    onChange={(e: any) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Graphic Design"
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Override Median Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={newCategoryPrice}
                                        onChange={(e: any) => setNewCategoryPrice(e.target.value)}
                                        placeholder="Optional"
                                        className="pl-9 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleAdd}
                                disabled={actionLoading || !newCategoryName.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} className="mr-2" />}
                                Create Category
                            </Button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="pb-3 pl-4 font-semibold text-gray-600 text-sm">Name</th>
                                <th className="pb-3 font-semibold text-gray-600 text-sm">Median Price (Calc)</th>
                                <th className="pb-3 font-semibold text-gray-600 text-sm">Manual Price</th>
                                <th className="pb-3 pr-4 text-right font-semibold text-gray-600 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.map((category) => (
                                <tr key={category.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 pl-4">
                                        {editingId === category.id ? (
                                            <Input
                                                value={editName}
                                                onChange={(e: any) => setEditName(e.target.value)}
                                                className="h-9 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-gray-800">{category.name}</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-gray-500 text-sm">
                                        ${category.calculated_median_price?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="py-4">
                                        {editingId === category.id ? (
                                            <div className="relative w-24">
                                                <DollarSign className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                                <Input
                                                    type="number"
                                                    value={editPrice}
                                                    onChange={(e: any) => setEditPrice(e.target.value)}
                                                    className="h-9 pl-6 text-sm"
                                                    placeholder="Auto"
                                                />
                                            </div>
                                        ) : (
                                            <span className={`text-sm ${category.manual_override_price ? 'text-blue-600 font-medium' : 'text-gray-400 italic'}`}>
                                                {category.manual_override_price ? `$${category.manual_override_price.toFixed(2)}` : 'Auto'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 pr-4">
                                        <div className="flex justify-end items-center gap-2">
                                            {editingId === category.id ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingId(null)}
                                                        className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdate(category.id)}
                                                        disabled={actionLoading}
                                                        className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                                                    >
                                                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEditing(category)}
                                                        className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(category.id)}
                                                        className="text-red-400 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                        No categories found. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
