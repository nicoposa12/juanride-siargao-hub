/**
 * Permission Utilities
 * 
 * Centralized permission checking functions for route access and navigation visibility.
 * Ensures front-end visibility rules align with back-end access control.
 */

import type { UserRole } from './config'
import { canAccessRoute } from './config'

/**
 * Check if a user can access a specific route
 */
export function hasRouteAccess(route: string, role: UserRole): boolean {
  return canAccessRoute(route, role)
}

/**
 * Check if a user can see a navigation item
 */
export function canSeeNavItem(itemHref: string, role: UserRole): boolean {
  return hasRouteAccess(itemHref, role)
}

/**
 * Validate that a user's role matches expected role for a route
 */
export function validateRoleForRoute(route: string, userRole: UserRole): {
  allowed: boolean
  reason?: string
} {
  // Public routes
  const publicRoutes = ['/', '/vehicles', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
  if (publicRoutes.some(r => route === r || route.startsWith(r + '/'))) {
    return { allowed: true }
  }

  // Admin routes
  if (route.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return {
        allowed: false,
        reason: 'Admin access required'
      }
    }
    return { allowed: true }
  }

  // Owner routes
  if (route.startsWith('/owner')) {
    if (userRole !== 'owner' && userRole !== 'admin') {
      return {
        allowed: false,
        reason: 'Owner or admin access required'
      }
    }
    return { allowed: true }
  }

  // Renter routes (any authenticated user)
  if (route.startsWith('/dashboard') || route.startsWith('/favorites') || route.startsWith('/messages') || route.startsWith('/profile')) {
    if (userRole === null) {
      return {
        allowed: false,
        reason: 'Authentication required'
      }
    }
    return { allowed: true }
  }

  // Support routes
  if (route.startsWith('/support')) {
    if (userRole === null) {
      return {
        allowed: false,
        reason: 'Authentication required'
      }
    }
    return { allowed: true }
  }

  // Default: require authentication
  if (userRole === null) {
    return {
      allowed: false,
      reason: 'Authentication required'
    }
  }

  return { allowed: true }
}

/**
 * Get the appropriate redirect URL for a user based on their role
 */
export function getRoleBasedRedirect(role: UserRole, currentPath?: string): string {
  // Don't redirect if already on a valid route
  if (currentPath && hasRouteAccess(currentPath, role)) {
    return currentPath
  }

  // Role-based default destinations
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'owner':
      return '/owner/dashboard'
    case 'renter':
      return '/dashboard/bookings' // Renter dashboard
    case null:
      return '/'
    default:
      return '/'
  }
}

