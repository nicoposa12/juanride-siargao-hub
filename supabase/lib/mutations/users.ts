/**
 * User Mutations
 * Write operations for user profile management
 */

import { supabase } from '@/supabase/config/supabaseClient'
import type { Database } from '@/supabase/types/database.types'

type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    phone_number?: string
    date_of_birth?: string
    address?: string
    profile_image_url?: string
  }
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

/**
 * Update user email (requires re-authentication)
 */
export async function updateUserEmail(newEmail: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    console.error('Error updating email:', error)
    throw error
  }

  return data
}

/**
 * Update user password
 */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('Error updating password:', error)
    throw error
  }

  return data
}

/**
 * Request email verification
 * Note: User must be logged in to resend verification
 */
export async function requestEmailVerification(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  })

  if (error) {
    console.error('Error requesting email verification:', error)
    throw error
  }

  return true
}

/**
 * Deactivate user account
 */
export async function deactivateAccount(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error deactivating account:', error)
    throw error
  }

  return data
}

/**
 * Reactivate user account
 */
export async function reactivateAccount(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error reactivating account:', error)
    throw error
  }

  return data
}

/**
 * Mark user as verified (typically done after ID verification)
 */
export async function markUserAsVerified(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error marking user as verified:', error)
    throw error
  }

  return data
}
