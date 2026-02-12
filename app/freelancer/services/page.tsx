'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import { Button } from '@/components/ui/Button';
import { Plus, Eye, Edit, CheckCircle, Clock, XCircle, Briefcase, RefreshCw } from 'lucide-react';
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

    const filteredServices = filter === 'all'
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
            console.error('Error fetching services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={14} />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={14} />
                        Rejected
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock size={14} />
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lira-green-1k"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
                    <p className="text-gray-600 mt-1">Manage your gigs and services</p>
                </div>
                <button
                    onClick={() => router.push('/freelancer/services/create')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-lira-green-1k text-white font-bold rounded-lg border-2 border-emerald-800 shadow-md hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={20} />
                    Create New Service
                </button>
            </div>

            {/* Stats Cards - Clickable Filters */}
            {services.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-xl border p-4 text-left transition-all ${filter === 'all'
                            ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Briefcase size={20} className="text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`rounded-xl border p-4 text-left transition-all ${filter === 'pending'
                            ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                            : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-700">
                                    {services.filter(s => s.status === 'pending').length}
                                </p>
                                <p className="text-xs text-amber-600">Pending</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`rounded-xl border p-4 text-left transition-all ${filter === 'approved'
                            ? 'bg-green-100 border-green-400 ring-2 ring-green-400'
                            : 'bg-green-50 border-green-200 hover:border-green-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    {services.filter(s => s.status === 'approved').length}
                                </p>
                                <p className="text-xs text-green-600">Approved</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`rounded-xl border p-4 text-left transition-all ${filter === 'rejected'
                            ? 'bg-red-100 border-red-400 ring-2 ring-red-400'
                            : 'bg-red-50 border-red-200 hover:border-red-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-700">
                                    {services.filter(s => s.status === 'rejected').length}
                                </p>
                                <p className="text-xs text-red-600">Rejected</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Services Grid */}
            {services.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
                    <p className="text-gray-600 mb-6">Start by creating your first service to offer to clients</p>
                    <Button
                        onClick={() => router.push('/freelancer/services/create')}
                        className="bg-lira-green-1k hover:bg-emerald-700"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Your First Service
                    </Button>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No {filter} services</h3>
                    <p className="text-gray-600 mb-4">No services match the selected filter</p>
                    <button
                        onClick={() => setFilter('all')}
                        className="text-lira-green-1k hover:underline font-medium"
                    >
                        Show all services
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Image */}
                            <div className="relative h-56 bg-gray-100 overflow-hidden">
                                {getPrimaryImage(service) ? (
                                    <img
                                        src={getPrimaryImage(service)}
                                        alt={service.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <Briefcase size={48} className="text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(service.status)}
                                </div>

                                {/* View Counter Badge - Only visible on hover/group-hover or always if preferred */}
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                                    <Eye size={14} className="text-lebanon-green" />
                                    <span className="text-xs font-bold text-gray-800">124 Views</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold text-lebanon-green uppercase tracking-wide">
                                        {service.categories?.name || 'Uncategorized'}
                                    </p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <svg key={i} className={`w-3 h-3 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-lebanon-red transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xl font-black text-gray-900">
                                        ${service.price}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/freelancer/services/${service.id}`)}
                                            className="flex items-center px-4 py-2 text-sm text-white bg-gray-900 rounded-xl font-bold hover:bg-lebanon-red transition-colors shadow-sm"
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
