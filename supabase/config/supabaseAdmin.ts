/**
 * Supabase Admin Client
 * 
 * SECURITY WARNING: This client uses the service role key and bypasses RLS.
 * Only use this in secure server-side contexts (API routes, server actions, edge functions).
 * NEVER expose service role key to the client.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types/database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * Admin client with service role privileges
 * Bypasses Row Level Security policies
 * 
 * Use cases:
 * - Admin operations (user management, approvals, etc.)
 * - Background jobs and scheduled tasks
 * - Data migrations and seeding
 * - Server-side operations requiring elevated privileges
 * 
 * @example
 * ```typescript
 * import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'
 * 
 * // Approve a vehicle (admin operation)
 * const { data } = await supabaseAdmin
 *   .from('vehicles')
 *   .update({ is_approved: true })
 *   .eq('id', vehicleId)
 * ```
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Admin-only operations helper functions
 */

/**
 * Get user by ID (bypassing RLS)
 */
export async function adminGetUser(userId: string) {
  return supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
}

/**
 * Update user role (admin only)
 */
export async function adminUpdateUserRole(
  userId: string,
  role: 'renter' | 'owner' | 'admin'
) {
  const { data, error } = await (supabaseAdmin.from('users') as any)
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
  
  return { data, error }
}

/**
 * Approve vehicle listing (admin only)
 */
export async function adminApproveVehicle(
  vehicleId: string,
  approved: boolean,
  adminNotes?: string
) {
  const { data, error } = await (supabaseAdmin.from('vehicles') as any)
    .update({
      is_approved: approved,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)
    .select()
  
  return { data, error }
}

/**
 * Approve review (admin only)
 */
export async function adminApproveReview(
  reviewId: string,
  approved: boolean
) {
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .update({
      is_approved: approved,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
  
  return { data, error }
}

/**
 * Delete user and all associated data (admin only, dangerous operation)
 */
export async function adminDeleteUser(userId: string) {
  // This will cascade delete based on foreign key constraints
  return supabaseAdmin.from('users').delete().eq('id', userId)
}

/**
 * Get all pending approvals (vehicles and reviews)
 */
export async function adminGetPendingApprovals() {
  const [vehicles, reviews] = await Promise.all([
    supabaseAdmin
      .from('vehicles')
      .select('*, owner:users!owner_id(id, full_name, email)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('reviews')
      .select('*, reviewer:users!reviewer_id(id, full_name), vehicle:vehicles(id, make, model)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
  ])

  return {
    vehicles: vehicles.data || [],
    reviews: reviews.data || [],
    errors: {
      vehicles: vehicles.error,
      reviews: reviews.error,
    },
  }
}
