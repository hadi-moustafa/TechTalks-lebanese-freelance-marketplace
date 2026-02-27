'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Check, X, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ServiceImage } from '@/lib/types';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  freelancer_id: string;
  categories?: { name: string };
  service_images?: ServiceImage[];
};

export default function ServiceApproval() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        categories:category_id (name),
        service_images (id, image_url, is_primary)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
      setServices([]);
    } else {
      setServices(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from('services')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Service approved');
      setServices(prev => prev.filter(s => s.id !== id));
    }

    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    setActionLoading(id);
    const { error } = await supabase
      .from('services')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Service rejected');
      setServices(prev => prev.filter(s => s.id !== id));
      setRejectingId(null);
      setRejectionReason('');
    }

    setActionLoading(null);
  };

  const getPrimaryImage = (service: Service) => {
    const primary = service.service_images?.find(img => img.is_primary);
    return primary?.image_url || service.service_images?.[0]?.image_url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
      
      {/* Header */}
      <div className="border-b border-gray-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
            <AlertCircle className="text-yellow-500" size={22} />
            Service Approval
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage pending services
          </p>
        </div>
        <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
          {services.length} Pending
        </span>
      </div>

      {/* Content */}
      <div className="p-6 bg-gray-50 min-h-[400px]">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Check size={48} className="mb-4 text-green-500 bg-green-100 p-2 rounded-full" />
            <p className="text-lg font-medium text-gray-700">All caught up!</p>
            <p className="text-sm">No pending services.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map(service => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="flex gap-4">
                  
                  {/* Image */}
                  {getPrimaryImage(service) && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getPrimaryImage(service)}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
                        {service.categories?.name || 'Uncategorized'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(service.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {service.title}
                    </h3>

                    <span className="text-sm font-semibold text-emerald-600">
                      ${service.price}
                    </span>

                    <button
                      onClick={() =>
                        setExpandedId(expandedId === service.id ? null : service.id)
                      }
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {expandedId === service.id ? (
                        <>Hide details <ChevronUp size={16} /></>
                      ) : (
                        <>View details <ChevronDown size={16} /></>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectingId(service.id)}
                      disabled={actionLoading === service.id}
                    >
                      <X size={16} />
                    </Button>

                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(service.id)}
                      disabled={actionLoading === service.id}
                    >
                      {actionLoading === service.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Check size={16} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === service.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {service.description}
                    </p>

                    {service.service_images &&
                      service.service_images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {service.service_images.map(img => (
                            <img
                              key={img.id}
                              src={img.image_url}
                              alt="Service"
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Rejection Box */}
                {rejectingId === service.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason..."
                      className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-red-100 outline-none min-h-[80px]"
                    />

                    <div className="flex justify-end gap-3 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason('');
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleReject(service.id)}
                        disabled={actionLoading === service.id}
                      >
                        {actionLoading === service.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          'Confirm Rejection'
                        )}
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