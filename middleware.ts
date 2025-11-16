import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { getCachedUserRole } from '@/lib/cache/role-cache'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback', '/vehicles', '/checkout', '/booking-confirmation']
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith('/vehicles/') || path.startsWith('/checkout') || path.startsWith('/booking-confirmation'))

  // Protected renter routes (any authenticated user) - but exclude booking-specific routes that have their own access control
  const renterRoutes = ['/dashboard', '/messages', '/profile']
  const isRenterRoute = renterRoutes.some(route => path.startsWith(route)) && !path.startsWith('/dashboard/bookings/')

  // Owner-only routes
  const isOwnerRoute = path.startsWith('/owner')

  // Admin-only routes
  const isAdminRoute = path.startsWith('/admin')

  // Booking-specific routes that need authentication but have their own access control
  const isBookingRoute = path.startsWith('/dashboard/bookings/')

  // Onboarding routes
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Redirect to login if accessing protected route without session
  if (!session && (isRenterRoute || isOwnerRoute || isAdminRoute || isBookingRoute || isOnboardingRoute)) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated, check role-based access
  if (session) {
    let userRole = await getCachedUserRole(supabase, session.user.id)
    console.log('🔐 Middleware - User role detected:', userRole, 'for user:', session.user.email)
    let needsOnboarding = false

    // CRITICAL FIX: If role is null, try direct database query as fallback
    if (!userRole) {
      console.log('⚠️  No cached role found, fetching directly from database...')
      try {
        const { data: user } = await supabase
          .from('users')
          .select('role, needs_onboarding')
          .eq('id', session.user.id)
          .single()

        userRole = user?.role || null
        needsOnboarding = (user?.needs_onboarding ?? (userRole === null)) || userRole === 'pending'
        console.log('🔍 Direct DB query result:', userRole, 'needs onboarding:', needsOnboarding)

        // Cache the result for next time
        if (userRole) {
          const { roleCacheManager } = await import('@/lib/cache/role-cache')
          roleCacheManager.setRole(session.user.id, userRole)
        }
      } catch (dbError) {
        console.error('❌ Database query failed:', dbError)
      }
    } else {
      try {
        const { data: onboardingData } = await supabase
          .from('users')
          .select('needs_onboarding')
          .eq('id', session.user.id)
          .single()
        needsOnboarding = (onboardingData?.needs_onboarding ?? false) || userRole === 'pending'
      } catch (dbError) {
        console.error('❌ Failed to fetch onboarding state:', dbError)
        needsOnboarding = userRole === 'pending'
      }
    }

    if ((needsOnboarding || userRole === 'pending') && !isOnboardingRoute) {
      console.log('🧭 Redirecting user to onboarding flow')
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    if (!needsOnboarding && userRole !== 'pending' && isOnboardingRoute) {
      const destination = userRole === 'admin'
        ? '/admin/dashboard'
        : userRole === 'owner'
          ? '/owner/dashboard'
          : '/vehicles'
      return NextResponse.redirect(new URL(destination, req.url))
    }

    // Check owner routes
    if (isOwnerRoute) {
      if (userRole !== 'owner' && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Check admin routes
    if (isAdminRoute) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (path.startsWith('/login') || path.startsWith('/signup')) {
      // Redirect based on role
      console.log('🚀 Middleware - Redirecting user with role:', userRole)
      if (userRole === 'admin') {
        console.log('🔑 Redirecting admin to /admin/dashboard')
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (userRole === 'owner') {
        console.log('🔑 Redirecting owner to /owner/dashboard')
        return NextResponse.redirect(new URL('/owner/dashboard', req.url))
      } else {
        console.log('🔑 Redirecting renter to /')
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ]
}

