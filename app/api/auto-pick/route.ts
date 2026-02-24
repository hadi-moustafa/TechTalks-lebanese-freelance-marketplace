import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(url, serviceKey);
}

export async function GET(request: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category_id');

        // Query service views, joining with services to get freelancer_id
        let query = supabase
            .from('service_views')
            .select('service_id, services!inner ( freelancer_id, category_id, status )');

        if (categoryId) {
            query = query.eq('services.category_id', parseInt(categoryId));
        }

        // Only count views on approved services
        query = query.eq('services.status', 'approved');

        const { data: views, error } = await query;

        if (error) {
            console.error('Error fetching views:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!views || views.length === 0) {
            return NextResponse.json({ freelancer: null, service: null });
        }

        // Count total views per freelancer
        const freelancerViews: Record<string, number> = {};
        for (const view of views) {
            const freelancerId = (view.services as any).freelancer_id;
            freelancerViews[freelancerId] = (freelancerViews[freelancerId] || 0) + 1;
        }

        // Find freelancer with most views
        const topFreelancerId = Object.entries(freelancerViews)
            .sort(([, a], [, b]) => b - a)[0][0];

        const totalViews = freelancerViews[topFreelancerId];

        // Get freelancer info
        const { data: freelancer } = await supabase
            .from('users')
            .select('id, username, email, profile_pic')
            .eq('id', topFreelancerId)
            .single();

        // Get their best approved service (in the selected category if specified)
        let serviceQuery = supabase
            .from('services')
            .select(`
                *,
                categories:category_id (id, name),
                service_images (*)
            `)
            .eq('freelancer_id', topFreelancerId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1);

        if (categoryId) {
            serviceQuery = serviceQuery.eq('category_id', parseInt(categoryId));
        }

        const { data: services } = await serviceQuery;

        return NextResponse.json({
            freelancer: {
                ...freelancer,
                total_views: totalViews,
            },
            service: services?.[0] || null,
        });
    } catch (err: unknown) {
        console.error('API error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
