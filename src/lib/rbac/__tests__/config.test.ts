/**
 * RBAC Configuration Tests
 * 
 * Comprehensive tests for role-based access control rules
 */

import { describe, it, expect } from '@jest/globals'
import {
  canAccessRoute,
  isAdminRoute,
  isOwnerRoute,
  isRenterRoute,
  isSharedRoute,
  isPublicRoute,
  getDashboardRoute,
  SHARED_ROUTES,
  PUBLIC_ROUTES,
  type UserRole
} from '../config'

describe('RBAC Route Detection', () => {
  describe('isAdminRoute', () => {
    it('should detect admin routes correctly', () => {
      expect(isAdminRoute('/admin/dashboard')).toBe(true)
      expect(isAdminRoute('/admin/users')).toBe(true)
      expect(isAdminRoute('/admin/settings')).toBe(true)
      expect(isAdminRoute('/owner/dashboard')).toBe(false)
      expect(isAdminRoute('/dashboard/bookings')).toBe(false)
    })
  })

  describe('isOwnerRoute', () => {
    it('should detect owner routes correctly', () => {
      expect(isOwnerRoute('/owner/dashboard')).toBe(true)
      expect(isOwnerRoute('/owner/vehicles')).toBe(true)
      expect(isOwnerRoute('/owner/bookings')).toBe(true)
      expect(isOwnerRoute('/admin/dashboard')).toBe(false)
      expect(isOwnerRoute('/dashboard/bookings')).toBe(false)
    })
  })

  describe('isRenterRoute', () => {
    it('should detect renter routes correctly', () => {
      expect(isRenterRoute('/dashboard/bookings')).toBe(true)
      expect(isRenterRoute('/dashboard/reviews')).toBe(true)
      expect(isRenterRoute('/favorites')).toBe(true)
      expect(isRenterRoute('/messages')).toBe(true)
      expect(isRenterRoute('/admin/dashboard')).toBe(false)
      expect(isRenterRoute('/owner/dashboard')).toBe(false)
    })
  })

  describe('isSharedRoute', () => {
    it('should detect shared routes correctly', () => {
      expect(isSharedRoute('/profile')).toBe(true)
      expect(isSharedRoute('/profile/123')).toBe(true)
      expect(isSharedRoute('/support')).toBe(true)
      expect(isSharedRoute('/unauthorized')).toBe(true)
      expect(isSharedRoute('/admin/dashboard')).toBe(false)
      expect(isSharedRoute('/dashboard/bookings')).toBe(false)
    })
  })

  describe('isPublicRoute', () => {
    it('should detect public routes correctly', () => {
      expect(isPublicRoute('/')).toBe(true)
      expect(isPublicRoute('/login')).toBe(true)
      expect(isPublicRoute('/vehicles')).toBe(true)
      expect(isPublicRoute('/vehicles/123')).toBe(true)
      expect(isPublicRoute('/admin/dashboard')).toBe(false)
      expect(isPublicRoute('/profile')).toBe(false)
    })
  })
})

