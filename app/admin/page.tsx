import AdminProfileMenu from './_components/AdminProfileMenu';
import PriceOverrideCard from './_components/PriceOverrideCard';
import ServiceModerationQueue from './_components/ServiceModerationQueue';

export default function AdminLandingPage() {
    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            {/* Decorative overlay for better readability */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-lira-text tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1">Welcome back, Admin</p>
                    </div>
                    <AdminProfileMenu />
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)] min-h-[600px]">
                    {/* Left Column: Price Override */}
                    <section className="lg:col-span-1 h-full">
                        <PriceOverrideCard />
                    </section>

                    {/* Right Column: Moderation Queue */}
                    <section className="lg:col-span-2 h-full">
                        <ServiceModerationQueue />
                    </section>
                </div>
            </div>
        </div>
    );
}
