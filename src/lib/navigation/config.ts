/**
 * Centralized Navigation Configuration
 * 
 * Single source of truth for all navigation items across the application.
 * Ensures consistent behavior, ordering, and role-based restrictions.
 */

export type UserRole = 'renter' | 'owner' | 'admin' | null

export interface NavItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  roles: UserRole[] // Roles that can see this item (null = unauthenticated)
  exact?: boolean // If true, only matches exact path, otherwise matches path and subpaths
  order: number // Order in which items appear
}

/**
 * Navigation items configuration
 * 
 * Rules:
 * - Items are ordered by the `order` field
 * - Only items matching user's role are shown
 * - Active state is determined by pathname matching
 */
export const NAV_ITEMS: NavItem[] = [
  // Public items (visible to everyone except owners)
  {
    name: 'Home',
    href: '/',
    roles: [null, 'renter', 'admin'], // Owners are redirected from home, so hide it
    exact: true,
    order: 1,
  },
  {
    name: 'Browse Vehicles',
    href: '/vehicles',
    roles: [null, 'renter', 'owner', 'admin'],
    order: 2,
  },

  // Renter-specific items
  {
    name: 'My Rentals',
    href: '/dashboard/bookings',
    roles: ['renter'],
    order: 3,
  },
  {
    name: 'Favorites',
    href: '/favorites',
    roles: ['renter'],
    order: 4,
  },
  {
    name: 'Reviews',
    href: '/dashboard/reviews',
    roles: ['renter'],
    order: 5,
  },

  // Owner-specific items
  {
    name: 'Dashboard',
    href: '/owner/dashboard',
    roles: ['owner'],
    order: 3,
  },
  {
    name: 'My Vehicles',
    href: '/owner/vehicles',
    roles: ['owner'],
    order: 4,
  },
  {
    name: 'Bookings',
    href: '/owner/bookings',
    roles: ['owner'],
    order: 5,
  },
  {
    name: 'Earnings',
    href: '/owner/earnings',
    roles: ['owner'],
    order: 6,
  },
  {
    name: 'Maintenance',
    href: '/owner/maintenance',
    roles: ['owner'],
    order: 7,
  },

  // Admin-specific items (shown in sidebar, not main nav)
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    roles: ['admin'],
    order: 1,
  },
  {
    name: 'Users',
    href: '/admin/users',
    roles: ['admin'],
    order: 2,
  },
  {
    name: 'Listings',
    href: '/admin/listings',
    roles: ['admin'],
    order: 3,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    roles: ['admin'],
    order: 4,
  },
  {
    name: 'Payments',
    href: '/admin/transactions',
    roles: ['admin'],
    order: 5,
  },
  {
    name: 'Maintenance',
    href: '/admin/maintenance',
    roles: ['admin'],
    order: 6,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    roles: ['admin'],
    order: 7,
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    roles: ['admin'],
    order: 8,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    roles: ['admin'],
    order: 9,
  },
  {
    name: 'Support',
    href: '/admin/support',
    roles: ['admin'],
    order: 10,
  },

  // Shared authenticated items
  {
    name: 'Support',
    href: '/support',
    roles: ['renter', 'owner'],
    order: 8,
  },
  {
    name: 'Profile',
    href: '/profile',
    roles: ['renter', 'owner', 'admin'],
    order: 9,
  },
]

/**
 * Get navigation items filtered by role
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS
    .filter(item => {
      // If user is not authenticated (null), only show items with null in roles
      if (role === null) {
        return item.roles.includes(null)
      }
      
      // If user is authenticated, check if their role is explicitly in the item's roles
      // If item only has null (truly public), show it to all authenticated users
      // If item has specific roles listed, user's role must be in that list
      const hasSpecificRoles = item.roles.some(r => r !== null)
      
      if (hasSpecificRoles) {
        // Item has specific roles - user's role must be explicitly included
        return item.roles.includes(role)
      } else {
        // Item is truly public (only null) - show to all authenticated users
        return item.roles.includes(null)
      }
    })
    .sort((a, b) => a.order - b.order)
}

/**
 * Check if a pathname matches a nav item
 */
export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  // If pathname is null, no item is active
  if (!pathname) {
    return false
  }
  
  if (item.exact) {
    return pathname === item.href
  }
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

/**
 * Check if a user role can access a route
 */
export function canAccessRoute(route: string, role: UserRole): boolean {
  // Public routes
  const publicRoutes = ['/', '/vehicles', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
  if (publicRoutes.some(r => route === r || route.startsWith(r + '/'))) {
    return true
  }

  // Checkout and booking confirmation are public (but may require auth later)
  if (route.startsWith('/checkout') || route.startsWith('/booking-confirmation')) {
    return true
  }

  // Admin routes
  if (route.startsWith('/admin')) {
    return role === 'admin'
  }

  // Owner routes - ONLY owner can access (admin CANNOT access)
  if (route.startsWith('/owner')) {
    return role === 'owner'
  }

  // Renter routes (authenticated users)
  if (route.startsWith('/dashboard') || route.startsWith('/favorites') || route.startsWith('/messages') || route.startsWith('/profile')) {
    return role !== null // Any authenticated user
  }

  // Support is accessible to authenticated users
  if (route.startsWith('/support')) {
    return role !== null
  }

  // Default: require authentication
  return role !== null
}

