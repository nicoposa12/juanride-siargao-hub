# RBAC (Role-Based Access Control) Module

## Quick Start

```typescript
import { canAccessRoute, getDashboardRoute, type UserRole } from '@/lib/rbac/config'

// Check route access
const accessCheck = canAccessRoute('/admin/dashboard', 'admin')
if (!accessCheck.allowed) {
  console.log(accessCheck.reason)
}

// Get dashboard route for role
const dashboard = getDashboardRoute('admin') // '/admin/dashboard'
```

## Exports

### Functions

- `canAccessRoute(path, role)` - Check if role can access route
- `isAdminRoute(path)` - Check if route is admin-only
- `isOwnerRoute(path)` - Check if route is owner-only
- `isRenterRoute(path)` - Check if route is renter-only
- `isSharedRoute(path)` - Check if route is shared (all authenticated)
- `isPublicRoute(path)` - Check if route is public
- `getDashboardRoute(role)` - Get role-specific dashboard route

### Constants

- `ROLES` - Role definitions
- `ROUTE_PATTERNS` - Route pattern definitions
- `SHARED_ROUTES` - Routes accessible to all authenticated users
- `PUBLIC_ROUTES` - Routes accessible to everyone

### Types

- `UserRole` - Type for user roles: `'admin' | 'owner' | 'renter' | 'pending' | null`

## Examples

See `docs/RBAC_IMPLEMENTATION.md` for comprehensive examples and usage patterns.

