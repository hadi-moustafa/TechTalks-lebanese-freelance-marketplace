'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, TrendingUp, User, Eye, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

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
                // Fetch all service views with related service and freelancer info
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

                // Process data to aggregate views per freelancer
                const freelancerMap = new Map<string, {
                    username: string,
                    email: string,
                    profilePic: string | null,
                    views: number,
                    services: Map<string, number> // service title -> view count
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

                // Convert map to array and sort
                const sortedData: AnalyticsData[] = Array.from(freelancerMap.entries())
                    .map(([id, data]) => {
                        // Find top service
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
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' :
                                            index === 1 ? 'bg-gray-200 text-gray-700 ring-4 ring-gray-100' :
                                                index === 2 ? 'bg-orange-100 text-orange-800 ring-4 ring-orange-50' :
                                                    'bg-gray-50 text-gray-500'}
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
                        {analytics.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                    No data available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
