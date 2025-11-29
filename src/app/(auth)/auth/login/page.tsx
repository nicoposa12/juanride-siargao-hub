'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, LogIn, Shield, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check for auth status messages
  useEffect(() => {
    const message = searchParams?.get('message')
    if (message) {
      const decodedMessage = decodeURIComponent(message.replace(/\+/g, ' '))
      
      let title = 'Notice'
      let variant: 'default' | 'destructive' = 'default'
      
      if (decodedMessage.includes('unauthorized') || decodedMessage.includes('access denied')) {
        title = 'Access Denied'
        variant = 'destructive'
      } else if (decodedMessage.includes('session expired')) {
        title = 'Session Expired'
        variant = 'default'
      }
      
      toast({
        title,
        description: decodedMessage,
        variant,
        duration: 8000,
      })
    }
  }, [searchParams, toast])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('🔐 Admin login attempt...')

    try {
      console.log('📧 Signing in with email:', email)
      const { data, error } = await signIn(email, password)

      if (error) {
        console.error('❌ Sign in error:', error)
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      console.log('✅ Sign in successful, user ID:', data?.user?.id)

      if (data?.user) {
        // Fetch profile to verify admin role
        console.log('📥 Fetching profile from database...')
        const supabase = createClient()
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError)
          toast({
            title: 'Profile Error',
            description: `Database error: ${profileError.message || 'Could not fetch profile'}`,
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        if (!userProfile) {
          console.error('❌ Profile is null/undefined')
          toast({
            title: 'Profile Missing',
            description: 'Your account exists but profile is missing.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        console.log('✅ Profile loaded:', userProfile.email, '- Role:', userProfile.role)

        // Verify this is an admin account
        if (userProfile.role !== 'admin') {
          console.error('❌ Not an admin account')
          toast({
            title: 'Login Failed',
            description: 'Invalid credentials or access denied.',
            variant: 'destructive',
          })
          // Sign out non-admin users
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
        
        toast({
          title: 'Welcome Administrator! 🎉',
          description: 'Successfully logged in to admin panel.',
        })

        // Check for redirect parameter first
        const redirectParam = searchParams?.get('redirect') ?? null
        
        // Admin always goes to admin dashboard
        const redirectPath = redirectParam || '/admin/dashboard'
        
        console.log('🚀 Redirecting to:', redirectPath)
        
        setTimeout(() => {
          router.push(redirectPath)
        }, 500)
      } else {
        console.error('❌ No user data returned')
        toast({
          title: 'Login Failed',
          description: 'No user data received from server.',
          variant: 'destructive',
        })
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Unexpected login error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white">Admin Portal</CardTitle>
          <CardDescription className="text-center text-slate-300">
            Sign in to access the JuanRide admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@juanride.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In as Admin
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full border-t border-slate-700" />
        </CardFooter>
      </Card>
    </div>
  )
}
