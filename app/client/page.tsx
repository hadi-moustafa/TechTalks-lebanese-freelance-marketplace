'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import ServiceCard from '@/components/services/ServiceCard';
import { Loader2, Package, Search, Filter, MessageCircle } from 'lucide-react';
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

    // Check if user is logged in and is a client
    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Verify user is a client
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
            .eq('status', 'approved') // Only show approved services to clients
            .order('created_at', { ascending: false });

        if (selectedCategory !== 'all') {
            query = query.eq('category_id', selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading services:', error);
        } else {
            console.log('✅ Services loaded:', data);
            setServices(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchCategories();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchServices();
        }
    }, [user, selectedCategory]);

    // Real-time updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('client-services')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
                console.log('🔄 Service updated in real-time');
                fetchServices();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_images' }, () => {
                console.log('🔄 Service image updated in real-time');
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, selectedCategory]);

    // Filter services by search query
    const filteredServices = services.filter(service => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        return (
            service.title.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query) ||
            service.categories?.name.toLowerCase().includes(query)
        );
    });

    const handleContactFreelancer = async (serviceId: string, freelancerId: string) => {
        if (!user) return;

        try {
            // Check if room exists
            const { data: existingRoom, error: fetchError } = await supabase
                .from('chat_rooms')
                .select('id')
                .eq('client_id', user.id)
                .eq('freelancer_id', freelancerId)
                .eq('service_id', serviceId)
                .single();

            if (existingRoom) {
                // Room exists, redirect to chat (eventually we can pass ?room=existingRoom.id)
                router.push('/client/chat');
                return;
            }

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error checking existing chat room:', fetchError);
            }

            // Create new room
            const { data: newRoom, error: createError } = await supabase
                .from('chat_rooms')
                .insert({
                    client_id: user.id,
                    freelancer_id: freelancerId,
                    service_id: serviceId
                })
                .select()
                .single();

            if (createError) throw createError;

            // Redirect to chat
            router.push('/client/chat');

        } catch (error) {
            console.error('Error creating chat room:', error);
            // Optionally add toast notification here
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            {/* Decorative overlay */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Client Portal
                        </h1>
                        <p className="text-gray-700 mt-1 font-medium">Explore services and manage projects</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/client/chat')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-gray-900 font-semibold rounded-full border border-gray-300 shadow-sm transition-all"
                        >
                            <MessageCircle size={20} className="text-blue-600" />
                            <span className="hidden sm:inline">Messages</span>
                        </button>
                        <ClientProfileMenu />
                    </div>
                </header>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search services by title, description, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-400 rounded-xl bg-white/90 backdrop-blur-sm text-gray-900 placeholder:text-gray-600 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={20} />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-900">Filter by Category</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm border border-transparent ${selectedCategory === 'all'
                                ? 'bg-blue-600 text-white border-blue-700'
                                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            All Services ({services.length})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm border border-transparent ${selectedCategory === cat.id
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
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
                        <div className="mb-4 text-gray-900 font-bold bg-white/80 backdrop-blur-sm inline-block px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    showStatus={false}
                                    onContact={handleContactFreelancer}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}