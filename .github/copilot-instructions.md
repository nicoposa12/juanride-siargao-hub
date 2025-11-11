# JuanRide AI Coding Agent Instructions

## Project Overview

JuanRide is a vehicle rental marketplace for Siargao Island, Philippines. Built with Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), and Tailwind CSS. Three user roles: **renters**, **owners** (fleet managers), and **admins**.

## Critical Architecture Patterns

### Supabase Client Pattern (IMPORTANT)
**Always use singleton pattern to prevent client recreation:**

```typescript
// ✅ Client components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// ✅ Server components
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

**Never** instantiate Supabase directly with `createClientComponentClient()` - always use our wrapper functions.

### Authentication & Role-Based Access

- **Middleware** (`middleware.ts`) enforces role-based routing at the edge
- **RLS policies** in database provide defense-in-depth security
- Three roles: `renter`, `owner`, `admin`
- Owner dashboard at `/owner/*`, admin at `/admin/*`, renter at `/dashboard` or `/messages`

**Role checking pattern:**
```typescript
const { user } = useAuth()
// User profile includes role: user.role === 'owner' | 'renter' | 'admin'
```

### Database Schema

**Key tables:**
- `users` - Extended auth.users with role, phone, verification
- `vehicles` - Vehicle listings (owner_id FK)
- `bookings` - Rental bookings linking renters to vehicles
- `payments` - Payment records tied to bookings
- `reviews` - Rating/review system
- `messages` - Real-time chat between renters and owners
- `notifications` - In-app notification system
- `favorites` - User saved vehicles
- `maintenance_logs` - Owner maintenance tracking
- `blocked_dates` - Owner availability management

**Always respect RLS policies** - users can only see/modify data they own unless admin.

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
```

### Supabase Workflow
```bash
# Generate types after schema changes
npm run supabase:gen-types
# This updates src/types/database.types.ts
```

**Schema migrations** live in `supabase/migrations/` - numbered SQL files. When modifying schema, create new migration files rather than editing existing ones.

## Code Conventions

### Component Structure (from `.cursor/rules/juan.mdc`)
- **Functional components only** - no classes
- **Named exports** preferred over default exports
- **File naming:** PascalCase for components (`VehicleCard.tsx`), camelCase for utilities (`formatDate.ts`)
- **Directory naming:** kebab-case (`vehicle-search/`)

### Form Handling
Always use React Hook Form + Zod for validation:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ /* ... */ })
const form = useForm({ resolver: zodResolver(schema) })
```

### State Management
- **Server state:** TanStack Query (`useQuery`, `useMutation`) - see `src/hooks/use-vehicles.ts`, `use-bookings.ts`
- **Client state:** React Context for auth (`src/contexts/auth-context.tsx`)
- **No Redux** - use React Query for API data, Context for global UI state

### Constants Pattern
Centralized in `src/lib/constants.ts`:
```typescript
import { VEHICLE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from '@/lib/constants'
```

**Always use constants** for enum-like values, never hardcode strings like `'pending'` or `'scooter'`.

## UI Component Library (Shadcn/UI)

Base components in `src/components/ui/` - **never modify these directly**. For customization, create wrapper components in feature directories (`src/components/vehicle/`, `booking/`, etc.).

**Styling:** Tailwind utility classes + `cn()` helper:
```typescript
import { cn } from '@/lib/utils/cn'
<div className={cn("base-classes", conditional && "conditional-classes")} />
```

## Key Integrations

### Payment Processing
**Mock implementations** for MVP (GCash, Maya). Structure in place at `src/lib/payment/` but **not production-ready**. When implementing:
- Use Edge Functions in `supabase/functions/` for sensitive operations
- Webhook handlers go in `src/app/api/payments/webhook/route.ts`

### Real-time Features
Chat and notifications use Supabase Realtime:
```typescript
// See src/lib/supabase/realtime.ts for patterns
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler)
  .subscribe()
```

### File Uploads
Images stored in Supabase Storage buckets:
- `vehicle-images` (public)
- `profile-images` (public)
- `user-documents` (private - for ID verification)

**Image upload pattern:** See `src/components/owner/ImageUploader.tsx`

## Testing Strategy

**Current state:** Basic structure in place but **not fully implemented**. When writing tests:
- Unit tests: `tests/unit/` for utilities and hooks
- Integration: `tests/integration/` for API routes
- E2E: `tests/e2e/` for complete user flows (Playwright)

## Common Pitfalls

1. **Don't recreate Supabase clients** - use singleton wrappers
2. **Don't bypass RLS** - respect database security policies
3. **Check role before rendering** owner/admin UI - middleware protects routes but UI should also respect roles
4. **Date handling:** Use `date-fns` for formatting, PostgreSQL stores UTC timestamps
5. **Philippine context:** Prices in PHP (₱), phone numbers start with +63, GCash/Maya are primary payment methods
6. **Image optimization:** Always use Next.js `<Image>` component with proper sizing

## Project Status (from `IMPLEMENTATION_STATUS.md`)

**✅ Complete:**
- Database schema with RLS policies
- Authentication system (login/signup/password reset)
- Middleware-based role protection
- Base UI components (Shadcn/UI)

**🚧 In Progress / Next:**
- Vehicle search and filtering
- Booking flow
- Owner dashboard features
- Admin panel
- Payment integration (structure exists, needs production implementation)

## Documentation References

- **PRD:** `docs/prd.md` - Product requirements
- **Tech Stack:** `docs/tech-stack.md` - Technology decisions and rationale
- **Project Structure:** `docs/project-structure.md` - Complete directory guide
- **Implementation Status:** `docs/IMPLEMENTATION_STATUS.md` - Feature completion tracker

## Quick File Locations

- **Auth context:** `src/contexts/auth-context.tsx`
- **Auth hook:** `src/hooks/use-auth.ts`
- **Supabase clients:** `src/lib/supabase/{client,server}.ts`
- **Type definitions:** `src/types/` (especially `database.types.ts` - auto-generated)
- **Migrations:** `supabase/migrations/`
- **Constants:** `src/lib/constants.ts`
- **Utilities:** `src/lib/utils/` (formatting, validation, etc.)

## When Making Changes

1. **Schema changes:** Create new migration in `supabase/migrations/`, then run `npm run supabase:gen-types`
2. **New features:** Check `docs/IMPLEMENTATION_STATUS.md` for context on what's done vs planned
3. **Components:** Follow atomic structure - use existing UI components from `src/components/ui/`
4. **API routes:** Follow Next.js App Router patterns in `src/app/api/`
5. **Type safety:** Leverage TypeScript strictly - no `any` types without justification
