'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import FreelancerNavbar from '../_components/FreelancerNavbar';
import { Button } from '@/components/ui/Button';
import { Upload, DollarSign, Tag, Type, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Category = {
    id: number;
    name: string;
};

export default function CreateServicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        price: '',
        description: '',
        image_url: '' // For now just a URL input, later proper upload
    });

    useEffect(() => {
        // Fetch categories
        async function fetchCategories() {
            const { data, error } = await supabase.from('categories').select('*');
            if (!error && data) {
                setCategories(data);
            }
        }
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in');
                return;
            }

            const { error } = await supabase.from('services').insert({
                freelancer_id: user.id,
                title: formData.title,
                category_id: parseInt(formData.category_id),
                price: parseFloat(formData.price),
                description: formData.description,
                status: 'pending' // Default status
            });

            if (error) throw error;

            toast.success('Service created! Pending approval.');
            router.push('/freelancer');
        } catch (error: any) {
            console.error('Error creating service:', error);
            toast.error(error.message || 'Failed to create service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans">
            <FreelancerNavbar />

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-lira-pink-5k to-red-600 p-8 text-white">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Upload className="text-white/80" />
                            Create New Service
                        </h1>
                        <p className="text-white/90 mt-2">
                            Share your talent with the world. Fill in the details below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Type size={16} className="text-lira-green-1k" />
                                Service Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. I will design a modern logo for your business"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag size={16} className="text-lira-green-1k" />
                                    Category
                                </label>
                                <div className="relative">
                                    <select
                                        name="category_id"
                                        required
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-transparent outline-none transition-all appearance-none bg-white font-medium text-gray-700"
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <DollarSign size={16} className="text-lira-green-1k" />
                                    Price ($)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="1"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="50.00"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-transparent outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText size={16} className="text-lira-green-1k" />
                                Description
                            </label>
                            <textarea
                                name="description"
                                required
                                rows={6}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your service in detail..."
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-transparent outline-none transition-all min-h-[150px] font-medium text-gray-700"
                            ></textarea>
                            <p className="text-xs text-gray-400 text-right mt-1">
                                {formData.description.length} characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-lira-green-1k hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {loading ? 'Publishing...' : 'Publish Service'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
