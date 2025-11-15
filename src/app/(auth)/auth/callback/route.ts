import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const error = requestUrl.searchParams.get('error')
  const type = requestUrl.searchParams.get('type')

  console.log('Auth callback called with:', { code: !!code, error, type, next })

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/login?error=session_exchange_failed', request.url))
      }

      if (data.session) {
        console.log('Session created successfully for user:', data.session.user.id)
        
        // If next parameter indicates password reset, redirect there
        if (next.includes('/reset-password') || type === 'recovery') {
          console.log('Redirecting to reset password page')
          return NextResponse.redirect(new URL('/reset-password', request.url))
        }
        
        // Otherwise redirect to specified next page
        return NextResponse.redirect(new URL(next, request.url))
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/login?error=callback_exception', request.url))
    }
  }

  // No code provided, redirect to login
  console.log('No code provided, redirecting to login')
  return NextResponse.redirect(new URL('/login', request.url))
}
