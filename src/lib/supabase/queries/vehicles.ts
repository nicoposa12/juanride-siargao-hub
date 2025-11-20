import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { VehicleFilters as UiVehicleFilters } from '@/types/vehicle.types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']
type VehicleWithOwner = Vehicle & {
  owner: {
    id: string
    full_name: string | null
    profile_image_url: string | null
  } | null
}

export interface VehicleQueryFilters {
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
  filters: VehicleQueryFilters = {},
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
    .eq('approval_status', 'approved')
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

  // Fetch stats for all vehicles
  let vehiclesWithStats = vehicles || []
  
  if (vehicles && vehicles.length > 0) {
    const vehicleIds = vehicles.map(v => v.id)
    
    const { data: stats, error: statsError } = await supabase
      .from('vehicle_stats')
      .select('*')
      .in('vehicle_id', vehicleIds)
    
    if (!statsError && stats) {
      // Merge stats with vehicles
      vehiclesWithStats = vehicles.map(vehicle => {
        const vehicleStats = stats.find(s => s.vehicle_id === vehicle.id)
        return {
          ...vehicle,
          stats: vehicleStats || {
            vehicle_id: vehicle.id,
            average_rating: 0,
            total_reviews: 0,
            total_bookings: 0,
            all_bookings_count: 0
          }
        }
      })
    }
  }

  // If date filters are provided, check availability
  let availableVehicles = vehiclesWithStats
  
  if (filters.startDate && filters.endDate) {
    availableVehicles = await filterByAvailability(
      vehiclesWithStats,
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
 * Normalize UI filters into the supabase query format
 */
function normalizeVehicleFilters(filters?: UiVehicleFilters): VehicleQueryFilters {
  const normalized: VehicleQueryFilters = {}

  if (!filters) {
    return normalized
  }

  if (filters.type) {
    normalized.type = Array.isArray(filters.type) ? filters.type : [filters.type]
  }
  if (typeof filters.minPrice === 'number') {
    normalized.minPrice = filters.minPrice
  }
  if (typeof filters.maxPrice === 'number') {
    normalized.maxPrice = filters.maxPrice
  }
  if (filters.location) {
    normalized.location = filters.location
  }
  if (filters.startDate) {
    normalized.startDate = filters.startDate
  }
  if (filters.endDate) {
    normalized.endDate = filters.endDate
  }
  if (filters.searchQuery) {
    normalized.searchQuery = filters.searchQuery
  }

  return normalized
}

/**
 * Simple vehicle fetcher used by legacy hooks
 */
export async function getVehicles(filters?: UiVehicleFilters) {
  const normalizedFilters = normalizeVehicleFilters(filters)
  const result = await searchVehicles(normalizedFilters, 1, 50)
  return result.vehicles
}

/**
 * Create a vehicle listing
 */
export async function createVehicle(payload: VehicleInsert) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating vehicle:', error)
    throw error
  }

  return data
}

/**
 * Update a vehicle listing
 */
export async function updateVehicle(id: string, updates: VehicleUpdate) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle:', error)
    throw error
  }

  return data
}

/**
 * Delete a vehicle listing
 */
export async function deleteVehicle(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from('vehicles').delete().eq('id', id)

  if (error) {
    console.error('Error deleting vehicle:', error)
    throw error
  }

  return true
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
    .eq('approval_status', 'approved')
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
    .eq('approval_status', 'approved')
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

/**
 * Update vehicle status (owner only)
 */
export async function updateVehicleStatus(
  vehicleId: string, 
  status: 'available' | 'inactive' | 'maintenance' | 'rented'
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle status:', error)
    throw error
  }

  return data
}

/**
 * Get vehicle status options for UI
 */
export const VEHICLE_STATUS_OPTIONS = [
  { value: 'available', label: 'Available', description: 'Ready for bookings' },
  { value: 'inactive', label: 'Unavailable', description: 'Not available for bookings' },
  { value: 'maintenance', label: 'Under Maintenance', description: 'Being serviced or repaired' },
] as const

export type VehicleStatus = 'available' | 'inactive' | 'maintenance' | 'rented'
