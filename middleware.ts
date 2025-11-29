import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { getCachedUserRole } from '@/lib/cache/role-cache'
import { 
  canAccessRoute, 
  isPublicRoute, 
  isSharedRoute,
  isAdminRoute,
  isOwnerRoute,
  isRenterRoute,
  getDashboardRoute,
  type UserRole 
} from '@/lib/rbac/config'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Onboarding routes
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Redirect to login if accessing protected route without session
  if (!session) {
    // Allow public routes
    if (isPublicRoute(path)) {
      return res
    }
    
    // Allow unauthorized page (for displaying errors)
    if (path === '/unauthorized') {
      return res
    }

    // Redirect to login for all other protected routes
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
          .select('role, needs_onboarding, is_active')
          .eq('id', session.user.id)
          .single()

        userRole = user?.role || null
        needsOnboarding = (user?.needs_onboarding ?? (userRole === null)) || userRole === 'pending'
        console.log('🔍 Direct DB query result:', userRole, 'needs onboarding:', needsOnboarding, 'is_active:', user?.is_active)
        
        // CRITICAL: Block deactivated users immediately
        if (user && user.is_active === false) {
          console.log('🚫 BLOCKING deactivated user:', session.user.email)
          // Clear the session for deactivated users
          await supabase.auth.signOut()
          const unauthorizedUrl = new URL('/login', req.url)
          unauthorizedUrl.searchParams.set('message', 'Your account has been deactivated')
          return NextResponse.redirect(unauthorizedUrl)
        }
        
        // If user exists in Auth but not in DB (or RLS blocks access), treat as unauthorized/deactivated
        if (!user && session) {
           console.log('⚠️ User has session but no profile found (RLS blocked or deleted):', session.user.email)
           // Only force logout if we are sure it's not a temporary glitch
           // But for security, if we can't verify is_active, we shouldn't let them in.
           // Let's try to be safe:
           await supabase.auth.signOut()
           const unauthorizedUrl = new URL('/login', req.url)
           unauthorizedUrl.searchParams.set('message', 'Account verification failed. Please log in again.')
           return NextResponse.redirect(unauthorizedUrl)
        }

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
        const { data: userData } = await supabase
          .from('users')
          .select('needs_onboarding, is_active')
          .eq('id', session.user.id)
          .single()
        needsOnboarding = (userData?.needs_onboarding ?? false) || userRole === 'pending'
        
        // CRITICAL: Block deactivated users immediately
        if (userData && userData.is_active === false) {
          console.log('🚫 BLOCKING deactivated user:', session.user.email)
          // Clear the session for deactivated users
          await supabase.auth.signOut()
          const unauthorizedUrl = new URL('/login', req.url)
          unauthorizedUrl.searchParams.set('message', 'Your account has been deactivated')
          return NextResponse.redirect(unauthorizedUrl)
        }
        
        // If user exists in Auth but not in DB (or RLS blocks access), treat as unauthorized
        if (!userData && session) {
           console.log('⚠️ User has session but no profile found (RLS blocked or deleted):', session.user.email)
           await supabase.auth.signOut()
           const unauthorizedUrl = new URL('/login', req.url)
           unauthorizedUrl.searchParams.set('message', 'Account verification failed. Please log in again.')
           return NextResponse.redirect(unauthorizedUrl)
        }
      } catch (dbError) {
        console.error('❌ Failed to fetch user data:', dbError)
        needsOnboarding = userRole === 'pending'
      }
    }

    if ((needsOnboarding || userRole === 'pending') && !isOnboardingRoute) {
      console.log('🧭 Redirecting user to onboarding flow')
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    if (!needsOnboarding && userRole !== 'pending' && isOnboardingRoute) {
      const destination = getDashboardRoute(userRole as UserRole)
      return NextResponse.redirect(new URL(destination, req.url))
    }

    // CRITICAL: Redirect admin and owner from home page IMMEDIATELY
    // This must happen BEFORE RBAC check to prevent any access to homepage
    // Admin and Owner users CANNOT access the homepage - they are always redirected to their dashboards
    if (path === '/' && (userRole === 'admin' || userRole === 'owner')) {
      console.log('🚫 BLOCKING', userRole, 'from accessing homepage - redirecting to dashboard')
      const dashboardUrl = getDashboardRoute(userRole as UserRole)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Redirect authenticated users away from auth pages
    if (path.startsWith('/login') || path.startsWith('/signup') || path === '/auth/login') {
      // Redirect based on role using centralized function
      console.log('🚀 Middleware - Redirecting user with role:', userRole)
      const dashboardUrl = getDashboardRoute(userRole as UserRole)
      console.log(`🔑 Redirecting ${userRole} to ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // STRICT RBAC: Check route access based on role
    // Admin CANNOT access owner or renter routes
    // Owner CANNOT access admin or renter routes
    // Renter CANNOT access admin or owner routes
    // Note: Homepage (/) is handled above - admin/owner are redirected before reaching this check
    const accessCheck = canAccessRoute(path, userRole as UserRole)
    
    if (!accessCheck.allowed) {
      console.log(`🚫 Access denied for ${userRole} to ${path}: ${accessCheck.reason}`)
      // Return 403 Forbidden response
      const unauthorizedUrl = new URL('/unauthorized', req.url)
      unauthorizedUrl.searchParams.set('reason', accessCheck.reason || 'Access denied')
      unauthorizedUrl.searchParams.set('path', path)
      return NextResponse.redirect(unauthorizedUrl)
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

