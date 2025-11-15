'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck, User as UserIcon, Phone } from 'lucide-react'

const roleOptions: { value: 'renter' | 'owner'; label: string; description: string }[] = [
  {
    value: 'renter',
    label: 'Rent vehicles (Renter)',
    description: 'Browse, book, and manage rentals as a customer.',
  },
  {
    value: 'owner',
    label: 'List my vehicles (Owner)',
    description: 'Publish vehicles, manage bookings, and track earnings.',
  },
]

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'renter' | 'owner'>('renter')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nextParam = useMemo(() => {
    const params = searchParams ?? new URLSearchParams()
    const value = params.get('next')
    if (!value || !value.startsWith('/') || value === '/onboarding') {
      return null
    }
    return value
  }, [searchParams])

  // Prefill fields when profile data becomes available
  useEffect(() => {
    if (!profile) return

    setFullName(profile.full_name ?? '')
    setPhoneNumber(profile.phone_number ?? '')
    if (profile.role === 'owner' || profile.role === 'renter') {
      setRole(profile.role)
    }
  }, [profile])

  // Fallback to auth metadata before profile loads
  useEffect(() => {
    if (profile) return

    if (user?.user_metadata?.full_name) {
      setFullName((prev) => prev || (user.user_metadata!.full_name as string))
    }
    if (user?.user_metadata?.phone_number) {
      setPhoneNumber((prev) => prev || (user.user_metadata!.phone_number as string))
    }
  }, [profile, user])

  // Redirect logic for already onboarded users
  useEffect(() => {
    if (loading) return

    if (!user) {
      return
    }

    if (profile && !profile.needs_onboarding && profile.role !== 'pending') {
      const defaultDestination = profile.role === 'admin'
        ? '/admin/dashboard'
        : profile.role === 'owner'
          ? '/owner/dashboard'
          : '/vehicles'
      const destination = nextParam ?? defaultDestination
      router.replace(destination)
    }
  }, [loading, profile, router, user, nextParam])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: 'Session not ready',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      })
      return
    }

    const trimmedName = fullName.trim()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedName) {
      toast({
        title: 'Full name required',
        description: 'Please provide your full name to continue.',
        variant: 'destructive',
      })
      return
    }

    if (!trimmedPhone) {
      toast({
        title: 'Phone number required',
        description: 'Please provide a phone number so we can reach you about bookings.',
        variant: 'destructive',
      })
      return
    }

    if (password && password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters if provided.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: trimmedName,
          phone_number: trimmedPhone,
          role,
          needs_onboarding: false,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      const authUpdates: {
        password?: string
        data?: Record<string, string>
      } = {
        data: {
          full_name: trimmedName,
          phone_number: trimmedPhone,
        },
      }

      if (password) {
        authUpdates.password = password
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdates)
      if (authError) {
        throw authError
      }

      await refreshProfile()

      toast({
        title: 'Profile updated',
        description: role === 'owner'
          ? 'Your owner dashboard is ready!'
          : 'You can now browse and book vehicles.',
      })

      const fallbackDestination = role === 'owner'
        ? '/owner/dashboard'
        : '/vehicles'
      const destination = nextParam ?? fallbackDestination

      router.replace(destination)
    } catch (error) {
      console.error('Onboarding error:', error)
      toast({
        title: 'Could not complete onboarding',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const showLoader = loading || submitting

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Complete your profile</CardTitle>
          <CardDescription>
            We use this information to personalize your JuanRide experience.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We’ll use this to coordinate rentals and verify ownership details.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Choose your role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'renter' | 'owner')}>
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start space-x-3 rounded-lg border p-4 hover:border-primary cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Set a password (optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password to enable email login"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Add a password to log in without Google in the future (optional).
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={showLoader}>
              {showLoader ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving your profile...
                </>
              ) : (
                'Finish onboarding'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              You can update these details anytime from your profile page.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
