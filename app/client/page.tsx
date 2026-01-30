import ClientProfileMenu from './_components/ClientProfileMenu';

export default function ClientPage() {
    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            {/* Decorative overlay */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-lira-text tracking-tight">
                            Client Portal
                        </h1>
                        <p className="text-gray-500 mt-1">Explore services and manage projects</p>
                    </div>
                    <ClientProfileMenu />
                </header>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-lira-green-1k p-12 text-center h-[500px] flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Client Dashboard Under Construction</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        This area will feature service browsing, favorite lists, and your active orders.
                        Design and functionality coming soon.
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="w-32 h-32 bg-lira-green-1k rounded-full animate-pulse"></div>
                        <div className="w-32 h-32 bg-lira-pink-5k rounded-full animate-pulse delay-100"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
