/**
 * Review Mutations
 * Write operations for review management
 */

import { supabase } from '@/supabase/config/supabaseClient'
import type { Database } from '@/supabase/types/database.types'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export interface CreateReviewData {
  booking_id: string
  vehicle_id: string
  owner_id: string
  rating: number
  comment?: string
  cleanliness_rating?: number
  condition_rating?: number
  value_rating?: number
  communication_rating?: number
}

/**
 * Create a new review
 */
export async function createReview(
  reviewerId: string,
  reviewData: CreateReviewData
) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: reviewerId,
      booking_id: reviewData.booking_id,
      vehicle_id: reviewData.vehicle_id,
      owner_id: reviewData.owner_id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      cleanliness_rating: reviewData.cleanliness_rating,
      condition_rating: reviewData.condition_rating,
      value_rating: reviewData.value_rating,
      communication_rating: reviewData.communication_rating,
      is_approved: false, // Requires admin approval
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    throw error
  }

  return data
}

/**
 * Update a review
 */
export async function updateReview(reviewId: string, updates: ReviewUpdate) {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) {
    console.error('Error updating review:', error)
    throw error
  }

  return data
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    console.error('Error deleting review:', error)
    throw error
  }

  return true
}

/**
 * Report a review
 */
export async function reportReview(reviewId: string, reason: string) {
  // This could be extended to create a report entry in a reports table
  const { data, error } = await supabase
    .from('reviews')
    .update({
      is_approved: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) {
    console.error('Error reporting review:', error)
    throw error
  }

  return data
}
