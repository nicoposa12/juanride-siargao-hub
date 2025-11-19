/**
 * Navigation Configuration Tests
 * 
 * Tests for role-based navigation visibility and route access
 */

import { describe, it, expect } from '@jest/globals'
import { getNavItemsForRole, isNavItemActive, NAV_ITEMS, type UserRole } from '../config'
import { canAccessRoute, validateRoleForRoute } from '../permissions'

describe('Navigation Configuration', () => {
  describe('getNavItemsForRole', () => {
    it('should return public items for unauthenticated users', () => {
      const items = getNavItemsForRole(null)
      const publicRoutes = items.map(item => item.href)
      
      expect(publicRoutes).toContain('/')
      expect(publicRoutes).toContain('/vehicles')
      expect(publicRoutes).not.toContain('/dashboard/bookings')
      expect(publicRoutes).not.toContain('/owner/dashboard')
      expect(publicRoutes).not.toContain('/admin/dashboard')
    })

    it('should return renter-specific items for renter role', () => {
      const items = getNavItemsForRole('renter')
      const routes = items.map(item => item.href)
      
      expect(routes).toContain('/')
      expect(routes).toContain('/vehicles')
      expect(routes).toContain('/dashboard/bookings')
      expect(routes).toContain('/favorites')
      expect(routes).toContain('/dashboard/reviews')
      expect(routes).toContain('/support')
      expect(routes).toContain('/profile')
      expect(routes).not.toContain('/owner/dashboard')
      expect(routes).not.toContain('/admin/dashboard')
    })

    it('should return owner-specific items for owner role', () => {
      const items = getNavItemsForRole('owner')
      const routes = items.map(item => item.href)
      
      expect(routes).toContain('/')
      expect(routes).toContain('/vehicles')
      expect(routes).toContain('/owner/dashboard')
      expect(routes).toContain('/owner/vehicles')
      expect(routes).toContain('/owner/bookings')
      expect(routes).toContain('/owner/earnings')
      expect(routes).toContain('/owner/maintenance')
      expect(routes).toContain('/support')
      expect(routes).toContain('/profile')
      expect(routes).not.toContain('/dashboard/bookings')
      expect(routes).not.toContain('/admin/dashboard')
    })

    it('should return admin-specific items for admin role', () => {
      const items = getNavItemsForRole('admin')
      const routes = items.map(item => item.href)
      
      expect(routes).toContain('/')
      expect(routes).toContain('/vehicles')
      expect(routes).toContain('/admin/dashboard')
      expect(routes).toContain('/admin/users')
      expect(routes).toContain('/admin/listings')
      expect(routes).toContain('/admin/bookings')
      expect(routes).toContain('/admin/transactions')
      expect(routes).toContain('/admin/maintenance')
      expect(routes).toContain('/admin/reports')
      expect(routes).toContain('/admin/feedback')
      expect(routes).toContain('/admin/settings')
      expect(routes).toContain('/admin/support')
      expect(routes).toContain('/profile')
    })

    it('should return items in correct order', () => {
      const items = getNavItemsForRole('renter')
      const orders = items.map(item => item.order)
      
      // Check that orders are ascending
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1])
      }
    })
  })

  describe('isNavItemActive', () => {
    it('should match exact paths when exact is true', () => {
      const homeItem = NAV_ITEMS.find(item => item.href === '/' && item.exact)
      expect(homeItem).toBeDefined()
      
      if (homeItem) {
        expect(isNavItemActive(homeItem, '/')).toBe(true)
        expect(isNavItemActive(homeItem, '/vehicles')).toBe(false)
        expect(isNavItemActive(homeItem, '/dashboard')).toBe(false)
      }
    })

    it('should match paths and subpaths when exact is false', () => {
      const vehiclesItem = NAV_ITEMS.find(item => item.href === '/vehicles')
      expect(vehiclesItem).toBeDefined()
      
      if (vehiclesItem) {
        expect(isNavItemActive(vehiclesItem, '/vehicles')).toBe(true)
        expect(isNavItemActive(vehiclesItem, '/vehicles/123')).toBe(true)
        expect(isNavItemActive(vehiclesItem, '/vehicles/search')).toBe(true)
        expect(isNavItemActive(vehiclesItem, '/')).toBe(false)
      }
    })

    it('should match admin routes correctly', () => {
      const adminDashboardItem = NAV_ITEMS.find(item => item.href === '/admin/dashboard')
      expect(adminDashboardItem).toBeDefined()
      
      if (adminDashboardItem) {
        expect(isNavItemActive(adminDashboardItem, '/admin/dashboard')).toBe(true)
        expect(isNavItemActive(adminDashboardItem, '/admin/dashboard/stats')).toBe(true)
        expect(isNavItemActive(adminDashboardItem, '/admin/users')).toBe(false)
      }
    })

    it('should return false when pathname is null', () => {
      const homeItem = NAV_ITEMS.find(item => item.href === '/')
      expect(homeItem).toBeDefined()
      
      if (homeItem) {
        expect(isNavItemActive(homeItem, null)).toBe(false)
      }
      
      const vehiclesItem = NAV_ITEMS.find(item => item.href === '/vehicles')
      expect(vehiclesItem).toBeDefined()
      
      if (vehiclesItem) {
        expect(isNavItemActive(vehiclesItem, null)).toBe(false)
      }
    })
  })
})

