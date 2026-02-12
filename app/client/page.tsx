'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import ServiceCard from '@/components/services/ServiceCard';
import { Loader2, Package, Search, Filter } from 'lucide-react';
import ClientProfileMenu from './_components/ClientProfileMenu';
import { Service } from '@/lib/types';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
    id: number;
    name: string;
};

export default function ClientPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userData?.role !== 'client') {
                router.push('/login');
                return;
            }

            setUser(user);
        }

        checkUser();
    }, [router]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        setCategories(data || []);
    };

    const fetchFavorites = async (userId: string) => {
        const { data } = await supabase
            .from('favorites')
            .select('service_id')
            .eq('user_id', userId);

        if (data) {
            setFavoriteIds(new Set(data.map((f: { service_id: string }) => f.service_id)));
        }
    };

    const toggleFavorite = async (serviceId: string) => {
        if (!user) return;

        const isFav = favoriteIds.has(serviceId);

        if (isFav) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('service_id', serviceId);

            if (error) {
                toast.error('Failed to remove favorite');
                return;
            }

            setFavoriteIds((prev) => {
                const next = new Set(prev);
                next.delete(serviceId);
                return next;
            });
            toast.success('Removed from favorites');
        } else {
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: user.id, service_id: serviceId });

            if (error) {
                toast.error('Failed to add favorite');
                return;
            }

            setFavoriteIds((prev) => new Set(prev).add(serviceId));
            toast.success('Added to favorites');
        }
    };

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
            console.error('Error loading services:', error);
        } else {
            setServices(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchCategories();
            fetchFavorites(user.id);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchServices();
        }
    }, [user, selectedCategory]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('client-services')
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
    }, [user, selectedCategory]);

    const filteredServices = services.filter(service => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        return (
            service.title.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query) ||
            service.categories?.name.toLowerCase().includes(query)
        );
    });

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <ClientNavbar />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search services by title, description, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-lira-green-1k" />
                        <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${selectedCategory === 'all'
                                    ? 'bg-lira-green-1k text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Services ({services.length})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${selectedCategory === cat.id
                                        ? 'bg-lira-green-1k text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k">
                        <Loader2 className="animate-spin text-lira-green-1k mb-4" size={48} />
                        <p className="text-gray-600">Loading services...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k">
                        <Package size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No services match your search' : 'No services available'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery ? 'Try a different search term' : 'Check back later for new services'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-gray-700 font-medium">
                            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    showStatus={false}
                                    isFavorited={favoriteIds.has(service.id)}
                                    onToggleFavorite={() => toggleFavorite(service.id)}
                                    showComments={true}
                                    userId={user?.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
