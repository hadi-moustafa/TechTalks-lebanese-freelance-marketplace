
'use client';

import { useState, useEffect } from 'react';
import { Moon, Globe, LogOut, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import UsernameChangeInput from '@/components/profile/UsernameChangeInput';
import UsernameService from '@/services/usernameService';
import PasswordChangeInput from '@/components/profile/PasswordChangeInput';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabase/client';

export default function FreelancerProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUsername, setCurrentUsername] = useState("freelancer_pro");
    const [isLoadingUsername, setIsLoadingUsername] = useState(true);
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            console.log("Signout clicked");
            // Clear client-side session first
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Supabase client signout error:", error);

            // Clear server-side cookies
            await fetch('/api/auth/signout', { method: 'POST', cache: 'no-store' });

            console.log("Signout API called. Redirecting...");
            router.refresh();
            window.location.href = '/login'; // Force full reload to ensure clean state
        } catch (error) {
            console.error("Signout failed:", error);
            window.location.href = '/login';
        }
    };

    // Fetch username from database when component mounts
    useEffect(() => {
        async function fetchUsername() {
            setIsLoadingUsername(true);
            const username = await UsernameService.getUsername("196dc23e-cf57-4964-ac41-a398b8faeb81");
            if (username) {
                setCurrentUsername(username);
            }
            setIsLoadingUsername(false);
        }
        fetchUsername();
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors border border-lira-pink-5k cursor-pointer"
            >
                <div className="w-10 h-10 rounded-full bg-lira-yellow-10k flex items-center justify-center text-yellow-700">
                    <Briefcase size={20} />
                </div>
                <span className="hidden md:block font-medium text-lira-text">Freelancer</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-lira-green-1k p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div className="relative group cursor-pointer">
                            <ProfilePictureUpload
                                userId="196dc23e-cf57-4964-ac41-a398b8faeb81"
                                currentPictureUrl={null}
                                userName="Freelancer User"
                                bgColor="bg-lira-yellow-10k"
                                iconColor="text-yellow-700"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-lira-text">Freelancer User</h3>
                            <p className="text-sm text-gray-500">freelancer@lfm.com</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <input
                                className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lebanon-green focus:border-lebanon-green focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                                placeholder="Change username"
                                defaultValue="freelancer_pro"
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
                                onClick={handleSignOut}
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