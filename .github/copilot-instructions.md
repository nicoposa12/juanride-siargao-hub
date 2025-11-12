# JuanRide AI Coding Agent Instructions

## Project Overview

JuanRide is a vehicle rental marketplace for Siargao Island, Philippines. Built with **Next.js 14 (App Router)**, **TypeScript**, **Supabase (PostgreSQL)**, **Tailwind CSS**, and **Shadcn/UI**. Three user roles: **renters**, **owners** (fleet managers), and **admins**.

**Key context:** Philippine-focused (₱ PHP pricing, +63 phone format, GCash/Maya payments), tourism ecosystem for Siargao Island.

---

## Critical Architecture Patterns

### 🔴 Supabase Client Pattern (MUST FOLLOW)

**Always use singleton pattern - NEVER instantiate clients directly:**

```typescript
// ✅ Client components
import { supabase } from '@/supabase/config/supabaseClient'

// ✅ Server components/API routes
import { createServerClient } from '@/supabase/config/supabaseClient'

// ✅ Admin operations (server-side ONLY, bypasses RLS)
import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'

// ❌ NEVER DO THIS - violates singleton pattern
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient() // Creates new instance every render!
```

**Why it matters:** Creating new client instances causes auth session loss and performance issues. The singleton pattern ensures consistent auth state across the app.

### Database Operations Pattern

**Organized by domain in `/supabase/lib/` - queries (reads) vs mutations (writes):**

```typescript
// ✅ Preferred - Namespace imports for discoverability
import { VehicleQueries, VehicleMutations, StorageUtils } from '@/supabase'

const vehicles = await VehicleQueries.searchVehicles(filters, page, limit)
await VehicleMutations.createVehicle(data)
const url = await StorageUtils.uploadVehicleImage(file, vehicleId)

// ✅ Alternative - Direct imports
import { searchVehicles } from '@/supabase/lib/queries/vehicles'
import { createVehicle } from '@/supabase/lib/mutations/vehicles'

// ✅ Real-time subscriptions
import { RealtimeUtils } from '@/supabase'
const channel = RealtimeUtils.subscribeToBookingMessages(bookingId, callback)
```

**File organization:**
- **Queries:** `/supabase/lib/queries/{vehicles,bookings,reviews}.ts`
- **Mutations:** `/supabase/lib/mutations/{vehicles,bookings,reviews,users}.ts`
- **Utilities:** `/supabase/lib/{storage,realtime,utils}.ts`
- **Central export:** `/supabase/index.ts` (use this for namespace imports)

### State Management Architecture

**Three-layer approach - use the right tool for each layer:**

1. **Server state (API data):** TanStack Query (`@tanstack/react-query`)
   ```typescript
   // See src/hooks/use-vehicles.ts, use-bookings.ts for patterns
   export function useVehicles(filters?: VehicleFilters) {
     return useQuery({
       queryKey: ['vehicles', filters],
       queryFn: () => VehicleQueries.searchVehicles(filters),
       staleTime: 2 * 60 * 1000, // 2 minutes
     })
   }
   
   export function useCreateVehicle() {
     const queryClient = useQueryClient()
     return useMutation({
       mutationFn: VehicleMutations.createVehicle,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['vehicles'] })
       },
     })
   }
   ```

2. **Global client state:** React Context (auth, theme)
   ```typescript
   // See src/contexts/auth-context.tsx
   const { user, signIn, signOut, isLoading } = useAuth()
   ```

3. **Local component state:** React hooks (`useState`, `useReducer`)

**No Redux** - TanStack Query handles caching, background sync, optimistic updates for server data.

### Authentication & Role-Based Access

**Two-layer security (defense in depth):**

1. **Edge middleware** (`middleware.ts`) - Route protection before page loads
   ```typescript
   // Blocks unauthorized access at the edge
   // Owner routes: /owner/*
   // Admin routes: /admin/*
   // Renter routes: /dashboard, /messages, /profile
   ```

2. **RLS policies** - Database-level security (in `supabase/database/migrations/00002_rls_policies.sql`)
   ```sql
   -- Users can only see their own data
   CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
   -- Owners can manage their vehicles
   CREATE POLICY "Owners can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = owner_id);
   ```

**Role checking in components:**
```typescript
const { user } = useAuth()
// user.role is 'renter' | 'owner' | 'admin'

if (user?.role === 'owner') {
  // Show owner-specific UI
}
```

### Database Schema (Key Tables)

**Core domain models:**
- `users` - Extended profiles (FK to auth.users, includes role/phone/verification)
- `vehicles` - Listings (owner_id FK, status, pricing, specs)
- `bookings` - Rentals (renter_id, vehicle_id, dates, status)
- `payments` - Transactions (booking_id, method, amount, status)
- `reviews` - Ratings (booking_id, rating, comment)
- `messages` - Real-time chat (booking_id, sender/receiver)
- `notifications` - In-app alerts (user_id, type, read status)
- `favorites` - Saved vehicles (user_id, vehicle_id)
- `maintenance_logs` - Owner tracking (vehicle_id, service details)
- `blocked_dates` - Unavailable periods (vehicle_id, date range)

