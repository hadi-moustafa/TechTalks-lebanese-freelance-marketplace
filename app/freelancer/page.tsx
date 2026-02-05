import FreelancerNavbar from './_components/FreelancerNavbar';
import FreelancerDashboard from './_components/FreelancerDashboard';

export default function FreelancerPage() {
    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans relative">
            <FreelancerNavbar />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FreelancerDashboard />
            </div>
        </div>
    );
}
