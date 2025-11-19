# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the comprehensive RBAC system implemented for the JuanRide application. The system enforces strict role separation where Admin, Owner, and Renter roles can only access their respective routes, with shared pages accessible to all authenticated users.

## Architecture

### Centralized Configuration

All RBAC logic is centralized in `src/lib/rbac/config.ts`, providing a single source of truth for:
- Role definitions
- Route patterns
- Shared routes
- Public routes
- Access control logic

### Multi-Layer Protection

1. **Middleware Layer** (`middleware.ts`) - Server-side route protection
2. **Component Layer** (`AuthGuard.tsx`) - Client-side component protection
3. **Database Layer** (RLS policies) - Data-level security

## Role Definitions

### Admin
- **Access**: Admin routes (`/admin/*`) and shared routes only
- **Cannot Access**: Owner routes (`/owner/*`) or Renter routes (`/dashboard/*`, `/favorites`, `/messages`)
- **Dashboard**: `/admin/dashboard`

### Owner
- **Access**: Owner routes (`/owner/*`) and shared routes only
- **Cannot Access**: Admin routes (`/admin/*`) or Renter routes (`/dashboard/*`, `/favorites`, `/messages`)
- **Dashboard**: `/owner/dashboard`

### Renter
- **Access**: Renter routes (`/dashboard/*`, `/favorites`, `/messages`) and shared routes only
- **Cannot Access**: Admin routes (`/admin/*`) or Owner routes (`/owner/*`)
- **Dashboard**: `/dashboard/bookings`

## Shared Routes

These routes are accessible to **all authenticated users** (Admin, Owner, and Renter):

- `/profile` - User profile page
- `/profile/[id]` - View other user profiles
- `/support` - Support/help page
- `/unauthorized` - Unauthorized access page

## Public Routes

These routes are accessible to **everyone** (including unauthenticated users):

- `/` - Homepage
- `/login` - Login page
- `/signup` - Sign up page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation
- `/auth/callback` - OAuth callback
- `/vehicles` - Vehicle browsing
- `/checkout` - Checkout flow
- `/booking-confirmation` - Booking confirmation

## Implementation Details

### 1. RBAC Configuration (`src/lib/rbac/config.ts`)

```typescript
import { canAccessRoute, type UserRole } from '@/lib/rbac/config'

// Check if a user can access a route
const accessCheck = canAccessRoute('/admin/dashboard', 'admin')
if (!accessCheck.allowed) {
  console.log(accessCheck.reason) // "Admin access required..."
}
```

**Key Functions:**
- `canAccessRoute(path, role)` - Check route access with detailed reason
- `isAdminRoute(path)` - Check if route is admin-only
- `isOwnerRoute(path)` - Check if route is owner-only
- `isRenterRoute(path)` - Check if route is renter-only
- `isSharedRoute(path)` - Check if route is shared
- `isPublicRoute(path)` - Check if route is public
- `getDashboardRoute(role)` - Get role-specific dashboard route

### 2. Middleware Protection (`middleware.ts`)

The middleware enforces RBAC at the edge, before requests reach the application:

```typescript
// STRICT RBAC: Check route access based on role
const accessCheck = canAccessRoute(path, userRole as UserRole)

if (!accessCheck.allowed) {
  // Redirect to unauthorized page with reason
  const unauthorizedUrl = new URL('/unauthorized', req.url)
  unauthorizedUrl.searchParams.set('reason', accessCheck.reason || 'Access denied')
  unauthorizedUrl.searchParams.set('path', path)
  return NextResponse.redirect(unauthorizedUrl)
}
```

**Features:**
- Runs before every request
- Checks role-based access
- Redirects unauthorized users to `/unauthorized` with detailed error message
- Handles onboarding flow
- Manages auth page redirects

### 3. Component-Level Protection (`AuthGuard.tsx`)

Use `AuthGuard` to protect individual components:

