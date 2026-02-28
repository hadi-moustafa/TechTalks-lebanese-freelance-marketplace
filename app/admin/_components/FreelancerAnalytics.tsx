'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, TrendingUp, Eye, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AnalyticsData = {
    freelancerId: string;
    username: string;
    email: string;
    profilePic: string | null;
    totalViews: number;
    topService: string;
};

export default function FreelancerAnalytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('service_views')
                    .select(`
                        service_id,
                        services (
                            id,
                            title,
                            freelancer_id,
                            users (
                                id,
                                username,
                                email,
                                profile_pic
                            )
                        )
                    `);

                if (error) throw error;

                const freelancerMap = new Map<string, {
                    username: string,
                    email: string,
                    profilePic: string | null,
                    views: number,
                    services: Map<string, number>
                }>();

                data?.forEach((view: any) => {
                    const service = view.services;
                    if (!service || !service.users) return;

                    const freelancer = service.users;
                    const fid = freelancer.id;

                    if (!freelancerMap.has(fid)) {
                        freelancerMap.set(fid, {
                            username: freelancer.username || 'Unknown',
                            email: freelancer.email,
                            profilePic: freelancer.profile_pic,
                            views: 0,
                            services: new Map()
                        });
                    }

                    const entry = freelancerMap.get(fid)!;
                    entry.views++;
                    const currentServiceViews = entry.services.get(service.title) || 0;
                    entry.services.set(service.title, currentServiceViews + 1);
                });

                const sortedData: AnalyticsData[] = Array.from(freelancerMap.entries())
                    .map(([id, data]) => {
                        let topService = 'N/A';
                        let maxViews = -1;
                        data.services.forEach((views, title) => {
                            if (views > maxViews) {
                                maxViews = views;
                                topService = title;
                            }
                        });

                        return {
                            freelancerId: id,
                            username: data.username,
                            email: data.email,
                            profilePic: data.profilePic,
                            totalViews: data.views,
                            topService
                        };
                    })
                    .sort((a, b) => b.totalViews - a.totalViews);

                setAnalytics(sortedData);

            } catch (error) {
                console.error('Error fetching analytics:', error);
                toast.error('Failed to fetch freelancer analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getMedalClass = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50';
            case 1: return 'bg-gray-200 text-gray-700 ring-4 ring-gray-100';
            case 2: return 'bg-orange-100 text-orange-800 ring-4 ring-orange-50';
            default: return 'bg-gray-50 text-gray-500';
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-purple-200" size={24} />
                        Freelancer Popularity
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                        Ranked by total service views
                    </p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {analytics.length} Active Freelancers
                </div>
            </div>

            <div className="overflow-auto flex-1 p-0">
                {analytics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <TrendingUp size={48} className="mb-4 text-purple-400 bg-purple-100 p-2 rounded-full" />
                        <p className="text-lg font-medium">No analytics yet</p>
                        <p className="text-sm">No freelancer activity to display.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50/50 sticky top-0 z-10">
                            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Freelancer</th>
                                <th className="px-6 py-4">Most Popular Service</th>
                                <th className="px-6 py-4 text-right">Total Views</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {analytics.map((freelancer, index) => (
                                <tr
                                    key={freelancer.freelancerId}
                                    className="group hover:bg-purple-50/30 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`
                                            flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                            ${getMedalClass(index)}
                                        `}>
                                            {index < 3 ? <Medal size={16} /> : index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-gray-100">
                                                <AvatarImage src={freelancer.profilePic || ''} />
                                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                                    {freelancer.username.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-gray-900">{freelancer.username}</div>
                                                <div className="text-xs text-gray-500">{freelancer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {freelancer.topService}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 font-bold text-gray-700">
                                            <Eye size={16} className="text-gray-400" />
                                            {freelancer.totalViews.toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}