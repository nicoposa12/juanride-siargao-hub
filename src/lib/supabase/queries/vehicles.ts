import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleWithOwner = Vehicle & {
  owner: {
    id: string
    full_name: string | null
    profile_image_url: string | null
  } | null
}

export interface VehicleFilters {
  type?: string[]
  minPrice?: number
  maxPrice?: number
  location?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export interface VehicleSearchResult {
  vehicles: VehicleWithOwner[]
  total: number
  hasMore: boolean
}

/**
 * Search vehicles with filters and availability checking
 */
export async function searchVehicles(
  filters: VehicleFilters = {},
  page: number = 1,
  limit: number = 12
): Promise<VehicleSearchResult> {
  const supabase = createClient()
  
  // Calculate offset for pagination
  const offset = (page - 1) * limit

  // Start building the query
  let query = supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url
      )
    `, { count: 'exact' })
    .eq('is_approved', true)
    .eq('status', 'available')

  // Apply filters
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price_per_day', filters.minPrice)
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price_per_day', filters.maxPrice)
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters.searchQuery) {
    // Full-text search on description, make, model
    query = query.or(`description.ilike.%${filters.searchQuery}%,make.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%`)
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  // Order by created_at descending (newest first)
  query = query.order('created_at', { ascending: false })

  const { data: vehicles, error, count } = await query

  if (error) {
    console.error('Error searching vehicles:', error)
    throw error
  }

  // If date filters are provided, check availability
  let availableVehicles = vehicles || []
  
  if (filters.startDate && filters.endDate) {
    availableVehicles = await filterByAvailability(
      vehicles || [],
      filters.startDate,
      filters.endDate
    )
  }

  return {
    vehicles: availableVehicles as VehicleWithOwner[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}

/**
 * Filter vehicles by availability for given dates
 */
async function filterByAvailability(
  vehicles: any[],
  startDate: string,
  endDate: string
): Promise<any[]> {
  const supabase = createClient()

  const availableVehicles = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Check for booking conflicts
      const { data: bookingConflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'active'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .overlaps('daterange(start_date, end_date)', `[${startDate},${endDate}]`)

      // Check for blocked dates
      const { data: blockedDates } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      // Vehicle is available if no conflicts and no blocked dates
      const isAvailable = 
        (!bookingConflicts || bookingConflicts.length === 0) &&
        (!blockedDates || blockedDates.length === 0)

      return isAvailable ? vehicle : null
    })
  )

  return availableVehicles.filter(Boolean)
}

/**
 * Get a single vehicle by ID with owner and reviews
 */
export async function getVehicleById(id: string) {
  const supabase = createClient()

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url,
        phone_number
      ),
      reviews (
        id,
        rating,
        comment,
        cleanliness_rating,
        condition_rating,
        value_rating,
        communication_rating,
        created_at,
        reviewer:users!reviewer_id (
          id,
          full_name,
          profile_image_url
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    throw error
  }

  return vehicle
}

/**
 * Check if a vehicle is available for specific dates
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  const supabase = createClient()

  // Check for booking conflicts
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .in('status', ['confirmed', 'active'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (bookings && bookings.length > 0) {
    return false
  }

  // Check for blocked dates
  const { data: blockedDates } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (blockedDates && blockedDates.length > 0) {
    return false
  }

  // Check vehicle status
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('status, is_approved')
    .eq('id', vehicleId)
    .single()

  return vehicle?.status === 'available' && vehicle?.is_approved === true
}

/**
 * Get vehicle average rating
 */
export async function getVehicleRating(vehicleId: string): Promise<number> {
  const supabase = createClient()

  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('vehicle_id', vehicleId)
    .eq('is_approved', true)

  if (!data || data.length === 0) {
    return 0
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0)
  return Math.round((sum / data.length) * 10) / 10 // Round to 1 decimal
}

/**
 * Get featured vehicles (highest rated, most booked)
 */
export async function getFeaturedVehicles(limit: number = 6) {
  const supabase = createClient()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url
      )
    `)
    .eq('is_approved', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured vehicles:', error)
    throw error
  }

  return vehicles || []
}

/**
 * Get similar vehicles based on type and price range
 */
export async function getSimilarVehicles(
  vehicleId: string,
  type: string,
  pricePerDay: number,
  limit: number = 4
) {
  const supabase = createClient()

  // Get vehicles of same type with similar price (±30%)
  const minPrice = pricePerDay * 0.7
  const maxPrice = pricePerDay * 1.3

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url
      )
    `)
    .eq('type', type)
    .eq('is_approved', true)
    .eq('status', 'available')
    .neq('id', vehicleId)
    .gte('price_per_day', minPrice)
    .lte('price_per_day', maxPrice)
    .limit(limit)

  if (error) {
    console.error('Error fetching similar vehicles:', error)
    throw error
  }

  return vehicles || []
}
