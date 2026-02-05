'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Landmark, User, Menu } from 'lucide-react';
import { useState } from 'react';
import FreelancerProfileMenu from './FreelancerProfileMenu';

export default function FreelancerNavbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        {
            name: 'Dashboard',
            href: '/freelancer',
            icon: Landmark,
            description: 'My Empire',
            color: 'text-lira-text'
        },
        {
            name: 'Create Service',
            href: '/freelancer/create-service',
            icon: Coffee,
            description: 'Pour a new Gig',
            color: 'text-lira-pink-5k'
        }
    ];

    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-lira-green-1k sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    {/* Logo / Brand */}
                    <div className="flex items-center">
                        <Link href="/freelancer" className="flex-shrink-0 flex items-center gap-2">
                            {/* Abstract Cedar Tree Icon representation */}
                            <div className="w-10 h-10 bg-gradient-to-tr from-lira-green-1k to-emerald-600 rounded-lg flex items-center justify-center transform rotate-3 shadow-lg">
                                <span className="text-white font-bold text-xl">L</span>
                            </div>
                            <span className="font-extrabold text-2xl tracking-tighter text-gray-900 hidden sm:block">
                                LFM<span className="text-lira-green-1k">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 ${isActive
                                            ? 'bg-lira-green-1k/10 shadow-sm'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${isActive ? 'bg-white shadow-sm' : 'bg-gray-100'
                                        }`}>
                                        <Icon size={20} className={item.color} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 group-hover:text-lira-green-1k transition-colors">
                                            {item.description}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Profile & Mobile Menu Button */}
                    <div className="flex items-center gap-4">
                        <FreelancerProfileMenu />

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 md:hidden text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2">
                    <div className="px-4 py-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-lira-green-1k/10'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white' : 'bg-gray-100'}`}>
                                        <Icon size={20} className={item.color} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-gray-500">{item.description}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
