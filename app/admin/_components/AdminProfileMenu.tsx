'use client';

import { useState } from 'react';
import { User, Moon, Globe, Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';


export default function AdminProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors border border-lira-pink-5k cursor-pointer"
            >
                <div className="w-10 h-10 rounded-full bg-lira-blue-50k flex items-center justify-center text-lira-text">
                    <User size={20} />
                </div>
                <span className="hidden md:block font-medium text-lira-text">Admin</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-lira-green-1k p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div className="relative group cursor-pointer">
                            <div className="w-16 h-16 rounded-full bg-lira-blue-50k flex items-center justify-center text-lira-text overflow-hidden">
                                <User size={32} />
                            </div>
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-lira-text">Admin User</h3>
                            <p className="text-sm text-gray-500">admin@lfm.com</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <input
                                className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lebanon-green focus:border-lebanon-green focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                                placeholder="Change username"
                                defaultValue="admin_user"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lebanon-green focus:border-lebanon-green focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                                placeholder="New password"
                            />
                            <p className="text-xs text-orange-500">Email confirmation required</p>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-2 text-lira-text">
                                <Moon size={18} />
                                <span>Dark Mode</span>
                            </div>
                            <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                                <div className="w-5 h-5 bg-white rounded-full shadow-sm border border-gray-300 absolute left-0"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-2 text-lira-text">
                                <Globe size={18} />
                                <span>Language</span>
                            </div>
                            <span className="text-sm font-medium text-blue-600">English</span>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    await fetch('/api/auth/signout', { method: 'POST' })
                                    window.location.href = '/login'
                                }}
                            >
                                <LogOut size={18} className="mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