```typescript
import { AdminGuard, OwnerGuard, RenterGuard, RequireAuth } from '@/components/auth/auth-guard'

// Protect admin-only pages
<AdminGuard>
  <AdminDashboard />
</AdminGuard>

// Protect owner-only pages
<OwnerGuard>
  <OwnerDashboard />
</OwnerGuard>

// Protect renter-only pages
<RenterGuard>
  <RenterDashboard />
</RenterGuard>

// Require authentication (any role)
<RequireAuth>
  <SharedPage />
</RequireAuth>
```

**Features:**
- Client-side protection
- Automatic redirect to `/unauthorized` on access denial
- Loading states during auth check
- Uses centralized RBAC system

### 4. Unauthorized Page (`src/app/unauthorized/page.tsx`)

Enhanced unauthorized page that:
- Displays HTTP 403 status
- Shows detailed reason for access denial
- Displays attempted path
- Shows user's current role
- Provides navigation options (dashboard, go back, profile)

## Usage Examples

### Example 1: Protecting an Admin Page

```typescript
// src/app/admin/users/page.tsx
import { AdminGuard } from '@/components/auth/auth-guard'

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <div>
        <h1>User Management</h1>
        {/* Admin-only content */}
      </div>
    </AdminGuard>
  )
}
```

### Example 2: Protecting an Owner Page

```typescript
// src/app/owner/vehicles/page.tsx
import { OwnerGuard } from '@/components/auth/auth-guard'

export default function OwnerVehiclesPage() {
  return (
    <OwnerGuard>
      <div>
        <h1>My Vehicles</h1>
        {/* Owner-only content */}
      </div>
    </OwnerGuard>
  )
}
```

### Example 3: Protecting a Renter Page

```typescript
// src/app/dashboard/bookings/page.tsx
import { RenterGuard } from '@/components/auth/auth-guard'

export default function RenterBookingsPage() {
  return (
    <RenterGuard>
      <div>
        <h1>My Bookings</h1>
        {/* Renter-only content */}
      </div>
    </RenterGuard>
  )
}
```

### Example 4: Shared Page (All Authenticated Users)

```typescript
// src/app/profile/page.tsx
import { RequireAuth } from '@/components/auth/auth-guard'

export default function ProfilePage() {
  return (
    <RequireAuth>
      <div>
        <h1>My Profile</h1>
        {/* Accessible to Admin, Owner, and Renter */}
      </div>
    </RequireAuth>
  )
}
```

### Example 5: Programmatic Access Check

```typescript
import { canAccessRoute } from '@/lib/rbac/config'
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { profile } = useAuth()
  const userRole = profile?.role || null
  
  const handleNavigate = (path: string) => {
    const accessCheck = canAccessRoute(path, userRole)
    
    if (!accessCheck.allowed) {
      alert(accessCheck.reason)
      return
    }
    
    router.push(path)
  }
  
  return (
    <button onClick={() => handleNavigate('/admin/dashboard')}>
      Go to Admin Dashboard
    </button>
  )
}
```

## Access Control Rules Summary