describe('RBAC Access Control', () => {
  describe('Admin Access', () => {
    it('should allow admin to access admin routes', () => {
      expect(canAccessRoute('/admin/dashboard', 'admin').allowed).toBe(true)
      expect(canAccessRoute('/admin/users', 'admin').allowed).toBe(true)
      expect(canAccessRoute('/admin/settings', 'admin').allowed).toBe(true)
    })

    it('should DENY admin access to owner routes', () => {
      const result = canAccessRoute('/owner/dashboard', 'admin')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Owner access required')
    })

    it('should DENY admin access to renter routes', () => {
      const result = canAccessRoute('/dashboard/bookings', 'admin')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Renter access required')
    })

    it('should allow admin to access shared routes', () => {
      expect(canAccessRoute('/profile', 'admin').allowed).toBe(true)
      expect(canAccessRoute('/support', 'admin').allowed).toBe(true)
    })

    it('should allow admin to access public routes', () => {
      expect(canAccessRoute('/', 'admin').allowed).toBe(true)
      expect(canAccessRoute('/vehicles', 'admin').allowed).toBe(true)
    })
  })

  describe('Owner Access', () => {
    it('should allow owner to access owner routes', () => {
      expect(canAccessRoute('/owner/dashboard', 'owner').allowed).toBe(true)
      expect(canAccessRoute('/owner/vehicles', 'owner').allowed).toBe(true)
      expect(canAccessRoute('/owner/bookings', 'owner').allowed).toBe(true)
    })

    it('should DENY owner access to admin routes', () => {
      const result = canAccessRoute('/admin/dashboard', 'owner')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Admin access required')
    })

    it('should DENY owner access to renter routes', () => {
      const result = canAccessRoute('/dashboard/bookings', 'owner')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Renter access required')
    })

    it('should allow owner to access shared routes', () => {
      expect(canAccessRoute('/profile', 'owner').allowed).toBe(true)
      expect(canAccessRoute('/support', 'owner').allowed).toBe(true)
    })

    it('should allow owner to access public routes', () => {
      expect(canAccessRoute('/', 'owner').allowed).toBe(true)
      expect(canAccessRoute('/vehicles', 'owner').allowed).toBe(true)
    })
  })

  describe('Renter Access', () => {
    it('should allow renter to access renter routes', () => {
      expect(canAccessRoute('/dashboard/bookings', 'renter').allowed).toBe(true)
      expect(canAccessRoute('/dashboard/reviews', 'renter').allowed).toBe(true)
      expect(canAccessRoute('/favorites', 'renter').allowed).toBe(true)
      expect(canAccessRoute('/messages', 'renter').allowed).toBe(true)
    })

    it('should DENY renter access to admin routes', () => {
      const result = canAccessRoute('/admin/dashboard', 'renter')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Admin access required')
    })

    it('should DENY renter access to owner routes', () => {
      const result = canAccessRoute('/owner/dashboard', 'renter')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Owner access required')
    })

    it('should allow renter to access shared routes', () => {
      expect(canAccessRoute('/profile', 'renter').allowed).toBe(true)
      expect(canAccessRoute('/support', 'renter').allowed).toBe(true)
    })

    it('should allow renter to access public routes', () => {
      expect(canAccessRoute('/', 'renter').allowed).toBe(true)
      expect(canAccessRoute('/vehicles', 'renter').allowed).toBe(true)
    })
  })

  describe('Unauthenticated Access', () => {
    it('should allow unauthenticated users to access public routes', () => {
      expect(canAccessRoute('/', null).allowed).toBe(true)
      expect(canAccessRoute('/vehicles', null).allowed).toBe(true)
      expect(canAccessRoute('/login', null).allowed).toBe(true)
    })

    it('should DENY unauthenticated users from admin routes', () => {
      const result = canAccessRoute('/admin/dashboard', null)
      expect(result.allowed).toBe(false)
    })

    it('should DENY unauthenticated users from owner routes', () => {
      const result = canAccessRoute('/owner/dashboard', null)
      expect(result.allowed).toBe(false)
    })

    it('should DENY unauthenticated users from renter routes', () => {
      const result = canAccessRoute('/dashboard/bookings', null)
      expect(result.allowed).toBe(false)
    })

    it('should DENY unauthenticated users from shared routes', () => {
      const result = canAccessRoute('/profile', null)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Authentication required')
    })
  })
})

describe('Dashboard Routes', () => {
  it('should return correct dashboard route for each role', () => {
    expect(getDashboardRoute('admin')).toBe('/admin/dashboard')
    expect(getDashboardRoute('owner')).toBe('/owner/dashboard')
    expect(getDashboardRoute('renter')).toBe('/dashboard/bookings')
    expect(getDashboardRoute(null)).toBe('/')
    expect(getDashboardRoute('pending')).toBe('/')
  })
})

describe('Shared Routes Configuration', () => {
  it('should have shared routes defined', () => {
    expect(SHARED_ROUTES.length).toBeGreaterThan(0)
    expect(SHARED_ROUTES).toContain('/profile')
    expect(SHARED_ROUTES).toContain('/support')
  })
})

describe('Public Routes Configuration', () => {
  it('should have public routes defined', () => {
    expect(PUBLIC_ROUTES.length).toBeGreaterThan(0)
    expect(PUBLIC_ROUTES).toContain('/')
    expect(PUBLIC_ROUTES).toContain('/login')
    expect(PUBLIC_ROUTES).toContain('/vehicles')
  })
})

