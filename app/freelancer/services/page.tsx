'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import { Button } from '@/components/ui/Button';
import {
    Plus,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Service = {
    id: string;
    title: string;
    description: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    categories?: {
        name: string;
    };
    service_images?: {
        image_url: string;
        is_primary: boolean;
    }[];
};

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        fetchServices();
    }, []);

    const filteredServices =
        filter === 'all'
            ? services
            : services.filter(s => s.status === filter);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select(`
                    *,
                    categories:category_id (name),
                    service_images (image_url, is_primary)
                `)
                .eq('freelancer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const base =
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium';

        switch (status) {
            case 'approved':
                return (
                    <span className={`${base} bg-green-50 text-green-700`}>
                        <CheckCircle size={13} />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className={`${base} bg-red-50 text-red-700`}>
                        <XCircle size={13} />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className={`${base} bg-amber-50 text-amber-700`}>
                        <Clock size={13} />
                        Pending
                    </span>
                );
        }
    };

    const getPrimaryImage = (service: Service) => {
        const primaryImage = service.service_images?.find(img => img.is_primary);
        return primaryImage?.image_url || service.service_images?.[0]?.image_url;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        My Services
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage and update your listed services.
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/freelancer/services/create')}
                    className="bg-gray-900 text-white hover:bg-black flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Service
                </Button>
            </div>

            {/* Empty State */}
            {services.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <Briefcase size={40} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No services yet
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Create your first service to start receiving requests.
                    </p>
                    <Button
                        onClick={() => router.push('/freelancer/services/create')}
                        className="bg-gray-900 text-white hover:bg-black"
                    >
                        <Plus size={16} className="mr-2" />
                        Create Service
                    </Button>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No {filter} services
                    </h3>
                    <button
                        onClick={() => setFilter('all')}
                        className="text-sm text-gray-700 underline"
                    >
                        Show all services
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-xl">
                                {getPrimaryImage(service) ? (
                                    <img
                                        src={getPrimaryImage(service)}
                                        alt={service.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Briefcase size={40} className="text-gray-300" />
                                    </div>
                                )}

                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(service.status)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                    {service.categories?.name || 'Uncategorized'}
                                </p>

                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {service.title}
                                </h3>

                                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-lg font-semibold text-gray-900">
                                        ${service.price}
                                    </span>

                                    <button
                                        onClick={() =>
                                            router.push(`/freelancer/services/${service.id}`)
                                        }
                                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}