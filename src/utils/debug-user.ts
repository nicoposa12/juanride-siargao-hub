// Debug utility to check user data
import { createClient } from '@/lib/supabase/client'

export async function debugUser(email: string) {
  const supabase = createClient()
  
  console.log('🔍 Debugging user:', email)
  
  // Check auth users
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth user:', user?.email, 'Error:', authError)
  
  // Check profile in database
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
    
  console.log('Profile data:', profile)
  console.log('Profile error:', profileError)
  
  return { user, profile, authError, profileError }
}

// Call this in browser console: debugUser('carlisteinhorejas@gmail.com')
if (typeof window !== 'undefined') {
  (window as any).debugUser = debugUser
}
