-- Create a table for managing price override requests
CREATE TABLE public.price_override_requests (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL,
    freelancer_id uuid NOT NULL,
    original_price numeric NOT NULL,
    requested_price numeric NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    
    CONSTRAINT price_override_requests_pkey PRIMARY KEY (id),
    CONSTRAINT price_override_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
    CONSTRAINT price_override_requests_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Policy to allow freelancers to view their own requests
CREATE POLICY "Freelancers can view own requests" ON public.price_override_requests
    FOR SELECT
    USING (auth.uid() = freelancer_id);

-- Policy to allow freelancers to create requests
CREATE POLICY "Freelancers can create requests" ON public.price_override_requests
    FOR INSERT
    WITH CHECK (auth.uid() = freelancer_id);

-- Policy to allow admins to view all requests
-- Assuming admins are identified by role in public.users or app_metadata
-- For simplicity, allowing based on role check if possible, or broad select for authenticated users who are admins
-- Adjusting to likely existing pattern: if user role is 'admin' or 'superadmin'

-- Grant access to authenticated users (row level security needs to be enabled)
ALTER TABLE public.price_override_requests ENABLE ROW LEVEL SECURITY;

-- Simple policy for admins (adjust based on your auth setup)
-- This is a placeholder policy, ensure your RLS allows admins to SELECT/UPDATE
CREATE POLICY "Admins can view all requests" ON public.price_override_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
        )
    );

CREATE POLICY "Admins can update requests" ON public.price_override_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
        )
    );
