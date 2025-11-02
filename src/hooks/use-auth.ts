'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { User as UserProfile } from '@/types/user.types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Check if environment variables are set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase environment variables missing!')
        console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'MISSING')
        console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING')
        return {
          data: { user: null, session: null },
          error: {
            message: 'Supabase configuration missing. Please create a .env.local file with your Supabase credentials.'
          } as any
        }
      }
      
      console.log('🔑 useAuth.signIn: Calling Supabase auth.signInWithPassword...')
      console.log('🔗 Supabase URL:', supabaseUrl)
      
      // Increase timeout to 30 seconds for slow connections
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout after 30 seconds. Please check:\n1. Your Supabase project is active\n2. The URL in .env.local is correct\n3. Your internet connection')), 30000)
      )
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any
      
      console.log('🔑 useAuth.signIn: Response received', { 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      })
      
      return { data, error }
    } catch (err) {
      console.error('🔑 useAuth.signIn: Caught error:', err)
      return { 
        data: { user: null, session: null }, 
        error: { message: err instanceof Error ? err.message : 'Unknown error' } as any 
      }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'renter' | 'owner') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    // TEMPORARY: Manual insert until we fix the trigger
    if (data.user && !error) {
      try {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role,
        })
        
        if (insertError) {
          console.error('Error creating user profile:', insertError)
          // Don't throw - user is created in auth, they can try logging in
        }
      } catch (insertErr) {
        console.error('Failed to create profile:', insertErr)
      }
    }

    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }
}

