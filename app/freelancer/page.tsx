import FreelancerProfileMenu from './_components/FreelancerProfileMenu';

export default function FreelancerPage() {
    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            {/* Decorative overlay */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-lira-text tracking-tight">
                            Freelancer Portal
                        </h1>
                        <p className="text-gray-500 mt-1">Manage your services and orders</p>
                    </div>
                    <FreelancerProfileMenu />
                </header>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-lira-green-1k p-12 text-center h-[500px] flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Freelancer Dashboard Under Construction</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        This area will contain your active gigs, earnings overview, and order management tools.
                        Design and functionality coming soon.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="w-32 h-20 bg-lira-green-1k rounded-lg animate-pulse"></div>
                        <div className="w-32 h-20 bg-lira-pink-5k rounded-lg animate-pulse delay-75"></div>
                        <div className="w-32 h-20 bg-lira-blue-50k rounded-lg animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
