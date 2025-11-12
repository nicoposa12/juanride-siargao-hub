import { supabase } from '@/supabase/config/supabaseClient'
import type { Database } from '@/supabase/types/database.types'

export async function getVehicleReviews(vehicleId: string) {
  // Using singleton supabase client

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviewer_id (
        id,
        full_name,
        profile_image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createReview(reviewData: {
  booking_id: string
  vehicle_id: string
  rating: number
  comment?: string
  cleanliness_rating?: number
  condition_rating?: number
  value_rating?: number
  image_urls?: string[]
}, userId: string) {
  // Using singleton supabase client

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...reviewData,
      reviewer_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReview(id: string, updates: any) {
  // Using singleton supabase client

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addOwnerResponse(reviewId: string, response: string, ownerId: string) {
  // Using singleton supabase client

  const { data, error } = await supabase
    .from('reviews')
    .update({
      owner_response: response,
      owner_response_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPendingReviews(userId: string) {
  // Using singleton supabase client

  // Get completed bookings without reviews
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      vehicle_id,
      vehicle:vehicles (
        id,
        type,
        make,
        model,
        image_urls
      )
    `)
    .eq('renter_id', userId)
    .eq('status', 'completed')
    .not('id', 'in', `(SELECT booking_id FROM reviews WHERE reviewer_id = '${userId}')`)

  if (error) throw error
  return data
}

