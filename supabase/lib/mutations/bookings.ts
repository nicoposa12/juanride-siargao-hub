/**
 * Booking Mutations
 * Write operations for booking management
 */

import { supabase } from '@/supabase/config/supabaseClient'
import type { Database } from '@/supabase/types/database.types'

type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export interface CreateBookingData {
  vehicle_id: string
  start_date: string
  end_date: string
  total_price: number
  pickup_location?: string
  return_location?: string
  special_requests?: string
}

/**
 * Create a new booking
 */
export async function createBooking(
  renterId: string,
  bookingData: CreateBookingData
) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      renter_id: renterId,
      vehicle_id: bookingData.vehicle_id,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      total_price: bookingData.total_price,
      pickup_location: bookingData.pickup_location,
      return_location: bookingData.return_location,
      special_requests: bookingData.special_requests,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw error
  }

  return booking
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled',
  cancellationReason?: string
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    console.error('Error updating booking status:', error)
    throw error
  }

  return data
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  return updateBookingStatus(bookingId, 'cancelled', reason)
}

/**
 * Confirm a booking (owner confirms)
 */
export async function confirmBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'confirmed')
}

/**
 * Mark booking as active (vehicle picked up)
 */
export async function activateBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'active')
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'completed')
}

/**
 * Update booking details
 */
export async function updateBooking(
  bookingId: string,
  updates: {
    pickup_time?: string
    return_time?: string
    pickup_location?: string
    return_location?: string
    special_requests?: string
  }
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    console.error('Error updating booking:', error)
    throw error
  }

  return data
}
