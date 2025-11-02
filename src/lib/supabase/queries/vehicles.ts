import { createClient } from '../client'
import { createServerClient } from '../server'
import type { VehicleFilters, VehicleWithDetails } from '@/types/vehicle.types'

export async function getVehicles(filters?: VehicleFilters) {
  const supabase = createClient()

  let query = supabase
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

  // Apply filters
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.location) {
    query = query.eq('location', filters.location)
  }

  if (filters?.minPrice) {
    query = query.gte('price_per_day', filters.minPrice)
  }

  if (filters?.maxPrice) {
    query = query.lte('price_per_day', filters.maxPrice)
  }

  if (filters?.searchQuery) {
    query = query.or(`make.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error

  // Filter out vehicles with conflicting bookings if dates provided
  if (filters?.startDate && filters?.endDate) {
    const availableVehicles = await Promise.all(
      (data || []).map(async (vehicle) => {
        const isAvailable = await checkVehicleAvailability(
          vehicle.id,
          filters.startDate!,
          filters.endDate!
        )
        return isAvailable ? vehicle : null
      })
    )
    return availableVehicles.filter(Boolean)
  }

  return data
}

export async function getVehicleById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url,
        phone_number,
        email
      ),
      reviews (
        id,
        rating,
        cleanliness_rating,
        condition_rating,
        value_rating,
        comment,
        image_urls,
        created_at,
        reviewer:users!reviewer_id (
          full_name,
          profile_image_url
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  // Calculate average rating
  const reviews = data.reviews || []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0

  return {
    ...data,
    average_rating: avgRating,
    total_reviews: reviews.length,
  } as VehicleWithDetails
}

export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  const supabase = createClient()

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .in('status', ['confirmed', 'active'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  return !conflicts || conflicts.length === 0
}

export async function getOwnerVehicles(ownerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      bookings (
        id,
        status,
        start_date,
        end_date
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createVehicle(vehicleData: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVehicle(id: string, updates: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVehicle(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getFeaturedVehicles(limit: number = 6) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name
      ),
      reviews (
        rating
      )
    `)
    .eq('is_approved', true)
    .eq('status', 'available')
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

