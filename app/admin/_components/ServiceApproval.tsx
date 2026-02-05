'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Service = {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    created_at: string;
    freelancer_id: string;
    users?: {
        username: string;
        email: string;
    };
    categories?: {
        name: string;
    };
};

export default function ServiceApproval() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select(`
                *,
                users:freelancer_id (username, email),
                categories:category_id (name)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching services:', error);
            toast.error('Failed to load services');
        } else {
            console.log('Fetched services:', data);
            setServices(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleApprove = async (id: string) => {
        const { error } = await supabase
            .from('services')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) {
            toast.error('Failed to approve service');
            console.error(error);
        } else {
            toast.success('Service approved');
            setServices(services.filter(s => s.id !== id));
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a rejection reason');
            return;
        }

        const { error } = await supabase
            .from('services')
            .update({
                status: 'rejected',
                rejection_reason: rejectionReason
            })
            .eq('id', id);

        if (error) {
            toast.error('Failed to reject service');
            console.error(error);
        } else {
            toast.success('Service rejected');
            setServices(services.filter(s => s.id !== id));
            setRejectingId(null);
            setRejectionReason('');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-lira-text" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-lira-text to-gray-800 p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <AlertCircle className="text-yellow-400" />
                        Service Approval
                    </h2>
                    <p className="text-gray-300 text-sm mt-1">
                        Review and manage pending service requests
                    </p>
                </div>
                <div className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                    {services.length} Pending
                </div>
            </div>

            <div className="p-6 bg-gray-50/50 min-h-[400px]">
                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Check size={48} className="mb-4 text-green-500 bg-green-100 p-2 rounded-full" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-sm">No pending services to review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                                                {service.categories?.name || 'Uncategorized'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(service.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <span className="font-medium text-gray-900">
                                                {service.users?.username || 'Unknown User'}
                                            </span>
                                            <span>•</span>
                                            <span className="font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                ${service.price}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {rejectingId !== service.id && (
                                            <>
                                                <button
                                                    onClick={() => setRejectingId(service.id)}
                                                    className="p-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                                    title="Reject"
                                                >
                                                    <X size={24} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(service.id)}
                                                    className="p-3 text-green-500 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check size={24} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {rejectingId === service.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 bg-red-50/50 -mb-2 -mx-2 p-4 rounded-b-lg animate-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-red-800 mb-2 block">
                                            Reason for rejection:
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full text-sm font-medium text-gray-900 border border-red-200 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none bg-white min-h-[80px]"
                                            placeholder="Please provide a reason for the freelancer..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-3 mt-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setRejectingId(null);
                                                    setRejectionReason('');
                                                }}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleReject(service.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                                            >
                                                Confirm Rejection
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
