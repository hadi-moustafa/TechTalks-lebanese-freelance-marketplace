'use client';

import { Check, X, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

type ServiceRequest = {
    id: string;
    freelancerName: string;
    serviceTitle: string;
    category: string;
    price: string;
    date: string;
    status: 'pending';
};

const MOCK_REQUESTS: ServiceRequest[] = [
    {
        id: '1',
        freelancerName: 'Hadi Moustafa',
        serviceTitle: 'Full Stack Web Development',
        category: 'Development',
        price: '5,000,000 LBP',
        date: '2 mins ago',
        status: 'pending',
    },
    {
        id: '2',
        freelancerName: 'Nour El Huda',
        serviceTitle: 'Wedding Photography Session',
        category: 'Photography',
        price: '8,500,000 LBP',
        date: '15 mins ago',
        status: 'pending',
    },
    {
        id: '3',
        freelancerName: 'Jad Khoury',
        serviceTitle: 'Logo Design & Branding',
        category: 'Design',
        price: '2,000,000 LBP',
        date: '1 hour ago',
        status: 'pending',
    },
];

export default function ServiceModerationQueue() {
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-lira-green-1k p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-lira-pink-5k flex items-center justify-center text-pink-700">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-lira-text">Moderation Queue</h2>
                        <p className="text-sm text-gray-500">{MOCK_REQUESTS.length} services pending approval</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">View History</Button>
            </div>

            <div className="space-y-4 overflow-auto flex-1 pr-2">
                {MOCK_REQUESTS.map((req) => (
                    <div key={req.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900">{req.serviceTitle}</h3>
                                <p className="text-sm text-gray-500">by <span className="text-blue-600 font-medium">{req.freelancerName}</span> • {req.category}</p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                {req.price}
                            </span>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-gray-400">{req.date}</p>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => setRejectingId(req.id === rejectingId ? null : req.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Reject"
                                >
                                    <X size={18} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>

                        {rejectingId === req.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top-1">
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">Reason for rejection:</label>
                                <textarea
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                                    placeholder="e.g. Inappropriate content, Low quality description..."
                                    rows={2}
                                ></textarea>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)} className='text-xs'>Cancel</Button>
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs">Confirm Reject</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
