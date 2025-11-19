/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Centralized configuration for role definitions, route access rules,
 * and shared pages accessible to all authenticated users.
 */

export type UserRole = 'admin' | 'owner' | 'renter' | 'pending' | null

/**
 * Role definitions with descriptions
 */
export const ROLES = {
  ADMIN: 'admin' as const,
  OWNER: 'owner' as const,
  RENTER: 'renter' as const,
  PENDING: 'pending' as const,
} as const

/**
 * Route patterns for role-specific access
 */
export const ROUTE_PATTERNS = {
  ADMIN: '/admin',
  OWNER: '/owner',
  RENTER: '/dashboard', // Renter-specific routes start with /dashboard
  RENTER_ALT: '/favorites', // Alternative renter routes
  RENTER_MESSAGES: '/messages', // Messages are renter-specific
} as const

/**
 * Shared routes accessible to all authenticated users
 * These routes can be accessed by Admin, Owner, and Renter roles
 */
export const SHARED_ROUTES = [
  '/profile',           // User profile page
  '/profile/[id]',      // View other user profiles
  '/support',           // Support/help page
  '/unauthorized',      // Unauthorized access page
] as const

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/vehicles',
  '/checkout',
  '/booking-confirmation',
] as const

/**
 * Check if a route is a shared route
 */
export function isSharedRoute(path: string): boolean {
  return SHARED_ROUTES.some(route => {
    // Handle dynamic routes like /profile/[id]
    if (route.includes('[')) {
      const pattern = route.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${pattern.replace(/\//g, '\\/')}$`)
      return regex.test(path)
    }
    return path === route || path.startsWith(route + '/')
  })
}

/**
 * Check if a route is a public route
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return path === '/'
    }
    return path === route || path.startsWith(route + '/')
  })
}

/**
 * Check if a route is an admin route
 */
export function isAdminRoute(path: string): boolean {
  return path.startsWith(ROUTE_PATTERNS.ADMIN)
}

/**
 * Check if a route is an owner route
 */
export function isOwnerRoute(path: string): boolean {
  return path.startsWith(ROUTE_PATTERNS.OWNER)
}

/**
 * Check if a route is a renter route
 */
export function isRenterRoute(path: string): boolean {
  return (
    path.startsWith(ROUTE_PATTERNS.RENTER) ||
    path.startsWith(ROUTE_PATTERNS.RENTER_ALT) ||
    path.startsWith(ROUTE_PATTERNS.RENTER_MESSAGES)
  )
}

/**
 * Check if a user role can access a specific route
 * 
 * Rules:
 * - Admin can ONLY access admin routes and shared routes
 * - Owner can ONLY access owner routes and shared routes
 * - Renter can ONLY access renter routes and shared routes
 * - Public routes are accessible to everyone EXCEPT admin/owner cannot access homepage
 * - Shared routes are accessible to all authenticated users
 */
export function canAccessRoute(path: string, role: UserRole): {
  allowed: boolean
  reason?: string
} {
  // CRITICAL: Admin and Owner CANNOT access homepage - they are redirected to dashboards
  // This check happens before public route check to ensure strict enforcement
  if (path === '/' && (role === ROLES.ADMIN || role === ROLES.OWNER)) {
    return {
      allowed: false,
      reason: `${role === ROLES.ADMIN ? 'Admin' : 'Owner'} users cannot access the homepage. You will be redirected to your dashboard.`
    }
  }

  // Public routes are accessible to everyone (except admin/owner for homepage, handled above)
  if (isPublicRoute(path)) {
    return { allowed: true }
  }

  // Shared routes require authentication but are accessible to all roles
  if (isSharedRoute(path)) {
    if (role === null || role === 'pending') {
      return {
        allowed: false,
        reason: 'Authentication required to access shared pages'
      }
    }
    return { allowed: true }
  }

  // Admin routes - ONLY admin can access
  if (isAdminRoute(path)) {
    if (role !== ROLES.ADMIN) {
      return {
        allowed: false,
        reason: 'Admin access required. Admin users cannot access owner or renter pages.'
      }
    }
    return { allowed: true }
  }

  // Owner routes - ONLY owner can access (admin CANNOT access)
  if (isOwnerRoute(path)) {
    if (role !== ROLES.OWNER) {
      return {
        allowed: false,
        reason: 'Owner access required. Owner users cannot access admin or renter pages.'
      }
    }
    return { allowed: true }
  }

  // Renter routes - ONLY renter can access (admin and owner CANNOT access)
  if (isRenterRoute(path)) {
    if (role !== ROLES.RENTER) {
      return {
        allowed: false,
        reason: 'Renter access required. Renter users cannot access admin or owner pages.'
      }
    }
    return { allowed: true }
  }

  // Default: require authentication for unknown routes
  if (role === null || role === 'pending') {
    return {
      allowed: false,
      reason: 'Authentication required'
    }
  }

  // If route doesn't match any pattern, allow authenticated users
  return { allowed: true }
}

/**
 * Get role-specific dashboard route
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.OWNER:
      return '/owner/dashboard'
    case ROLES.RENTER:
      return '/dashboard/bookings'
    default:
      return '/'
  }
}

