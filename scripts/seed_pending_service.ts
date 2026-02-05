
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    // First get a valid freelancer (user) and category
    const { data: user } = await supabase.from('users').select('id').limit(1).single();
    const { data: category } = await supabase.from('categories').select('id').limit(1).single();

    if (!user || !category) {
        console.error('Need at least one user and one category to seed a service.');
        return;
    }

    const { error } = await supabase.from('services').insert({
        freelancer_id: user.id,
        category_id: category.id,
        title: 'Pending Service Test',
        description: 'This is a test service generated for admin approval verification.',
        price: 99.99,
        status: 'pending',
        created_at: new Date().toISOString()
    });

    if (error) {
        console.error('Error inserting service:', error);
    } else {
        console.log('Successfully inserted a pending service for testing.');
    }
}

seed();
