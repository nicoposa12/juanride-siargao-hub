import { createClient } from '../client'
import type { BookingRequest, BookingWithDetails } from '@/types/booking.types'

export async function getUserBookings(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        id,
        type,
        make,
        model,
        plate_number,
        image_urls,
        owner_id
      ),
      payment:payments (
        id,
        status,
        payment_method,
        amount
      )
    `)
    .eq('renter_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as BookingWithDetails[]
}

export async function getOwnerBookings(ownerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles!inner (
        id,
        type,
        make,
        model,
        plate_number,
        image_urls
      ),
      renter:users!renter_id (
        id,
        full_name,
        phone_number,
        email
      ),
      payment:payments (
        id,
        status,
        payment_method,
        amount
      )
    `)
    .eq('vehicle.owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as BookingWithDetails[]
}

export async function getBookingById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles (
        id,
        type,
        make,
        model,
        plate_number,
        image_urls,
        owner_id,
        owner:users!owner_id (
          id,
          full_name,
          phone_number,
          email
        )
      ),
      renter:users!renter_id (
        id,
        full_name,
        phone_number,
        email
      ),
      payment:payments (
        id,
        status,
        payment_method,
        amount,
        transaction_id
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as BookingWithDetails
}

export async function createBooking(bookingData: BookingRequest, userId: string) {
  const supabase = createClient()

  // Calculate total price (this would normally use pricing utility)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('price_per_day, price_per_week, price_per_month')
    .eq('id', bookingData.vehicle_id)
    .single()

  if (!vehicle) throw new Error('Vehicle not found')

  const startDate = new Date(bookingData.start_date)
  const endDate = new Date(bookingData.end_date)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const totalPrice = days * vehicle.price_per_day

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      renter_id: userId,
      vehicle_id: bookingData.vehicle_id,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      total_price: totalPrice,
      pickup_time: bookingData.pickup_time,
      special_requests: bookingData.special_requests,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBookingStatus(id: string, status: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelBooking(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTodaysPickups(ownerId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles!inner (
        id,
        type,
        make,
        model,
        plate_number
      ),
      renter:users!renter_id (
        full_name,
        phone_number
      )
    `)
    .eq('vehicle.owner_id', ownerId)
    .eq('start_date', today)
    .eq('status', 'confirmed')

  if (error) throw error
  return data
}

export async function getTodaysReturns(ownerId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles!inner (
        id,
        type,
        make,
        model,
        plate_number
      ),
      renter:users!renter_id (
        full_name,
        phone_number
      )
    `)
    .eq('vehicle.owner_id', ownerId)
    .eq('end_date', today)
    .eq('status', 'active')

  if (error) throw error
  return data
}

