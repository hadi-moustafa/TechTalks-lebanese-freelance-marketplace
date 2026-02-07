
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to update users if RLS blocks or for general admin

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars (Need SUPABASE_SERVICE_ROLE_KEY for admin tasks)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetUserRole() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address as an argument.');
        console.log('Usage: npx ts-node scripts/reset_user_role.ts <email>');
        return;
    }

    console.log(`Resetting role for user: ${email}...`);

    const { data: user, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (findError || !user) {
        console.error('User not found:', findError?.message);
        return;
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ role: null })
        .eq('id', user.id);

    if (updateError) {
        console.error('Failed to reset role:', updateError.message);
    } else {
        console.log('Success! Role set to NULL. You can now test the onboarding flow.');
    }
}

resetUserRole();
