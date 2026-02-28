'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Briefcase, Plus, Menu } from 'lucide-react';
import { useState } from 'react';
import FreelancerProfileMenu from './FreelancerProfileMenu';

export default function FreelancerNavbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: '/freelancer', icon: Landmark },
        { name: 'Create Service', href: '/freelancer/services/create', icon: Plus },
        { name: 'My Services', href: '/freelancer/services', icon: Briefcase }
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16 items-center">

                    <Link href="/freelancer" className="font-semibold text-lg text-gray-900">
                        LFM
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 text-sm ${
                                        isActive ? 'text-black font-medium' : 'text-gray-500'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <FreelancerProfileMenu />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden"
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
}