describe('Route Access Control', () => {
  describe('canAccessRoute', () => {
    it('should allow public routes for all users', () => {
      expect(canAccessRoute('/', null)).toBe(true)
      expect(canAccessRoute('/vehicles', null)).toBe(true)
      expect(canAccessRoute('/login', null)).toBe(true)
      expect(canAccessRoute('/signup', null)).toBe(true)
    })

    it('should restrict admin routes to admin role only', () => {
      expect(canAccessRoute('/admin/dashboard', 'admin')).toBe(true)
      expect(canAccessRoute('/admin/users', 'admin')).toBe(true)
      expect(canAccessRoute('/admin/dashboard', 'owner')).toBe(false)
      expect(canAccessRoute('/admin/dashboard', 'renter')).toBe(false)
      expect(canAccessRoute('/admin/dashboard', null)).toBe(false)
    })

    it('should restrict owner routes to owner and admin roles', () => {
      expect(canAccessRoute('/owner/dashboard', 'owner')).toBe(true)
      expect(canAccessRoute('/owner/dashboard', 'admin')).toBe(true)
      expect(canAccessRoute('/owner/dashboard', 'renter')).toBe(false)
      expect(canAccessRoute('/owner/dashboard', null)).toBe(false)
    })

    it('should allow authenticated routes for any authenticated user', () => {
      expect(canAccessRoute('/dashboard/bookings', 'renter')).toBe(true)
      expect(canAccessRoute('/dashboard/bookings', 'owner')).toBe(true)
      expect(canAccessRoute('/dashboard/bookings', 'admin')).toBe(true)
      expect(canAccessRoute('/dashboard/bookings', null)).toBe(false)
      
      expect(canAccessRoute('/profile', 'renter')).toBe(true)
      expect(canAccessRoute('/profile', 'owner')).toBe(true)
      expect(canAccessRoute('/profile', 'admin')).toBe(true)
      expect(canAccessRoute('/profile', null)).toBe(false)
    })

    it('should allow support routes for authenticated users', () => {
      expect(canAccessRoute('/support', 'renter')).toBe(true)
      expect(canAccessRoute('/support', 'owner')).toBe(true)
      expect(canAccessRoute('/support', 'admin')).toBe(true)
      expect(canAccessRoute('/support', null)).toBe(false)
    })
  })

  describe('validateRoleForRoute', () => {
    it('should validate admin routes correctly', () => {
      const adminResult = validateRoleForRoute('/admin/dashboard', 'admin')
      expect(adminResult.allowed).toBe(true)
      
      const ownerResult = validateRoleForRoute('/admin/dashboard', 'owner')
      expect(ownerResult.allowed).toBe(false)
      expect(ownerResult.reason).toBe('Admin access required')
      
      const renterResult = validateRoleForRoute('/admin/dashboard', 'renter')
      expect(renterResult.allowed).toBe(false)
      expect(renterResult.reason).toBe('Admin access required')
    })

    it('should validate owner routes correctly', () => {
      const ownerResult = validateRoleForRoute('/owner/dashboard', 'owner')
      expect(ownerResult.allowed).toBe(true)
      
      const adminResult = validateRoleForRoute('/owner/dashboard', 'admin')
      expect(adminResult.allowed).toBe(true)
      
      const renterResult = validateRoleForRoute('/owner/dashboard', 'renter')
      expect(renterResult.allowed).toBe(false)
      expect(renterResult.reason).toBe('Owner or admin access required')
    })

    it('should validate authenticated routes correctly', () => {
      const authenticatedResult = validateRoleForRoute('/dashboard/bookings', 'renter')
      expect(authenticatedResult.allowed).toBe(true)
      
      const unauthenticatedResult = validateRoleForRoute('/dashboard/bookings', null)
      expect(unauthenticatedResult.allowed).toBe(false)
      expect(unauthenticatedResult.reason).toBe('Authentication required')
    })

    it('should validate public routes correctly', () => {
      const publicResult = validateRoleForRoute('/', null)
      expect(publicResult.allowed).toBe(true)
      
      const vehiclesResult = validateRoleForRoute('/vehicles', null)
      expect(vehiclesResult.allowed).toBe(true)
    })
  })
})

