'use client';

import { useEffect, useState } from 'react';
import { Eye, Briefcase, TrendingUp, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FreelancerDashboard() {
    const [stats, setStats] = useState({
        profileViews: 0,
        activeGigs: 0,
        totalEarnings: 0,
        bestService: 'Loading...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Active Gigs count
            const { count: gigCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('freelancer_id', user.id)
                .eq('status', 'approved');

            // 2. Mock Stats for now (schema for generic views/earnings might need explicit table)
            // In a real scenario, we'd query 'service_views' and 'orders' tables.

            // Simulating data fetch delay
            await new Promise(resolve => setTimeout(resolve, 800));

            setStats({
                profileViews: 1245, // Mocked
                activeGigs: gigCount || 0,
                totalEarnings: 850.50, // Mocked
                bestService: 'Full Stack Dev' // Mocked
            });
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
            color: 'text-lira-blue-50k',
            bg: 'bg-blue-50'
        },
        {
            title: 'Active Gigs',
            value: stats.activeGigs,
            change: '0',
            isPositive: true,
            icon: Briefcase,
            color: 'text-lira-green-1k',
            bg: 'bg-green-50'
        },
        {
            title: 'Total Earnings',
            value: `$${stats.totalEarnings}`,
            change: '+8.5%',
            isPositive: true,
            icon: TrendingUp,
            color: 'text-lira-text',
            bg: 'bg-amber-50'
        }
    ];

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-100 rounded-2xl"></div>
            <div className="h-64 bg-gray-100 rounded-2xl"></div>
        </div>
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-lira-green-1k to-emerald-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <h2 className="text-3xl font-bold mb-2 relative z-10">Ahla wa Sahla, Partner! 🇱🇧</h2>
                <p className="text-emerald-100 relative z-10 max-w-xl">
                    Here's what's happening with your empire today. Keep pushing the boundaries of creativity.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Best Service & Recent Activity Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Best Performing Service */}
                <div className="bg-white rounded-3xl p-6 border border-lira-green-1k border-opacity-30 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400" />
                            Star Service
                        </h3>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Most Viewed</div>
                            <h4 className="text-2xl font-bold mb-4">{stats.bestService}</h4>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400">Views</span>
                                    <span className="font-bold text-lg">842</span>
                                </div>
                                <div className="w-px h-8 bg-gray-700"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400">Orders</span>
                                    <span className="font-bold text-lg">12</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Cedars */}
                        <div className="absolute -bottom-4 -right-4 opacity-10">
                            <img src="/cedar-icon.svg" className="w-32 h-32" alt="" />
                        </div>
                    </div>
                </div>

                {/* Level / Status */}
                <div className="bg-lira-pink-5k bg-opacity-10 rounded-3xl p-6 border border-lira-pink-5k border-opacity-20 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-lira-text mb-2">Seller Level</h3>
                        <p className="text-sm text-gray-600 mb-6">Keep up the good work to unlock more benefits.</p>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black text-lira-text">Lv. 1</span>
                            <span className="text-sm text-gray-500 font-medium mb-1.5">Beginner</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white rounded-full h-3 mb-2">
                            <div className="bg-lira-text h-3 rounded-full w-[65%] shadow-lg"></div>
                        </div>
                        <p className="text-xs text-gray-500 text-right">650 / 1000 XP to Level 2</p>
                    </div>

                    <button className="w-full mt-4 py-3 bg-white hover:bg-gray-50 text-lira-text font-bold rounded-xl transition-colors shadow-sm">
                        View Requirements
                    </button>
                </div>
            </div>
        </div>
    );
}
