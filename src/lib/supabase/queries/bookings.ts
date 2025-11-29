import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { createCommission, type PaymentMethod } from './commissions'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

const normalizeSingle = <T>(value: T | T[] | null): T | null => {
  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] as T) : null
  }
  return value ?? null
}

export type BookingWithDetails = Booking & {
  vehicle?: any
  renter?: any
  payment?: any
}

export interface IdentityDocumentWithBooking {
  id_document: Database['public']['Tables']['id_documents']['Row']
  renter: {
    id: string
    full_name: string | null
    email: string | null
    phone_number: string | null
    profile_image_url: string | null
  } | null
  booking: BookingWithDetails
}

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
 * Get all identity documents for owner review (not booking-specific)
 * Used for the owner identity verification dashboard
 */
export async function getAllIdentityDocumentsForOwner(
  statusFilter: ('pending_review' | 'approved' | 'rejected' | 'expired')[] = ['pending_review']
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('id_documents')
    .select(`
      *,
      renter:users!id_documents_renter_id_fkey (
        id,
        full_name,
        email,
        phone_number,
        profile_image_url
      )
    `)
    .in('status', statusFilter)
    .order('submitted_at', { ascending: true })

  if (error || !data) {
    console.error('Error loading identity documents:', error)
    return []
  }

  return data.map((row) => ({
    id_document: row,
    renter: normalizeSingle(row.renter),
  }))
}

