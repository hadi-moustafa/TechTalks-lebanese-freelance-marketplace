'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import ServiceCard from '@/components/services/ServiceCard';
import { Loader2, Heart } from 'lucide-react';
import ClientNavbar from '../_components/ClientNavbar';
import toast from 'react-hot-toast';

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

export default function FavoritesPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [favorites, setFavorites] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

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

    const fetchFavorites = async (userId: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from('favorites')
            .select(`
                service_id,
                services:service_id (
                    *,
                    categories:category_id (id, name),
                    service_images (*)
                )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('Error loading favorites:', error);
            setFavorites([]);
        } else {
            const services = (data || [])
                .map((f: any) => f.services)
                .filter((s: any) => s && s.status === 'approved');
            setFavorites(services);
        }

        setLoading(false);
    };

    const removeFavorite = async (serviceId: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('service_id', serviceId);

        if (error) {
            toast.error('Failed to remove favorite');
            return;
        }

        setFavorites((prev) => prev.filter((s) => s.id !== serviceId));
        toast.success('Removed from favorites');
    };

    useEffect(() => {
        if (user) {
            fetchFavorites(user.id);
        }
    }, [user]);

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
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-lira-text tracking-tight">
                        My Favorites
                    </h1>
                    <p className="text-gray-500 mt-1">Services you&apos;ve saved for later</p>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k">
                        <Loader2 className="animate-spin text-lira-green-1k mb-4" size={48} />
                        <p className="text-gray-600">Loading favorites...</p>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-lira-green-1k">
                        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No favorites yet
                        </h3>
                        <p className="text-gray-500">
                            Browse services and click the heart icon to save your favorites
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-gray-700 font-medium">
                            {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favorites.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    showStatus={false}
                                    isFavorited={true}
                                    onToggleFavorite={() => removeFavorite(service.id)}
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
