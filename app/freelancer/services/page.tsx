'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import FreelancerNavbar from '../_components/FreelancerNavbar';
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
            <div className="min-h-screen bg-lebanese-pattern font-sans">
                <FreelancerNavbar />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lira-green-1k"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans">
            <FreelancerNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
                        <p className="text-gray-600 mt-1">Manage your gigs and services</p>
                    </div>
                    <Button
                        onClick={() => router.push('/freelancer/services/create')}
                        className="bg-lira-green-1k text-lime-500 border-emerald-300 border hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <Plus size={20} className='text-lime-500'/>
                        Create New Service
                    </Button>
                </div>

                {/* Stats Cards - Clickable Filters */}
                {services.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <button
                            onClick={() => setFilter('all')}
                            className={`rounded-xl border p-4 text-left transition-all ${
                                filter === 'all' 
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
                            className={`rounded-xl border p-4 text-left transition-all ${
                                filter === 'pending' 
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
                            className={`rounded-xl border p-4 text-left transition-all ${
                                filter === 'approved' 
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
                            className={`rounded-xl border p-4 text-left transition-all ${
                                filter === 'rejected' 
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
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gray-100">
                                    {getPrimaryImage(service) ? (
                                        <img
                                            src={getPrimaryImage(service)}
                                            alt={service.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Briefcase size={48} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        {getStatusBadge(service.status)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                                        {service.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3">
                                        {service.categories?.name || 'Uncategorized'}
                                    </p>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-lira-green-1k">
                                            ${service.price}
                                        </span>
                                        <div className="flex gap-2">
                                            {service.status === 'rejected' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/freelancer/services/edit/${service.id}`)}
                                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                >
                                                    <RefreshCw size={16} className="mr-1" />
                                                    Edit
                                                </Button>
                                            )}
                                            <button
                                                onClick={() => router.push(`/freelancer/services/${service.id}`)}
                                                className="flex items-center px-3 py-1.5 text-sm text-emerald-600 border border-emerald-300 rounded-md font-medium hover:bg-emerald-50 transition-colors"
                                            >
                                                <Eye size={16} className="mr-1" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
