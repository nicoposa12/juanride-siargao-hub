import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const sanitizeNext = (value: string | null, fallback: string): string => {
  if (!value) return fallback
  try {
    const url = new URL(value, 'http://localhost')
    if (!value.startsWith('/')) return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next')
  const next = sanitizeNext(rawNext, '/vehicles')
  const error = requestUrl.searchParams.get('error')
  const type = requestUrl.searchParams.get('type')

  console.log('Auth callback called with:', { code: !!code, error, type, next })

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/login?error=session_exchange_failed', request.url))
      }

      if (data.session) {
        const userId = data.session.user.id
        console.log('Session created successfully for user:', userId)

        if (next.includes('/reset-password') || type === 'recovery') {
          console.log('Redirecting to reset password page')
          return NextResponse.redirect(new URL('/reset-password', request.url))
        }

        try {
          const { data: profile } = await supabase
            .from('users')
            .select('role, needs_onboarding')
            .eq('id', userId)
            .single()

          const requiresOnboarding = profile?.needs_onboarding || profile?.role === 'pending'

          if (requiresOnboarding) {
            const onboardingUrl = new URL('/onboarding', request.url)
            onboardingUrl.searchParams.set('next', next)
            console.log('User requires onboarding, redirecting to:', onboardingUrl.toString())
            return NextResponse.redirect(onboardingUrl)
          }

          // If no explicit redirect param, use role-based redirect
          if (next === '/vehicles' && profile?.role) {
            let roleBasedRedirect: string
            if (profile.role === 'admin') {
              roleBasedRedirect = '/admin/dashboard'
            } else if (profile.role === 'owner') {
              roleBasedRedirect = '/owner/dashboard'
            } else if (profile.role === 'renter') {
              roleBasedRedirect = '/vehicles' // Browse vehicles page
            } else {
              roleBasedRedirect = next // Keep default for pending/unknown
            }
            console.log('Role-based redirect:', profile.role, '→', roleBasedRedirect)
            return NextResponse.redirect(new URL(roleBasedRedirect, request.url))
          }
        } catch (profileError) {
          console.warn('Unable to fetch profile during callback:', profileError)
          // If we cannot confirm onboarding state, fall back to next
        }

        return NextResponse.redirect(new URL(next, request.url))
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/login?error=callback_exception', request.url))
    }
  }

  console.log('No code provided, redirecting to login')
  return NextResponse.redirect(new URL('/login', request.url))
}
