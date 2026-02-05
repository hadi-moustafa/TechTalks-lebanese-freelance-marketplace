import AdminProfileMenu from './_components/AdminProfileMenu';
import ServiceApproval from './_components/ServiceApproval';

export default function AdminLandingPage() {
    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            {/* Decorative overlay for better readability */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <div>
                        <h1 className="text-3xl font-extrabold text-lira-text tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1">Manage platform services</p>
                    </div>
                    <AdminProfileMenu />
                </header>

                {/* Main Content - Centered Approval Box */}
                <div className="flex justify-center items-start min-h-[600px] pb-12">
                    <ServiceApproval />
                </div>
            </div>
        </div>
    );
}
