//hon where services will be displayed

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ServiceCard from '@/components/services/ServiceCard';
import { Loader2, Package, Filter } from 'lucide-react';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ServiceImage = {
    id: number;
    service_id: string;
    image_url: string;
    is_primary: boolean;
    uploaded_at: string;
};

type Service = {
    id: string;
    freelancer_id: string;
    category_id: number;
    title: string;
    description: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at: string;
    categories?: {
        id: number;
        name: string;
    };
    service_images?: ServiceImage[];
};

type Category = {
    id: number;
    name: string;
};

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch categories
    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        setCategories(data || []);
    };

    // Fetch services
    const fetchServices = async () => {
        setLoading(true);
        
        let query = supabase
            .from('services')
            .select(`
                *,
                categories:category_id (id, name),
                service_images (*)
            `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (selectedCategory !== 'all') {
            query = query.eq('category_id', selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Services loaded:', data);
            setServices(data || []);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        getUser();
    }, []);

    useEffect(() => {
        fetchServices();
    }, [selectedCategory]);

    // Real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('services-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
                fetchServices();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_images' }, () => {
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedCategory]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-600">Loading services...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Services Catalog</h1>
                <p className="text-gray-600 text-lg">Browse professional services</p>
            </div>

            {/* Category Filters */}
            <div className="mb-8 bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Filter size={20} />
                    <h2 className="text-lg font-semibold">Filter by Category</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2.5 rounded-lg font-medium ${
                            selectedCategory === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All Services
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-5 py-2.5 rounded-lg font-medium ${
                                selectedCategory === cat.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Services Grid */}
            {services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <Package size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No services found</h3>
                    <p className="text-gray-500">Check back later</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            showComments={true}
                            userId={userId ?? undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}