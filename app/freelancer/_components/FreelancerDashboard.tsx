'use client';

import { useEffect, useState } from 'react';
import {
    Eye,
    Briefcase,
    TrendingUp,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    Bell,
    CheckCircle2,
    AlertCircle,
    Clock,
    DollarSign,
    UserLock
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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



// Mock Data for Charts
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
    { name: 'Active', value: 4, color: '#00A650' },   // Lebanon Green
    { name: 'Pending', value: 2, color: '#FBBF24' },  // Amber
    { name: 'Paused', value: 1, color: '#9CA3AF' },   // Gray
    { name: 'Rejected', value: 0, color: '#EE161F' }, // Lebanon Red
];

const notificationsMock = [
    { id: 1, title: 'New Order!', message: 'Client "John Doe" ordered "Full Stack Dev"', type: 'order', time: '2 mins ago' },
    { id: 2, title: 'System Update', message: 'We improved the analytics engine.', type: 'system', time: '1 hour ago' },
    { id: 3, title: 'Tip Received', message: 'You received a $20 tip!', type: 'money', time: '3 hours ago' },
];

export default function FreelancerDashboard() {
    const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro'>('free');
    const [stats, setStats] = useState({
        profileViews: 1245, // Mocked
        activeGigs: 0,
        totalEarnings: 850.50, // Mocked
        bestService: 'Loading...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Get freelancer tier
            const { data: freelancer, error } = await supabase
                .from('users')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Tier fetch error:', error);
                setSubscriptionTier('free');
            } else {
                setSubscriptionTier(
                    freelancer?.subscription_tier === 'pro' ? 'pro' : 'free'
                );
            }

            // 1. Get Active Gigs count
            const { count: gigCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('freelancer_id', user.id)
                .eq('status', 'approved');

            // Simulating real data fetch for demo purposes
            await new Promise(resolve => setTimeout(resolve, 800));

            setStats(prev => ({
                ...prev,
                activeGigs: gigCount || 4, // Fallback to mock if 0 for demo
                bestService: 'Full Stack Dev'
            }));
            setLoading(false);
        }
        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Profile Views',
            value: stats.profileViews,
            change: '+12%',
            isPositive: true,
            icon: Eye,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Active Gigs',
            value: stats.activeGigs,
            change: '0',
            isPositive: true,
            icon: Briefcase,
            color: 'text-lebanon-green',
            bg: 'bg-green-50'
        },
        {
            title: 'Total Earnings',
            value: `$${stats.totalEarnings}`,
            change: '+8.5%',
            isPositive: true,
            icon: TrendingUp,
            color: 'text-lebanon-red',
            bg: 'bg-red-50'
        }
    ];


    function LockedValue({
        value,
        locked
    }: {
        value: string | number;
        locked: boolean;
    }) {
        if (!locked) {
            return <span>{value}</span>;
        }

        return (
            <div className="relative group inline-block">
                {/* blurred value */}
                <span className="blur-sm select-none">{value}</span>

                {/* lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full shadow text-gray-700">
                        <UserLock />
                    </span>
                </div>

                {/* tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 
                opacity-0 group-hover:opacity-100 
                pointer-events-none 
                transition
                bg-gray-900 text-white text-xs px-3 py-2 rounded-lg 
                whitespace-nowrap shadow-lg">
                    Upgrade to see who viewed your profile
                </div>
            </div>
        );
    }



    if (loading) {
        return (
            <div className="animate-pulse space-y-8 p-4">
                <div className="h-48 bg-gray-100 rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-gray-100 rounded-2xl"></div>
                    <div className="h-32 bg-gray-100 rounded-2xl"></div>
                    <div className="h-32 bg-gray-100 rounded-2xl"></div>
                </div>
                <div className="h-96 bg-gray-100 rounded-3xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-lebanon-green to-emerald-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-lebanon-red/20 rounded-full blur-2xl -ml-8 -mb-8"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Ahla wa Sahla, Partner! 🇱🇧</h2>
                    <p className="text-emerald-50 max-w-xl text-lg">
                        Your empire is growing. Check out your latest stats and keep pushing the boundaries!
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {stat.isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                            <div className="text-3xl font-bold text-gray-900 mt-1">
                                {stat.title === 'Profile Views' ? (
                                    <LockedValue
                                        value={stat.value}
                                        locked={subscriptionTier === 'free'}
                                    />
                                ) : (
                                    stat.value
                                )}
                            </div>


                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid: Charts & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Earnings Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <DollarSign className="text-lebanon-green" size={20} />
                            Weekly Earnings
                        </h3>
                        <select className="bg-gray-50 border-none text-sm text-gray-500 rounded-lg p-2 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors">
                            <option>This Week</option>
                            <option>Last Month</option>
                            <option>YTD</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={earningsData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00A650" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#00A650" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value}`, 'Earnings']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#00A650"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Notifications & Service Health */}
                <div className="space-y-8">
                    {/* Service Health Pie Chart */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">Service Health</h3>
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={serviceStatusData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {serviceStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-gray-800">{stats.activeGigs}</span>
                                    <span className="text-xs text-gray-500 uppercase">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Center */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Bell className="text-lebanon-red" size={20} />
                                Updates
                            </h3>
                            <button className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {notificationsMock.map((notif) => (
                                <div key={notif.id} className="flex gap-3 items-start border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                    <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center ${notif.type === 'order' ? 'bg-green-50 text-lebanon-green' :
                                        notif.type === 'money' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {notif.type === 'order' ? <Briefcase size={14} /> :
                                            notif.type === 'money' ? <DollarSign size={14} /> : <AlertCircle size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{notif.message}</p>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                            <Clock size={10} />
                                            {notif.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
