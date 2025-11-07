import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Booking = Database['public']['Tables']['bookings']['Row']
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

export interface BookingWithDetails extends Booking {
  vehicle?: any
  renter?: any
  payment?: any
}

/**
 * Create a new booking
 */
export async function createBooking(
  renterId: string,
  bookingData: CreateBookingData
): Promise<{ booking: Booking | null; error: any }> {
  const supabase = createClient()

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

  return { booking, error }
}

/**
 * Get booking by ID with full details
 */
export async function getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  const supabase = createClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url,
          phone_number
        )
      ),
      renter:users!renter_id (
        id,
        full_name,
        profile_image_url,
        email,
        phone_number
      ),
      payment:payments (*)
    `)
    .eq('id', bookingId)
    .single()

  if (error) {
    console.error('Error fetching booking:', error)
    return null
  }

  return booking as BookingWithDetails
}

/**
 * Get all bookings for a renter
 */
export async function getRenterBookings(renterId: string): Promise<BookingWithDetails[]> {
  const supabase = createClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url
        )
      ),
      payment:payments (*)
    `)
    .eq('renter_id', renterId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching renter bookings:', error)
    return []
  }

  return (bookings as BookingWithDetails[]) || []
}

/**
 * Backwards-compatible wrapper for renter bookings
 */
export async function getUserBookings(userId: string): Promise<BookingWithDetails[]> {
  return getRenterBookings(userId)
}

/**
 * Get all bookings for vehicles owned by an owner
 */
export async function getOwnerBookings(ownerId: string): Promise<BookingWithDetails[]> {
  const supabase = createClient()

  // First get all vehicle IDs owned by this user
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('owner_id', ownerId)

  if (!vehicles || vehicles.length === 0) {
    return []
  }

  const vehicleIds = vehicles.map(v => v.id)

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url
        )
      ),
      renter:users!renter_id (
        id,
        full_name,
        profile_image_url,
        phone_number
      ),
      payment:payments (*)
    `)
    .in('vehicle_id', vehicleIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching owner bookings:', error)
    return []
  }

  return (bookings as BookingWithDetails[]) || []
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
): Promise<{ success: boolean; error: any }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  return { success: !error, error }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error: any }> {
  return updateBookingStatus(bookingId, 'cancelled')
}

/**
 * Confirm a booking (owner confirms)
 */
export async function confirmBooking(bookingId: string): Promise<{ success: boolean; error: any }> {
  return updateBookingStatus(bookingId, 'confirmed')
}

/**
 * Mark booking as active (vehicle picked up)
 */
export async function activateBooking(bookingId: string): Promise<{ success: boolean; error: any }> {
  return updateBookingStatus(bookingId, 'active')
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string): Promise<{ success: boolean; error: any }> {
  return updateBookingStatus(bookingId, 'completed')
}

/**
 * Get upcoming bookings for a renter
 */
export async function getUpcomingBookings(renterId: string): Promise<BookingWithDetails[]> {
  const supabase = createClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url
        )
      ),
      payment:payments (*)
    `)
    .eq('renter_id', renterId)
    .in('status', ['confirmed', 'active'])
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming bookings:', error)
    return []
  }

  return (bookings as BookingWithDetails[]) || []
}

/**
 * Get past bookings for a renter
 */
export async function getPastBookings(renterId: string): Promise<BookingWithDetails[]> {
  const supabase = createClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url
        )
      ),
      payment:payments (*)
    `)
    .eq('renter_id', renterId)
    .eq('status', 'completed')
    .lt('end_date', new Date().toISOString().split('T')[0])
    .order('end_date', { ascending: false })

  if (error) {
    console.error('Error fetching past bookings:', error)
    return []
  }

  return (bookings as BookingWithDetails[]) || []
}
