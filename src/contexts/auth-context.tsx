'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient, resetClient } from '@/lib/supabase/client'
import type { User as UserProfile } from '@/types/user.types'
import { roleCacheManager } from '@/lib/cache/role-cache'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, fullName: string, role: 'renter' | 'owner') => Promise<{ data: any; error: any }>
  signInWithGoogle: () => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
  updatePassword: (newPassword: string) => Promise<{ data: any; error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Enhanced cache key for profile data
const PROFILE_CACHE_PREFIX = 'profile_cache_'

interface ProfileCacheEntry {
  profile: UserProfile
  timestamp: number
  expiresAt: number
}

// Profile cache utilities
const profileCache = {
  get: (userId: string): UserProfile | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_PREFIX + userId)
      if (!cached) return null
      
      const entry: ProfileCacheEntry = JSON.parse(cached)
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(PROFILE_CACHE_PREFIX + userId)
        return null
      }
      
      return entry.profile
    } catch {
      return null
    }
  },
  
  set: (userId: string, profile: UserProfile): void => {
    if (typeof window === 'undefined') return
    
    try {
      const entry: ProfileCacheEntry = {
        profile,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      }
      sessionStorage.setItem(PROFILE_CACHE_PREFIX + userId, JSON.stringify(entry))
      
      // Also cache the role separately for middleware
      roleCacheManager.setRole(userId, profile.role)
    } catch {
      // Ignore storage errors
    }
  },
  
  clear: (userId?: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      if (userId) {
        sessionStorage.removeItem(PROFILE_CACHE_PREFIX + userId)
        roleCacheManager.invalidateUser(userId)
      } else {
        // Clear all profile cache entries
        const keys: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && key.startsWith(PROFILE_CACHE_PREFIX)) {
            keys.push(key)
          }
        }
        keys.forEach(key => sessionStorage.removeItem(key))
        roleCacheManager.clearAll()
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log('👤 Loading profile for user:', userId)
    
    // Check cache first
    const cachedProfile = profileCache.get(userId)
    if (cachedProfile) {
      console.log('✅ Profile loaded from cache:', cachedProfile.email, 'Role:', cachedProfile.role)
      setProfile(cachedProfile)
      return cachedProfile
    }
    
    // Add timeout to detect hanging queries
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout after 10 seconds')), 10000)
    )
    
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    try {
      console.log('🔍 Executing profile query...')
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      console.log('📊 Query result received:', { data: !!data, error: !!error })
      
      if (error) {
        console.error('❌ Error loading profile:', error)
        
        // LAYER 3: If profile doesn't exist, try to create it as a recovery mechanism
        if (error.code === 'PGRST116') {
          console.warn('⚠️  Profile not found for user. Attempting recovery...')
          await createMissingProfile(userId)
          // Retry loading profile
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (retryError) {
            console.error('❌ Retry failed:', retryError)
            throw retryError
          }
          console.log('✅ Profile created and loaded:', retryData)
          
          // Cache the new profile
          profileCache.set(userId, retryData)
          setProfile(retryData)
          return retryData
        }
        throw error
      }
      
      console.log('✅ Profile loaded successfully:', data.email, '- Role:', data.role)
      console.log('🔍 Full profile data:', JSON.stringify(data, null, 2))
      
      // Cache the profile
      profileCache.set(userId, data)
      setProfile(data)
      return data
    } catch (error: any) {
      console.error('💥 Fatal error loading profile:', error)
      setProfile(null)
      return null
    }
  }, [supabase])

  const createMissingProfile = async (userId: string) => {
    try {
      // Get user details from auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ Cannot create profile: No authenticated user')
        return
      }

      const fullName = user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 
                       'User'
      const role = user.user_metadata?.role || 'renter'

      console.log('🔧 Creating missing profile for:', user.email)

      const { error } = await supabase.from('users').insert({
        id: userId,
        email: user.email!,
        full_name: fullName,
        role: role as 'renter' | 'owner' | 'admin',
        is_active: true,
        is_verified: false,
      })

      if (error) {
        console.error('❌ Failed to create profile:', error)
        throw error
      }

      console.log('✅ Profile created successfully!')
    } catch (err) {
      console.error('💥 Error in createMissingProfile:', err)
      throw err
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      // Clear cache first
      profileCache.clear(user.id)
      await loadProfile(user.id)
    }
  }, [user, loadProfile])

  useEffect(() => {
    console.log('🔐 AuthProvider initializing...')
    
    // Get initial session
    const getSession = async () => {
      console.log('📡 Fetching initial session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session result:', session ? 'Found' : 'None', session?.user?.email)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('✅ Session found, loading profile for:', session.user.id)
        await loadProfile(session.user.id)
      } else {
        console.log('❌ No session, setting loading to false')
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    console.log('👂 Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('✅ Session user found, loading profile for:', session.user.id)
          await loadProfile(session.user.id)
        } else {
          console.log('❌ No session user, clearing profile')
          setProfile(null)
          profileCache.clear() // Clear all cache on signout
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [loadProfile])

  useEffect(() => {
    // Set loading to false once we have processed the auth state
    if (user === null || profile !== null) {
      setLoading(false)
    }
  }, [user, profile])

  const signIn = async (email: string, password: string, retryCount = 0) => {
    try {
      // Check if environment variables are set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase environment variables missing!')
        return {
          data: { user: null, session: null },
          error: {
            message: 'Supabase configuration missing. Please create a .env.local file with your Supabase credentials.'
          } as any
        }
      }
      
      console.log(`🔑 AuthProvider.signIn: Attempt ${retryCount + 1} - Calling Supabase auth.signInWithPassword...`)
      
      // CRITICAL FIX: Check for existing session and sign out first
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        console.log('⚠️  Existing session detected, signing out first...')
        await supabase.auth.signOut()
        // Wait a bit for the signout to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Increase timeout to 60 seconds for slow auth endpoints
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout after 60 seconds. Please check:\n1. Your Supabase project is active\n2. The URL in .env.local is correct\n3. Your internet connection\n4. Try again in a few moments')), 60000)
      )
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any
      
      console.log('🔑 AuthProvider.signIn: Response received', { 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      })
      
      return { data, error }
    } catch (err) {
      console.error('🔑 AuthProvider.signIn: Caught error:', err)
      
      // Retry logic for timeout errors (max 2 retries)
      if (err instanceof Error && err.message.includes('timeout') && retryCount < 2) {
        console.log(`🔄 Retrying login (attempt ${retryCount + 2}/3)...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        return signIn(email, password, retryCount + 1)
      }
      
      return { 
        data: { user: null, session: null }, 
        error: { message: err instanceof Error ? err.message : 'Unknown error' } as any 
      }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'renter' | 'owner') => {
    console.log('🚀 Starting signup process for:', email)
    
    // Sign up with Supabase Auth
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

    if (error) {
      console.error('❌ Signup error:', error)
      return { data, error }
    }

    if (!data.user) {
      console.error('❌ No user data returned from signup')
      return { data, error: { message: 'No user data returned' } as any }
    }

    console.log('✅ Auth user created:', data.user.id)

    // LAYER 2: Application-level profile creation as fallback
    try {
      console.log('📝 Creating user profile in database...')
      
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role,
        is_active: true,
        is_verified: false,
      })
      
      if (insertError) {
        // Check if error is due to duplicate (trigger already created it)
        if (insertError.code === '23505') {
          console.log('✅ Profile already exists (created by trigger)')
        } else {
          console.error('⚠️  Error creating user profile:', insertError)
          // Don't fail the signup - Layer 3 (login recovery) will handle this
        }
      } else {
        console.log('✅ User profile created successfully')
        
        // Send welcome email
        try {
          console.log('📧 Sending welcome email...')
          const welcomeResult = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome',
              data: {
                userEmail: data.user.email,
                userName: fullName,
                role,
              },
            }),
          })
          
          if (welcomeResult.ok) {
            console.log('✅ Welcome email sent successfully')
          } else {
            console.warn('⚠️ Welcome email failed to send, but signup completed')
          }
        } catch (emailErr) {
          console.warn('⚠️ Welcome email error:', emailErr)
          // Don't fail signup for email issues
        }
      }
    } catch (insertErr) {
      console.error('💥 Exception creating profile:', insertErr)
      // Don't fail the signup - user is created in auth, login recovery will fix it
    }

    return { data, error: null }
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
    try {
      console.log('🚪 Signing out...')
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      profileCache.clear()
      
      // Reset the Supabase client to ensure clean state
      resetClient()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Signout error:', error)
        return { error }
      }
      
      console.log('✅ Signed out successfully')
      return { error: null }
    } catch (err) {
      console.error('💥 Signout exception:', err)
      return { error: err as any }
    }
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

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
