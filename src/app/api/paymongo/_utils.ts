import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database.types'
import { UnauthorizedError } from '@/lib/paymongo/errors'

export interface AuthContext {
  supabase: SupabaseClient<Database>
  user: User
}

export async function requireUser(): Promise<AuthContext> {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError()
  }

  return { supabase, user }
}
