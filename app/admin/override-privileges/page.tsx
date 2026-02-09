'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import {
    Check,
    X,
    ArrowLeft,
    AlertTriangle,
    Loader2,
    HandCoins,
    Search,
    Filter,
    Clock,
    DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import PriceOverrideService, { PriceOverrideRequest } from '@/services/priceOverrideService';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

export default function AdminOverridePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PriceOverrideRequest[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        request: PriceOverrideRequest | null;
        notes: string;
    }>({
        isOpen: false,
        type: 'approve',
        request: null,
        notes: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Check auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Verify admin role (simplified check, ideally should use meaningful role check)
            // For now assuming if they can access this page via layout/middleware they are admin
            // or we could check a profile table here.

            const result = await PriceOverrideService.getAllRequests();
            if (result.success && result.data) {
                setRequests(result.data as PriceOverrideRequest[]);
            } else {
                toast.error('Failed to fetch requests');
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (request: PriceOverrideRequest, type: 'approve' | 'reject') => {
        setActionModal({
            isOpen: true,
            type,
            request,
            notes: ''
        });
    };

    const submitAction = async () => {
        if (!actionModal.request) return;

        setProcessingId(actionModal.request.id);

        try {
            let result;
            if (actionModal.type === 'approve') {
                result = await PriceOverrideService.approveRequest(actionModal.request.id, actionModal.notes);
            } else {
                result = await PriceOverrideService.rejectRequest(actionModal.request.id, actionModal.notes);
            }

            if (result.success) {
                toast.success(`Request ${actionModal.type}ed successfully`);
                // Update local state
                setRequests(prev => prev.map(req =>
                    req.id === actionModal.request?.id
                        ? { ...req, status: actionModal.type === 'approve' ? 'approved' : 'rejected', admin_notes: actionModal.notes, resolved_at: new Date().toISOString() }
                        : req
                ));
                setActionModal({ ...actionModal, isOpen: false });
            } else {
                toast.error(`Failed to ${actionModal.type} request: ${result.error}`);
            }
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filterStatus === 'all') return true;
        return req.status === filterStatus;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin text-lira-green-1k" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <HandCoins className="text-lira-green-1k" />
                            Override & Privileges
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage price override requests from freelancers.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <Filter size={18} />
                        Filter Status:
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filterStatus === status
                                    ? 'bg-lira-green-1k text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                    {filteredRequests.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400" size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                            <p className="text-gray-500">There are no requests matching your filter.</p>
                        </div>
                    ) : (
                        filteredRequests.map(request => (
                            <div
                                key={request.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {formatRelativeTime(request.created_at)}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {request.service?.title || 'Unknown Service'}
                                            </h3>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                                <span>by <span className="font-medium text-gray-900">{request.freelancer?.username || 'Unknown Freelancer'}</span></span>
                                                <span>•</span>
                                                <span>{request.freelancer?.email}</span>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase font-semibold">Price Change</span>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-gray-500 line-through text-sm">
                                                            ${request.original_price}
                                                        </span>
                                                        <ArrowLeft className="rotate-180 text-gray-400" size={16} />
                                                        <span className="text-lira-green-1k font-bold text-xl">
                                                            ${request.requested_price}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase font-semibold">Reason</span>
                                                    <p className="text-gray-700 mt-1 text-sm">
                                                        {request.reason}
                                                    </p>
                                                </div>
                                            </div>

                                            {request.admin_notes && (
                                                <div className="mt-4 text-sm bg-gray-50 p-3 rounded border border-gray-100">
                                                    <p className="text-gray-900 font-medium">Admin Notes:</p>
                                                    <p className="text-gray-600">{request.admin_notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {request.status === 'pending' && (
                                            <div className="flex flex-col gap-3 justify-center min-w-[150px]">
                                                <Button
                                                    onClick={() => handleAction(request, 'approve')}
                                                    className="bg-lira-green-1k hover:bg-emerald-700 w-full"
                                                >
                                                    <Check size={18} className="mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleAction(request, 'reject')}
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full"
                                                >
                                                    <X size={18} className="mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {actionModal.type === 'approve' ? <Check size={32} /> : <X size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                                {actionModal.type} Request
                            </h3>
                            <p className="text-gray-600 mt-2">
                                {actionModal.type === 'approve'
                                    ? `This will update the service price to $${actionModal.request?.requested_price}.`
                                    : 'This will reject the freelancer\'s request.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={actionModal.notes}
                                    onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none resize-none"
                                    placeholder="Add a note for the freelancer..."
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                    className="flex-1"
                                    disabled={!!processingId}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={submitAction}
                                    className={`flex-1 ${actionModal.type === 'approve'
                                        ? 'bg-lira-green-1k hover:bg-emerald-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        } text-white`}
                                    disabled={!!processingId}
                                >
                                    {processingId ? <Loader2 className="animate-spin" size={18} /> : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
