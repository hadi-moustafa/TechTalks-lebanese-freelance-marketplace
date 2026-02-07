import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
        console.error('Missing env vars:', { url: !!url, serviceKey: !!serviceKey });
        throw new Error('Missing Supabase environment variables');
    }
    
    return createClient(url, serviceKey);
}

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        
        const { data, error } = await supabase
            .from('services')
            .select(`
                *,
                users:freelancer_id (username, email),
                categories:category_id (name),
                service_images (id, image_url, is_primary)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending services:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ services: data || [] });
    } catch (err: unknown) {
        console.error('API error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const { id, status, rejection_reason } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const updateData: { status: string; rejection_reason?: string | null; updated_at: string } = { 
            status,
            updated_at: new Date().toISOString()
        };
        
        if (status === 'rejected' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        } else if (status === 'approved') {
            updateData.rejection_reason = null;
        }

        const { error } = await supabase
            .from('services')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error updating service:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('API error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
