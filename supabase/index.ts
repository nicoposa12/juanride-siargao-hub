/**
 * Supabase Library - Central Export
 * All database operations organized by domain
 */

// Configuration & Clients
export * from './config/supabaseClient'
export * from './config/supabaseAdmin'

// Types
export * from './types'

// Queries (Read operations)
export * as VehicleQueries from './lib/queries/vehicles'
export * as BookingQueries from './lib/queries/bookings'
export * as ReviewQueries from './lib/queries/reviews'

// Mutations (Write operations)
export * as VehicleMutations from './lib/mutations/vehicles'
export * as BookingMutations from './lib/mutations/bookings'
export * as ReviewMutations from './lib/mutations/reviews'
export * as UserMutations from './lib/mutations/users'

// Utilities
export * as StorageUtils from './lib/storage'
export * as RealtimeUtils from './lib/realtime'
export * as DatabaseUtils from './lib/utils'

// Re-export commonly used items
export { supabase, createServerClient } from './config/supabaseClient'
export { supabaseAdmin } from './config/supabaseAdmin'
