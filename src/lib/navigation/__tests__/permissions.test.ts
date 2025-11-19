/**
 * Permission Utilities Tests
 * 
 * Tests for permission checking functions
 */

import { describe, it, expect } from '@jest/globals'
import { 
  hasRouteAccess, 
  canSeeNavItem, 
  validateRoleForRoute,
  getRoleBasedRedirect 
} from '../permissions'
import type { UserRole } from '../config'

describe('Permission Utilities', () => {
  describe('hasRouteAccess', () => {
    it('should check route access correctly', () => {
      expect(hasRouteAccess('/admin/dashboard', 'admin')).toBe(true)
      expect(hasRouteAccess('/admin/dashboard', 'owner')).toBe(false)
      expect(hasRouteAccess('/owner/dashboard', 'owner')).toBe(true)
      expect(hasRouteAccess('/owner/dashboard', 'admin')).toBe(true)
      expect(hasRouteAccess('/dashboard/bookings', 'renter')).toBe(true)
      expect(hasRouteAccess('/dashboard/bookings', null)).toBe(false)
    })
  })

  describe('canSeeNavItem', () => {
    it('should check if nav item is visible to role', () => {
      expect(canSeeNavItem('/admin/dashboard', 'admin')).toBe(true)
      expect(canSeeNavItem('/admin/dashboard', 'owner')).toBe(false)
      expect(canSeeNavItem('/owner/dashboard', 'owner')).toBe(true)
      expect(canSeeNavItem('/dashboard/bookings', 'renter')).toBe(true)
      expect(canSeeNavItem('/dashboard/bookings', null)).toBe(false)
      expect(canSeeNavItem('/', null)).toBe(true)
      expect(canSeeNavItem('/vehicles', null)).toBe(true)
    })
  })

  describe('getRoleBasedRedirect', () => {
    it('should return correct redirect for admin', () => {
      expect(getRoleBasedRedirect('admin')).toBe('/admin/dashboard')
      expect(getRoleBasedRedirect('admin', '/admin/users')).toBe('/admin/users')
    })

    it('should return correct redirect for owner', () => {
      expect(getRoleBasedRedirect('owner')).toBe('/owner/dashboard')
      expect(getRoleBasedRedirect('owner', '/owner/vehicles')).toBe('/owner/vehicles')
    })

    it('should return correct redirect for renter', () => {
      expect(getRoleBasedRedirect('renter')).toBe('/vehicles')
      expect(getRoleBasedRedirect('renter', '/dashboard/bookings')).toBe('/dashboard/bookings')
    })

    it('should return correct redirect for unauthenticated', () => {
      expect(getRoleBasedRedirect(null)).toBe('/')
      expect(getRoleBasedRedirect(null, '/vehicles')).toBe('/vehicles')
    })

    it('should redirect to dashboard if on invalid route', () => {
      expect(getRoleBasedRedirect('admin', '/owner/dashboard')).toBe('/admin/dashboard')
      expect(getRoleBasedRedirect('owner', '/admin/dashboard')).toBe('/owner/dashboard')
      expect(getRoleBasedRedirect('renter', '/admin/dashboard')).toBe('/vehicles')
    })
  })
})

