import type { Database } from './database.types'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'

export interface BookingWithDetails extends Booking {
  vehicle: {
    id: string
    type: string
    make: string | null
    model: string | null
    plate_number: string
    image_urls: string[]
    owner_id: string
  }
  renter: {
    id: string
    full_name: string | null
    phone_number: string | null
    email: string
  }
  payment?: {
    id: string
    status: string
    payment_method: string
    amount: number
  }
}

export interface BookingRequest {
  vehicle_id: string
  start_date: string
  end_date: string
  pickup_time?: string
  special_requests?: string
}

export interface BookingConfirmation {
  booking: Booking
  payment_url?: string
  confirmation_code: string
}