**All tables have RLS enabled** - never bypass unless using `supabaseAdmin` in secure server context.

---

## Development Workflow

### Essential Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation

# After schema changes in Supabase:
npm run supabase:gen-types
# Updates supabase/types/database.types.ts from your live database
```

### Database Migration Workflow

**Migrations are sequential, immutable SQL files in `/supabase/database/migrations/`:**

```bash
# 00001_initial_schema.sql    - Tables and relationships
# 00002_rls_policies.sql      - Security policies
# 00003_indexes.sql           - Performance indexes
# 00004_functions.sql         - Triggers and stored procedures
# 00005_add_*.sql             - Future changes (never edit existing files)
```

**When adding new tables/columns:**
1. Create new numbered migration file (00006_*.sql)
2. Apply in Supabase SQL Editor or via CLI
3. Run `npm run supabase:gen-types` to update TypeScript types
4. Add corresponding query/mutation functions in `/supabase/lib/`

**Testing migrations:** Use `/supabase/database/seeds/` for sample data.

---

## Code Conventions

### Component Architecture (enforced in `.cursor/rules/juan.mdc`)

- **Functional components only** - no classes
- **Named exports preferred** over default exports
- **File naming:**
  - Components: `PascalCase` (`VehicleCard.tsx`)
  - Utilities: `camelCase` (`formatDate.ts`)
  - Directories: `kebab-case` (`vehicle-search/`)
- **Component structure:** Exported component → subcomponents → helpers → static content → types

### Form Handling (Mandatory Pattern)

**Always use React Hook Form + Zod for validation:**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  price: z.number().min(0).max(10000),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', price: 0 },
})

// In component:
<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* Use Shadcn/UI form components */}
</form>
```

**See:** `src/components/owner/VehicleForm.tsx` for real example.

### Constants - Never Hardcode Strings

**Always import from `src/lib/constants.ts`:**

```typescript
import { VEHICLE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from '@/lib/constants'

// ✅ Good
if (status === BOOKING_STATUSES.PENDING) { ... }

// ❌ Bad
if (status === 'pending') { ... }  // What if we change the enum value?
```

**Why:** Single source of truth, prevents typos, makes refactoring safe.

### TypeScript - Leverage Database Types

```typescript
import type { Database } from '@/supabase/types/database.types'

// Auto-generated from your schema:
type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

// Extend for UI needs:
type VehicleWithOwner = Vehicle & {
  owner: { full_name: string; profile_image_url: string | null }
}
```

**No `any` types** without strong justification - use `unknown` and type guards instead.

---

## UI Component Library (Shadcn/UI)

**Base components in `src/components/ui/` - DO NOT MODIFY DIRECTLY.**

For customization, create wrapper components:

```typescript
// ❌ Don't edit src/components/ui/button.tsx

// ✅ Create custom wrapper
// src/components/shared/ActionButton.tsx
import { Button } from '@/components/ui/button'

export function ActionButton({ children, ...props }) {
  return <Button className="custom-styles" {...props}>{children}</Button>
}
```

**Styling pattern:**
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes text-base p-4",
  isPrimary && "bg-primary text-white",
  className // Allow overrides
)} />
```

**Available components:** Button, Input, Card, Dialog, Select, Tabs, Toast, Form, Table, Calendar, Avatar, Badge, Dropdown, etc.

---

## Key Integrations

### Image Handling (Next.js + Supabase Storage)

**Always use Next.js `<Image>` component with Supabase URLs:**

```typescript
import Image from 'next/image'

// next.config.js already configured for *.supabase.co domains
<Image
  src={vehicle.image_url}
  alt={vehicle.name}
  width={400}
  height={300}
  className="object-cover"
/>
```

**Upload pattern:**
```typescript
import { StorageUtils } from '@/supabase'

const imageUrl = await StorageUtils.uploadVehicleImage(file, vehicleId)
// Returns public URL like: https://xxx.supabase.co/storage/v1/object/public/vehicle-images/...
```

**Storage buckets:**
- `vehicle-images` (public, 5MB limit, images only)
- `profile-images` (public, 2MB limit, images only)
- `user-documents` (private, 10MB limit, images/PDFs for ID verification)

### Real-time Features (Chat & Notifications)

**Supabase Realtime subscriptions:**

```typescript
import { RealtimeUtils } from '@/supabase'

// Subscribe to messages
const channel = RealtimeUtils.subscribeToBookingMessages(
  bookingId,
  (message) => {
    console.log('New message:', message)
    // Update UI
  }
)

