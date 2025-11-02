import type { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type UserRole = 'renter' | 'owner' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface UserProfile extends User {
  total_bookings?: number
  total_listings?: number
  average_rating?: number
}

export interface OwnerStats {
  total_vehicles: number
  active_bookings: number
  total_revenue: number
  pending_payouts: number
  average_rating: number
}

export interface RenterStats {
  total_bookings: number
  completed_rentals: number
  favorite_vehicles: number
  pending_reviews: number
}