| Route Pattern | Admin | Owner | Renter | Unauthenticated |
|---------------|-------|------|--------|-----------------|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/owner/*` | ❌ | ✅ | ❌ | ❌ |
| `/dashboard/*` | ❌ | ❌ | ✅ | ❌ |
| `/favorites` | ❌ | ❌ | ✅ | ❌ |
| `/messages` | ❌ | ❌ | ✅ | ❌ |
| `/profile` | ✅ | ✅ | ✅ | ❌ |
| `/support` | ✅ | ✅ | ✅ | ❌ |
| `/` (home) | ✅* | ✅* | ✅ | ✅ |
| `/vehicles` | ✅ | ✅ | ✅ | ✅ |

*Admin and Owner are redirected to their dashboards from home page

## Security Features

### 1. Strict Role Separation
- Admin **cannot** access Owner or Renter routes
- Owner **cannot** access Admin or Renter routes
- Renter **cannot** access Admin or Owner routes

### 2. Multi-Layer Protection
- **Middleware**: Server-side route protection
- **Component Guards**: Client-side component protection
- **Database RLS**: Data-level security (existing)

### 3. Detailed Error Messages
- Unauthorized access includes reason
- Shows attempted path
- Displays user's current role

### 4. Secure Session Validation
- Uses Supabase session management
- Role caching for performance
- Database fallback for role verification

## Testing

Comprehensive test suite in `src/lib/rbac/__tests__/config.test.ts` covers:
- Route detection (admin, owner, renter, shared, public)
- Access control for each role
- Unauthorized access scenarios
- Dashboard route generation
- Configuration validation

Run tests:
```bash
npm test src/lib/rbac/__tests__/config.test.ts
```

## Adding New Routes

### Adding a New Admin Route

1. Create the route: `src/app/admin/new-feature/page.tsx`
2. Protect with `AdminGuard`:
```typescript
import { AdminGuard } from '@/components/auth/auth-guard'

export default function NewFeaturePage() {
  return (
    <AdminGuard>
      {/* Content */}
    </AdminGuard>
  )
}
```
3. Middleware automatically protects `/admin/*` routes

### Adding a New Shared Route

1. Add to `SHARED_ROUTES` in `src/lib/rbac/config.ts`:
```typescript
export const SHARED_ROUTES = [
  '/profile',
  '/support',
  '/new-shared-page', // Add here
] as const
```
2. Create the route: `src/app/new-shared-page/page.tsx`
3. Protect with `RequireAuth`:
```typescript
import { RequireAuth } from '@/components/auth/auth-guard'

export default function NewSharedPage() {
  return (
    <RequireAuth>
      {/* Content accessible to all authenticated users */}
    </RequireAuth>
  )
}
```

## Troubleshooting

### Issue: User can access unauthorized route

**Check:**
1. Verify middleware is running (check console logs)
2. Verify role is correctly set in database
3. Check if route matches expected pattern
4. Verify `canAccessRoute()` logic

### Issue: Unauthorized page not showing reason

**Check:**
1. Verify URL parameters are being passed correctly
2. Check `unauthorized/page.tsx` for parameter reading
3. Verify `accessCheck.reason` is set

### Issue: Shared route not accessible

**Check:**
1. Verify route is in `SHARED_ROUTES` array
2. Check `isSharedRoute()` function logic
3. Verify user is authenticated (not null or 'pending')

## Best Practices

1. **Always use centralized RBAC functions** - Don't duplicate access logic
2. **Protect at multiple layers** - Use both middleware and component guards
3. **Test access control** - Verify all role combinations
4. **Document shared routes** - Keep `SHARED_ROUTES` updated
5. **Use TypeScript** - Leverage type safety for roles
6. **Provide clear error messages** - Help users understand access denial

## Files Modified/Created

### New Files
- `src/lib/rbac/config.ts` - Centralized RBAC configuration
- `src/lib/rbac/__tests__/config.test.ts` - RBAC tests
- `docs/RBAC_IMPLEMENTATION.md` - This documentation

### Modified Files
- `middleware.ts` - Updated to use centralized RBAC
- `src/components/auth/auth-guard.tsx` - Updated for strict role separation
- `src/app/unauthorized/page.tsx` - Enhanced with better UX

## Conclusion

The RBAC system provides:
- ✅ Strict role separation
- ✅ Multi-layer security
- ✅ Centralized configuration
- ✅ Comprehensive testing
- ✅ Clear error messages
- ✅ Easy to maintain and extend

All requirements have been met:
- Admin cannot access Owner or Renter pages
- Owner cannot access Admin or Renter pages
- Renter cannot access Admin or Owner pages
- Shared pages accessible to all authenticated users
- Proper 403 Unauthorized responses
- Secure and maintainable implementation

