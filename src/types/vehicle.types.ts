import type { Database } from './database.types'

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type VehicleType = 'scooter' | 'motorcycle' | 'car' | 'van'
export type VehicleStatus = 'available' | 'unavailable' | 'maintenance'

export interface VehicleWithOwner extends Vehicle {
  owner: {
    id: string
    full_name: string | null
    profile_image_url: string | null
  }
}

export interface VehicleWithDetails extends VehicleWithOwner {
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    created_at: string
    reviewer: {
      full_name: string | null
    }
  }>
  average_rating: number
  total_reviews: number
}

export interface VehicleFilters {
  type?: VehicleType | VehicleType[]
  minPrice?: number
  maxPrice?: number
  location?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export interface VehicleFeatures {
  helmet_included?: boolean
  lock_included?: boolean
  phone_holder?: boolean
  waterproof_bag?: boolean
  spare_tire?: boolean
  toolkit?: boolean
  gps_tracking?: boolean
  [key: string]: boolean | undefined
}

