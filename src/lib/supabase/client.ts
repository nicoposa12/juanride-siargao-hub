import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

// Singleton pattern for Supabase client to prevent recreation on every hook call
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createClient = () => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Create new client and cache it
  supabaseClient = createClientComponentClient<Database>()
  return supabaseClient
}

// Function to reset client (useful for testing or auth state changes)
export const resetClient = () => {
  supabaseClient = null
}

