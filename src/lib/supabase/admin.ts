import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase admin environment variables are not configured')
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

export const getSupabaseAdmin = () => admin
