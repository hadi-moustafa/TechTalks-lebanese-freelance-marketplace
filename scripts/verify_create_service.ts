
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

async function verifyCreateService() {
    // 1. Get a test user (freelancer)
    const { data: user } = await supabase.from('users').select('id, email').limit(1).single();
    if (!user) {
        console.error('No users found to test with.');
        return;
    }
    console.log('Testing with user:', user.email);

    // 2. Get a category
    const { data: category } = await supabase.from('categories').select('id, name').limit(1).single();
    if (!category) {
        console.error('No categories found.');
        return;
    }
    console.log('Testing with category:', category.name);

    // 3. Simulate Insert
    const { data, error } = await supabase.from('services').insert({
        freelancer_id: user.id,
        title: 'Automated Test Service',
        description: 'This is a service created by the verification script.',
        price: 150.00,
        category_id: category.id,
        status: 'pending' // As per logic
    }).select().single();

    if (error) {
        console.error('Failed to create service:', error);
    } else {
        console.log('Successfully created service:', data);

        // Cleanup
        console.log('Cleaning up (deleting test service)...');
        await supabase.from('services').delete().eq('id', data.id);
        console.log('Cleanup complete.');
    }
}

verifyCreateService();
