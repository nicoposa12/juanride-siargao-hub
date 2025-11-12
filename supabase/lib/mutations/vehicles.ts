/**
 * Vehicle Mutations
 * Write operations for vehicle management
 */

import { supabase } from '@/supabase/config/supabaseClient'
import type { Database } from '@/supabase/types/database.types'

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

/**
 * Create a new vehicle listing
 */
export async function createVehicle(payload: VehicleInsert) {
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
 * Update an existing vehicle listing
 */
export async function updateVehicle(id: string, updates: VehicleUpdate) {
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
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vehicle:', error)
    throw error
  }

  return true
}

/**
 * Update vehicle status
 */
export async function updateVehicleStatus(
  id: string,
  status: 'available' | 'rented' | 'maintenance' | 'inactive'
) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle status:', error)
    throw error
  }

  return data
}

/**
 * Add blocked dates for a vehicle
 */
export async function addBlockedDates(
  vehicleId: string,
  startDate: string,
  endDate: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('blocked_dates')
    .insert({
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
      reason,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding blocked dates:', error)
    throw error
  }

  return data
}

/**
 * Remove blocked dates
 */
export async function removeBlockedDates(blockedDateId: string) {
  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('id', blockedDateId)

  if (error) {
    console.error('Error removing blocked dates:', error)
    throw error
  }

  return true
}

/**
 * Add vehicle to favorites
 */
export async function addToFavorites(userId: string, vehicleId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      vehicle_id: vehicleId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to favorites:', error)
    throw error
  }

  return data
}

/**
 * Remove vehicle from favorites
 */
export async function removeFromFavorites(userId: string, vehicleId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)

  if (error) {
    console.error('Error removing from favorites:', error)
    throw error
  }

  return true
}

/**
 * Add maintenance log for a vehicle
 */
export async function addMaintenanceLog(
  vehicleId: string,
  description: string,
  cost: number,
  performedAt: string
) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({
      vehicle_id: vehicleId,
      description,
      cost,
      performed_at: performedAt,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding maintenance log:', error)
    throw error
  }

  return data
}

/**
 * Update maintenance log
 */
export async function updateMaintenanceLog(
  logId: string,
  updates: {
    description?: string
    cost?: number
    performed_at?: string
  }
) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .select()
    .single()

  if (error) {
    console.error('Error updating maintenance log:', error)
    throw error
  }

  return data
}

/**
 * Delete maintenance log
 */
export async function deleteMaintenanceLog(logId: string) {
  const { error } = await supabase
    .from('maintenance_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    console.error('Error deleting maintenance log:', error)
    throw error
  }

  return true
}
