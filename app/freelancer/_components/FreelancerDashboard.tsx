'use client';

import { useEffect, useState } from 'react';
import {
    Eye,
    Briefcase,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Bell,
    AlertCircle,
    Clock,
    DollarSign
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const earningsData = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 250 },
    { name: 'Wed', value: 180 },
    { name: 'Thu', value: 450 },
    { name: 'Fri', value: 320 },
    { name: 'Sat', value: 580 },
    { name: 'Sun', value: 600 },
];

const serviceStatusData = [
    { name: 'Active', value: 4, color: '#16a34a' },
    { name: 'Pending', value: 2, color: '#f59e0b' },
    { name: 'Paused', value: 1, color: '#9ca3af' },
    { name: 'Rejected', value: 0, color: '#dc2626' },
];

export default function FreelancerDashboard() {
    const [stats, setStats] = useState({
        profileViews: 1245,
        activeGigs: 0,
        totalEarnings: 850.5,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return setLoading(false);

            const { count } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('freelancer_id', user.id)
                .eq('status', 'approved');

            setStats(prev => ({
                ...prev,
                activeGigs: count || 0,
            }));

            setLoading(false);
        }

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-6">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8 pb-10">

            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Welcome back
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                    Here’s a summary of your current activity.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: 'Profile Views',
                        value: stats.profileViews,
                        icon: Eye
                    },
                    {
                        title: 'Active Gigs',
                        value: stats.activeGigs,
                        icon: Briefcase
                    },
                    {
                        title: 'Total Earnings',
                        value: `$${stats.totalEarnings}`,
                        icon: TrendingUp
                    }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon size={20} className="text-gray-600" />
                                <h3 className="text-sm text-gray-500">{stat.title}</h3>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900">
                                {stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">
                        Weekly Earnings
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={earningsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#16a34a"
                                    fill="#bbf7d0"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">
                        Service Status
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceStatusData}
                                    innerRadius={50}
                                    outerRadius={70}
                                    dataKey="value"
                                >
                                    {serviceStatusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}