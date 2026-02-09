'use client';

import { useState } from 'react';
import { LayoutDashboard, CheckCircle, Tag, Shield, Menu, X, BarChart3, HandCoins } from 'lucide-react';
import AdminProfileMenu from './_components/AdminProfileMenu';
import ServiceApproval from './_components/ServiceApproval';
import CategoryManager from './_components/CategoryManager';
import AccountLevelManager from './_components/AccountLevelManager';
import FreelancerAnalytics from './_components/FreelancerAnalytics';

export default function AdminLandingPage() {
    const [activeTab, setActiveTab] = useState<'approval' | 'categories' | 'levels' | 'analytics'>('approval');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        { id: 'approval', label: 'Service Approval', icon: CheckCircle },
        { id: 'categories', label: 'Categories', icon: Tag },
        { id: 'levels', label: 'Account Levels', icon: Shield },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'override', label: 'Override & Privileges', icon: HandCoins },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 
                transition-transform duration-300 ease-in-out transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xl text-lira-text">
                            <LayoutDashboard className="text-lira-blue-50k" />
                            <span>LFM Admin</span>
                        </div>
                        <button
                            className="ml-auto lg:hidden text-gray-500"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.id === 'override') {
                                        window.location.href = '/admin/override-privileges';
                                        return;
                                    }
                                    setActiveTab(item.id as any);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                    ${activeTab === item.id
                                        ? 'bg-lira-blue-50k text-lira-text shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon size={18} className={activeTab === item.id ? 'text-lira-text' : 'text-gray-400'} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">System Status</p>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Operational
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-30">
                    <button
                        className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        onClick={toggleSidebar}
                    >
                        <Menu size={20} />
                    </button>

                    <h1 className="text-lg font-bold text-gray-800 lg:ml-0 ml-2">
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h1>

                    <AdminProfileMenu />
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        {activeTab === 'approval' && <ServiceApproval />}
                        {activeTab === 'categories' && <CategoryManager />}
                        {activeTab === 'levels' && <AccountLevelManager />}
                        {activeTab === 'analytics' && <FreelancerAnalytics />}
                    </div>
                </div>
            </main>
        </div>
    );
}