export async function getOwnerIdentityDocuments(
  ownerId: string,
  statusFilter: ('pending_review' | 'approved' | 'rejected' | 'expired')[] = ['pending_review']
): Promise<IdentityDocumentWithBooking[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      end_date,
      identity_requirement_status,
      identity_document_id,
      renter:users!bookings_renter_id_fkey (
        id,
        full_name,
        email,
        phone_number,
        profile_image_url
      ),
      vehicle:vehicles (
        id,
        owner_id,
        make,
        model,
        type,
        image_urls,
        plate_number
      ),
      identity_document:id_documents (* )
    `)
    .eq('vehicle.owner_id', ownerId)
    .not('identity_document_id', 'is', null)
    .in('identity_document.status', statusFilter)
    .order('identity_document.submitted_at', { ascending: true })

  if (error || !data) {
    console.error('Error loading owner identity documents:', error)
    return []
  }

  return data
    .map((row) => {
      const identityDocument = normalizeSingle(row.identity_document)
      if (!identityDocument) {
        return null
      }

      const renterRaw = normalizeSingle(row.renter)
      const vehicleRaw = normalizeSingle(row.vehicle)

      const { identity_document: _doc, renter: _renter, vehicle: _vehicle, ...bookingRest } = row as any

      const normalizedBooking: BookingWithDetails = {
        ...(bookingRest as Booking),
        renter: renterRaw ?? undefined,
        vehicle: vehicleRaw ?? undefined,
      }

      const renter: IdentityDocumentWithBooking['renter'] = renterRaw
        ? {
            id: renterRaw.id ?? '',
            full_name: renterRaw.full_name ?? null,
            email: renterRaw.email ?? null,
            phone_number: renterRaw.phone_number ?? null,
            profile_image_url: renterRaw.profile_image_url ?? null,
          }
        : null

      return {
        id_document: identityDocument as Database['public']['Tables']['id_documents']['Row'],
        renter,
        booking: normalizedBooking,
      }
    })
    .filter((entry): entry is IdentityDocumentWithBooking => entry !== null)
}

export async function reviewIdentityDocument(
  documentId: string,
  status: 'approved' | 'rejected',
  reviewerId: string,
  options?: { rejectionReason?: string; ownerNotes?: string; bookingId?: string }
) {
  const supabase = createClient()

  const { error: docError } = await supabase
    .from('id_documents')
    .update({
      status: status,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: status === 'rejected' ? options?.rejectionReason ?? null : null,
      owner_notes: options?.ownerNotes,
    })
    .eq('id', documentId)

  if (docError) {
    console.error('Error updating identity document:', docError)
    return { success: false, error: docError }
  }

  // If a booking ID is provided, update the booking's identity requirement status
  if (options?.bookingId) {
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ identity_requirement_status: status === 'approved' ? 'approved' : 'rejected' })
      .eq('id', options.bookingId)

    if (bookingError) {
      console.error('Error updating booking identity status:', bookingError)
      return { success: false, error: bookingError }
    }
  }

  return { success: true }
}

// (types defined near top)

/**
 * Create a new booking
 */
export async function createBooking(
  renterId: string,
  bookingData: CreateBookingData
): Promise<{ booking: Booking | null; error: any }> {
  const supabase = createClient()

  // Check if the vehicle owner is suspended
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select(`
      id,
      owner:users!owner_id (
        id,
        is_suspended
      )
    `)
    .eq('id', bookingData.vehicle_id)
    .single()

  if (vehicleError) {
    return { booking: null, error: vehicleError }
  }

  // Prevent booking if owner is suspended
  const owner = Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner
  if (owner?.is_suspended) {
    return { 
      booking: null, 
      error: { 
        message: 'This vehicle is currently unavailable. The owner account is suspended.',
        code: 'OWNER_SUSPENDED'
      } 
    }
  }

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
      vehicle:vehicles!vehicle_id (
        *,
        owner:users!vehicles_owner_id_fkey (
          id,
          full_name,
          profile_image_url,
          phone_number
        )
      ),
      renter:users!bookings_renter_id_fkey (
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
      vehicle:vehicles!vehicle_id (
        *,
        owner:users!vehicles_owner_id_fkey (
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
      vehicle:vehicles!vehicle_id (
        *,
        owner:users!vehicles_owner_id_fkey (
          id,
          full_name,
          profile_image_url
        )
      ),
      renter:users!bookings_renter_id_fkey (
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
  status: 'pending' | 'paid' | 'confirmed' | 'active' | 'ongoing' | 'completed' | 'cancelled'
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
 * Automatically creates a 10% commission record using the renter's payment method
 */
export async function confirmBooking(
  bookingId: string,
  paymentMethod?: PaymentMethod
): Promise<{ success: boolean; error: any }> {
  const supabase = createClient()
  
  try {
    // First, get the booking details including payment information
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        total_price,
        owner_id,
        vehicle:vehicles!vehicle_id (owner_id),
        payment:payments (
          payment_method,
          status
        )
      `)
      .eq('id', bookingId)
      .single()
    
    if (fetchError || !booking) {
      throw new Error('Failed to fetch booking details')
    }
    
    // Update booking status to confirmed
    const statusResult = await updateBookingStatus(bookingId, 'confirmed')
    
    if (!statusResult.success) {
      throw new Error('Failed to update booking status')
    }
    
    // Determine owner ID (from vehicle owner)
    const vehicle: any = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle
    const ownerId = vehicle?.owner_id
    
    if (!ownerId) {
      throw new Error('Owner ID not found')
    }
    
    // Get payment method from payment record, fallback to provided parameter or 'cash'
    let method: PaymentMethod = 'cash' // Default fallback
    
    if (paymentMethod) {
      // Use explicitly provided payment method
      method = paymentMethod
    } else if (booking.payment) {
      // Extract payment method from payment record
      const payment: any = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
      const dbPaymentMethod = payment?.payment_method
      
      // Map database payment method to commission payment method
      // Database uses: gcash, maya, card, bank_transfer, qrph, grab_pay, billease
      // Commission uses: qrph, gcash, paymaya, grabpay, billease, cash
      const methodMap: Record<string, PaymentMethod> = {
        'gcash': 'gcash',
        'maya': 'paymaya',
        'paymaya': 'paymaya',
        'qrph': 'qrph',
        'grab_pay': 'grabpay',
        'grabpay': 'grabpay',
        'billease': 'billease',
        'card': 'gcash', // Map card to gcash (cashless)
        'bank_transfer': 'gcash', // Map bank transfer to gcash (cashless)
      }
      
      if (dbPaymentMethod && methodMap[dbPaymentMethod]) {
        method = methodMap[dbPaymentMethod]
      }
    }
    
    // Create commission record (10% of rental amount)
    const commissionResult = await createCommission(
      bookingId,
      ownerId,
      booking.total_price,
      method
    )
    
    if (!commissionResult.success) {
      console.error('Failed to create commission record:', commissionResult.error)
      // Don't fail the entire operation if commission creation fails
      // Log it for manual intervention
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error confirming booking:', error)
    return { success: false, error }
  }
}

/**
 * Mark booking as paid (payment completed, awaiting owner confirmation)
 */
export async function markBookingPaid(bookingId: string): Promise<{ success: boolean; error: any }> {
  return updateBookingStatus(bookingId, 'paid')
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
      vehicle:vehicles!vehicle_id (
        *,
        owner:users!vehicles_owner_id_fkey (
          id,
          full_name,
          profile_image_url
        )
      ),
      payment:payments (*)
    `)
    .eq('renter_id', renterId)
    .in('status', ['confirmed', 'active', 'ongoing'])
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
      vehicle:vehicles!vehicle_id (
        *,
        owner:users!vehicles_owner_id_fkey (
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
