/**
 * Supabase Client Configuration
 * Singleton pattern for browser and server-side client instances
 */

import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/supabase/types/database.types'

// ============================================================================
// Browser Client (Client Components)
// ============================================================================

let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Get Supabase client for browser/client components
 * Uses singleton pattern to prevent recreation on every hook call
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/supabase/config/supabaseClient'
 * const { data } = await supabase.from('vehicles').select('*')
 * ```
 */
export const supabase = (() => {
  if (browserClient) {
    return browserClient
  }

  browserClient = createClientComponentClient<Database>()

  return browserClient
})()

/**
 * Convenience function for getting the client (same as supabase export)
 */
export function createClient() {
  return supabase
}

/**
 * Reset browser client (useful for testing or auth state changes)
 */
export const resetClient = () => {
  browserClient = null
}

// ============================================================================
// Server Client (Server Components, API Routes, Server Actions)
// ============================================================================

/**
 * Create Supabase client for server-side operations
 * Must be called within server components or API routes
 * 
 * @example
 * ```typescript
 * import { createServerClient } from '@/supabase/config/supabaseClient'
 * 
 * export async function ServerComponent() {
 *   const supabase = createServerClient()
 *   const { data } = await supabase.from('vehicles').select('*')
 *   return <div>{data}</div>
 * }
 * ```
 */
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}

// ============================================================================
// Exports
// ============================================================================

export type SupabaseClient = typeof supabase
