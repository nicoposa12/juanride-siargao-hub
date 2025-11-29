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
import { Mail, Lock, LogIn, AlertCircle, Clock, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithGoogle, signOut, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check for auth status messages
  useEffect(() => {
    const message = searchParams?.get('message')
    if (message) {
      // Decode the URL-encoded message
      const decodedMessage = decodeURIComponent(message.replace(/\+/g, ' '))
      
      // Determine the type of message
      let title = 'Notice'
      let variant: 'default' | 'destructive' = 'default'
      
      if (decodedMessage.includes('deactivated')) {
        title = 'Account Deactivated'
        variant = 'destructive'
      } else if (decodedMessage.includes('pending verification') || decodedMessage.includes('pending approval')) {
        title = 'Account Pending Approval'
        variant = 'default'
      } else if (decodedMessage.includes('rejected')) {
        title = 'Account Rejected'
        variant = 'destructive'
      } else if (decodedMessage.includes('suspended')) {
        title = 'Account Suspended'
        variant = 'destructive'
      }
      
      toast({
        title,
        description: decodedMessage,
        variant,
        duration: 8000, // Show longer for important messages
      })
    }
  }, [searchParams, toast])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('🔐 Starting login...')

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
        // Manually fetch profile to ensure we have it
        console.log('📥 Fetching profile from database...')
        const supabase = createClient()
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError)
          console.error('Error details:', JSON.stringify(profileError, null, 2))
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
            description: 'Your account exists but profile is missing. Please run the sync script.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        console.log('✅ Profile loaded:', userProfile.email, '- Role:', userProfile.role)

        // Check if this is an admin user - block with generic error
        if (userProfile.role === 'admin') {
          console.log('⚠️ Admin detected - blocking login')
          toast({
            title: 'Login Failed',
            description: 'Invalid credentials or access denied.',
            variant: 'destructive',
          })
          // Sign out admin users
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Check if account is rejected - redirect to resubmission
        if (userProfile.account_verification_status === 'rejected') {
          console.log('❌ Account rejected - redirecting to resubmission page')
          toast({
            title: 'Account Rejected',
            description: 'Your account documents have been rejected by the admin. Please review and resubmit the required documents.',
            variant: 'destructive',
          })
          // Keep user authenticated so they can resubmit
          setTimeout(() => {
            router.push('/resubmit')
          }, 1500)
          return
        }

        // Check if account is pending verification
        if (userProfile.account_verification_status === 'pending_verification') {
          console.log('⏳ Account pending verification')
          toast({
            title: 'Account Pending Approval',
            description: 'Your account is pending verification. Please wait for admin approval.',
            variant: 'default',
          })
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Profile loaded successfully - check if this is a new user
        const isNewUser = userProfile.created_at ? 
          new Date(userProfile.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000) : // Within last 24 hours
          false
        
        toast({
          title: isNewUser ? 'Welcome to JuanRide! 🎉' : 'Welcome back!',
          description: isNewUser ? 
            `Your ${userProfile.role} account is ready to go!` :
            `Logged in as ${userProfile.role}`,
        })

        // Check for redirect parameter first
        const redirectParam = searchParams?.get('redirect') ?? null
        
        // Determine redirect path based on role (admin already filtered out above)
        let redirectPath: string
        if (redirectParam) {
          // Respect explicit redirect parameter
          redirectPath = redirectParam
        } else {
          // Role-based dashboard redirect for owner and renter
          if (userProfile.role === 'owner') {
            redirectPath = '/owner/dashboard'
          } else if (userProfile.role === 'renter') {
            redirectPath = '/vehicles' // Browse vehicles page
          } else {
            // Pending or unknown role - default to vehicles
            redirectPath = '/vehicles'
          }
        }
        
        console.log('🚀 Redirecting to:', redirectPath)
        
        // Use router.push instead of window.location to preserve client-side state
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        // Google login success will be handled by auth callback
        // The redirect will be handled by middleware or auth callback
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your JuanRide account
          </CardDescription>
          {searchParams?.get('message') && (() => {
            const message = decodeURIComponent(searchParams.get('message')!.replace(/\+/g, ' '))
            
            // Determine alert style based on message type
            let bgColor = 'bg-blue-50'
            let borderColor = 'border-blue-200'
            let textColor = 'text-blue-800'
            let iconColor = 'text-blue-600'
            let Icon = AlertCircle
            let title = 'Notice'
            
            if (message.includes('pending')) {
              bgColor = 'bg-yellow-50'
              borderColor = 'border-yellow-200'
              textColor = 'text-yellow-800'
              iconColor = 'text-yellow-600'
              Icon = Clock
              title = 'Account Pending Approval'
            } else if (message.includes('rejected')) {
              bgColor = 'bg-red-50'
              borderColor = 'border-red-200'
              textColor = 'text-red-800'
              iconColor = 'text-red-600'
              Icon = XCircle
              title = 'Account Rejected'
            } else if (message.includes('suspended') || message.includes('deactivated')) {
              bgColor = 'bg-red-50'
              borderColor = 'border-red-200'
              textColor = 'text-red-800'
              iconColor = 'text-red-600'
              Icon = AlertCircle
              title = message.includes('suspended') ? 'Account Suspended' : 'Account Deactivated'
            }
            
            return (
              <div className={`${bgColor} border ${borderColor} rounded-md p-3 mt-4`}>
                <div className="flex items-start space-x-2">
                  <Icon className={`h-4 w-4 ${iconColor} mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-sm ${textColor} font-medium`}>
                      {title}
                    </p>
                    <p className={`text-xs ${textColor} mt-1 opacity-90`}>
                      {message}
                    </p>
                    {message.includes('pending') && (
                      <p className={`text-xs ${textColor} mt-2 opacity-75`}>
                        You'll receive an email notification once your account is approved. This usually takes 24-48 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
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
                  Sign In
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

