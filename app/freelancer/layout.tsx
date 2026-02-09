'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Plus,
    Briefcase,
    Menu,
    X,
    Landmark
} from 'lucide-react';
import FreelancerProfileMenu from './_components/FreelancerProfileMenu';

export default function FreelancerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/freelancer',
            icon: Landmark,
            description: 'My Empire'
        },
        {
            name: 'Create Service',
            href: '/freelancer/services/create',
            icon: Plus,
            description: 'Pour a new Gig'
        },
        {
            name: 'My Services',
            href: '/freelancer/services',
            icon: Briefcase,
            description: 'View services'
        }
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
                        <Link href="/freelancer" className="flex items-center gap-2 font-bold text-xl text-lira-text hover:opacity-80 transition-opacity">
                            {/* Abstract Cedar Tree Icon representation */}
                            <div className="w-8 h-8 bg-gradient-to-tr from-lira-green-1k to-emerald-600 rounded-lg flex items-center justify-center transform rotate-3 shadow-md">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span>LFM<span className="text-lira-green-1k">.</span></span>
                        </Link>
                        <button
                            className="ml-auto lg:hidden text-gray-500"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-lira-green-1k/10 text-lira-green-1k shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    <Icon size={20} className={isActive ? 'text-lira-green-1k' : 'text-gray-400 group-hover:text-lira-green-1k'} />
                                    <div className="flex flex-col">
                                        <span>{item.name}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 group-hover:text-lira-green-1k transition-colors font-normal">
                                            {item.description}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer - Profile Menu */}
                    <div className="p-4 border-t border-gray-100">
                        {/* We can place the profile menu here for desktop if we want, 
                             but the admin design has it in the header. 
                             Let's keep consistency and put it in the header, 
                             maybe add something else here or leave empty. 
                         */}
                        <div className="bg-lira-green-1k/5 rounded-xl p-4">
                            <p className="text-xs font-semibold text-lira-green-1k uppercase mb-2">My Status</p>
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Online
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

                    <h1 className="text-lg font-bold text-gray-800 lg:ml-0 ml-2 hidden sm:block">
                        {menuItems.find(i => i.href === pathname)?.name || 'Freelancer Dashboard'}
                    </h1>

                    <div className="ml-auto">
                        <FreelancerProfileMenu />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-lebanese-pattern">
                    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
