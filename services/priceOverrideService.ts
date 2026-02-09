import { supabase } from '@/lib/supabase'

export type PriceOverrideRequest = {
    id: string
    service_id: string
    freelancer_id: string
    original_price: number
    requested_price: number
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    admin_notes?: string
    created_at: string
    resolved_at?: string
    service?: {
        title: string
    }
    freelancer?: {
        username: string
        email: string
    }
}

class PriceOverrideService {
    /**
     * Create a new price override request
     */
    async createRequest(
        serviceId: string,
        freelancerId: string,
        originalPrice: number,
        requestedPrice: number,
        reason: string
    ) {
        try {
            const { data, error } = await supabase
                .from('price_override_requests')
                .insert({
                    service_id: serviceId,
                    freelancer_id: freelancerId,
                    original_price: originalPrice,
                    requested_price: requestedPrice,
                    reason,
                    status: 'pending'
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error: any) {
            console.error('Error creating price override request:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Get requests for a specific freelancer
     */
    async getFreelancerRequests(freelancerId: string) {
        try {
            const { data, error } = await supabase
                .from('price_override_requests')
                .select(`
          *,
          service:services(title)
        `)
                .eq('freelancer_id', freelancerId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data }
        } catch (error: any) {
            console.error('Error fetching freelancer requests:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all requests (for admin)
     */
    async getAllRequests(status?: 'pending' | 'approved' | 'rejected') {
        try {
            let query = supabase
                .from('price_override_requests')
                .select(`
          *,
          service:services(title, id),
          freelancer:users(username, email, id)
        `)
                .order('created_at', { ascending: false })

            if (status) {
                query = query.eq('status', status)
            }

            const { data, error } = await query

            if (error) throw error
            return { success: true, data }
        } catch (error: any) {
            console.error('Error fetching all requests:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Approve a request
     */
    async approveRequest(requestId: string, adminNotes?: string) {
        try {
            // 1. Get the request details
            const { data: request, error: fetchError } = await supabase
                .from('price_override_requests')
                .select('*')
                .eq('id', requestId)
                .single()

            if (fetchError) throw fetchError
            if (!request) throw new Error('Request not found')

            // 2. Update the service price
            const { error: serviceError } = await supabase
                .from('services')
                .update({ price: request.requested_price })
                .eq('id', request.service_id)

            if (serviceError) throw serviceError

            // 3. Mark request as approved
            const { data, error: updateError } = await supabase
                .from('price_override_requests')
                .update({
                    status: 'approved',
                    admin_notes: adminNotes,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', requestId)
                .select()
                .single()

            if (updateError) throw updateError

            return { success: true, data }
        } catch (error: any) {
            console.error('Error approving request:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Reject a request
     */
    async rejectRequest(requestId: string, adminNotes?: string) {
        try {
            const { data, error } = await supabase
                .from('price_override_requests')
                .update({
                    status: 'rejected',
                    admin_notes: adminNotes,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', requestId)
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error: any) {
            console.error('Error rejecting request:', error)
            return { success: false, error: error.message }
        }
    }
}

export default new PriceOverrideService()