// Cleanup
await RealtimeUtils.unsubscribeChannel(channel)
```

**See:** `src/components/chat/ChatWindow.tsx` for full implementation.

### Payment Processing (Mock for MVP)

**Structure in place at `src/lib/payment/` but NOT production-ready:**

- GCash/Maya integrations are mock implementations
- Real webhooks would go in `src/app/api/payments/webhook/route.ts`
- Production requires Edge Functions in `supabase/functions/` for sensitive operations

**When implementing:**
1. Use Supabase Edge Functions for payment API calls
2. Store payment credentials in Supabase Vault (encrypted)
3. Validate webhook signatures server-side
4. Update payment/booking status atomically

---

## Common Pitfalls & Solutions

### 1. Supabase Client Anti-patterns

❌ **Creating new instances:**
```typescript
const supabase = createClientComponentClient() // Loses auth context!
```

✅ **Use singleton:**
```typescript
import { supabase } from '@/supabase/config/supabaseClient'
```

### 2. Bypassing RLS Accidentally

❌ **Using admin client in client components:**
```typescript
import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'
// NEVER expose this to client - bypasses all security!
```

✅ **Admin client only in API routes/server:**
```typescript
// src/app/api/admin/route.ts (server-side)
import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'
```

### 3. Date Handling Mistakes

**PostgreSQL stores UTC timestamps. Use `date-fns` for formatting:**

```typescript
import { format, parseISO } from 'date-fns'

// Database: '2025-01-15T10:30:00Z'
const date = parseISO(booking.start_date)
const display = format(date, 'MMM dd, yyyy') // "Jan 15, 2025"
```

### 4. Philippine Context Mistakes

❌ **Wrong currency format:**
```typescript
`$${price}` // American dollars
```

✅ **Philippine Pesos:**
```typescript
`₱${price.toLocaleString('en-PH')}` // ₱1,500
```

**Phone numbers:** Must start with `+63` (Philippines country code).

### 5. Forgetting to Invalidate Query Cache

**After mutations, invalidate relevant queries:**

```typescript
const { mutate } = useCreateVehicle()

const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['vehicles'] })
// Otherwise stale data shows until refetch
```

---

## Project Status (as of Nov 2025)

### ✅ Complete
- Database schema with RLS policies
- Authentication system (login/signup/password reset)
- Middleware-based role protection
- Supabase client architecture
- Base UI components (Shadcn/UI)
- Type generation from database

### 🚧 In Progress / Next Priority
- Vehicle search and filtering
- Booking flow (checkout, payment)
- Owner dashboard (fleet management, bookings, earnings)
- Admin panel (user/listing moderation, analytics)
- Real-time messaging
- Review system
- Notification system

**See:** `docs/summaries/IMPLEMENTATION_STATUS.md` for detailed feature checklist.

---

## Documentation References

- **PRD:** `docs/planning/prd.md` - Product requirements
- **Tech Stack:** `docs/planning/tech-stack.md` - Technology decisions
- **Project Structure:** `docs/implementation/project-structure.md` - Directory guide
- **Implementation Status:** `docs/summaries/IMPLEMENTATION_STATUS.md` - Feature tracker
- **Supabase Setup:** `supabase/README.md` - Database documentation

---

## Quick File Locations

### Supabase (Primary Database Layer)
- **Clients:** `/supabase/config/supabaseClient.ts`, `supabaseAdmin.ts`
- **Queries:** `/supabase/lib/queries/{vehicles,bookings,reviews}.ts`
- **Mutations:** `/supabase/lib/mutations/{vehicles,bookings,reviews,users}.ts`
- **Types:** `/supabase/types/database.types.ts` (auto-generated)
- **Utilities:** `/supabase/lib/{storage,realtime,utils}.ts`
- **Migrations:** `/supabase/database/migrations/` (numbered SQL files)
- **Seeds:** `/supabase/database/seeds/` (test data)

### Application Layer
- **Auth context:** `src/contexts/auth-context.tsx`
- **Auth hook:** `src/hooks/use-auth.ts`
- **Constants:** `src/lib/constants.ts`
- **Custom hooks:** `src/hooks/use-{vehicles,bookings,reviews}.ts`
- **Type definitions:** `src/types/{vehicle,booking,user}.types.ts`
- **Utilities:** `src/lib/utils/` (formatting, validation)

### Deprecated (Being Phased Out)
- `src/lib/supabase/*` - Old structure, use `/supabase/*` for new code

---

## When Making Changes

### Schema Changes
1. Create new migration: `/supabase/database/migrations/00006_your_change.sql`
2. Apply in Supabase SQL Editor
3. Run `npm run supabase:gen-types`
4. Add query/mutation functions in `/supabase/lib/queries/` or `/mutations/`
5. Update types in `src/types/` if needed

### New Database Operations
- Reads → `/supabase/lib/queries/{domain}.ts`
- Writes → `/supabase/lib/mutations/{domain}.ts`
- Export in `/supabase/lib/queries/index.ts` or `/mutations/index.ts`
- Re-export in `/supabase/index.ts` for namespace access

### New Features
1. Check `docs/summaries/IMPLEMENTATION_STATUS.md` for context
2. Use existing UI components from `src/components/ui/`
3. Create feature components in `src/components/{domain}/`
4. Add routes in `src/app/{domain}/`
5. Follow Next.js App Router conventions

### API Routes
- Place in `src/app/api/{domain}/route.ts`
- Use `createServerClient()` for auth context
- Use `supabaseAdmin` only for admin operations (verify user role first)

---

**Last Updated:** November 2025  
**Maintained by:** JuanRide Development Team