# JuanRide Project Structure Documentation

## Repository Structure Overview

JuanRide uses a modern Next.js 14 monorepo structure optimized for full-stack development with Supabase as the backend. This document outlines the complete project organization and explains the purpose of each directory and major file.

---

## Root Directory Structure

```
juanride-siargao-hub/
├── .github/                     # GitHub specific files
│   └── workflows/               # GitHub Actions CI/CD
│       ├── lint.yml            # Code linting workflow
│       ├── test.yml            # Testing workflow
│       └── deploy.yml          # Deployment workflow
│
├── docs/                        # Project documentation
│   ├── prd.md                  # Product Requirements Document
│   ├── project-overview.md     # High-level project overview
│   ├── features.md             # Feature specifications
│   ├── requirements.md         # Functional & non-functional requirements
│   ├── tech-stack.md           # Technology stack documentation
│   ├── user-flow.md            # User journey documentation
│   ├── implementation.md       # Implementation guide
│   └── project-structure.md    # This file
│
├── public/                      # Static assets
│   ├── images/                 # Public images
│   │   ├── logo.svg
│   │   ├── hero-siargao.jpg
│   │   └── placeholder.svg
│   ├── favicon.ico
│   └── robots.txt
│
├── src/                        # Source code
│   ├── app/                    # Next.js 14 App Router
│   ├── components/             # React components
│   ├── lib/                    # Utility libraries
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles
│
├── supabase/                   # Supabase configuration
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge Functions
│   └── config.toml             # Supabase configuration
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
│
├── .env.local                  # Environment variables (not committed)
├── .env.example               # Example environment variables
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .gitignore                 # Git ignore rules
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # NPM dependencies and scripts
├── package-lock.json          # Locked dependency versions
└── README.md                  # Project README
```

---

## Detailed Source Code Structure (`src/`)

### App Router (`src/app/`)

The App Router follows Next.js 14 conventions with route groups for better organization.

```
src/app/
├── (public)/                   # Public route group (no auth required)
│   ├── page.tsx               # Homepage (landing page)
│   ├── about/
│   │   └── page.tsx           # About page
│   ├── contact/
│   │   └── page.tsx           # Contact page
│   └── layout.tsx             # Public layout wrapper
│
├── (auth)/                     # Authentication route group
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── signup/
│   │   └── page.tsx           # Sign up page
│   ├── forgot-password/
│   │   └── page.tsx           # Password reset
│   ├── reset-password/
│   │   └── page.tsx           # Password reset confirmation
│   └── layout.tsx             # Auth layout (centered, minimal)
│
├── vehicles/                   # Vehicle browsing (public)
│   ├── page.tsx               # Vehicle search/listing page
│   ├── [id]/                  # Dynamic route for vehicle details
│   │   ├── page.tsx           # Vehicle detail page
│   │   └── loading.tsx        # Loading state
│   └── search/
│       └── page.tsx           # Advanced search page
│
├── checkout/                   # Booking checkout flow
│   ├── [bookingId]/
│   │   ├── page.tsx           # Checkout page
│   │   └── success/
│   │       └── page.tsx       # Booking success confirmation
│   └── layout.tsx
│
├── (renter)/                   # Renter dashboard (protected)
│   ├── my-bookings/
│   │   ├── page.tsx           # Bookings list
│   │   ├── [id]/
│   │   │   └── page.tsx       # Booking details
│   │   └── loading.tsx
│   ├── favorites/
│   │   └── page.tsx           # Saved favorite vehicles
│   ├── profile/
│   │   └── page.tsx           # Renter profile settings
│   ├── reviews/
│   │   └── page.tsx           # Reviews to write
│   └── layout.tsx             # Renter dashboard layout
│
├── (owner)/                    # Owner dashboard (protected)
│   ├── dashboard/
│   │   └── page.tsx           # Owner main dashboard
│   ├── vehicles/
│   │   ├── page.tsx           # Owner's vehicle list
│   │   ├── new/
│   │   │   └── page.tsx       # Create new listing
│   │   ├── [id]/
│   │   │   ├── page.tsx       # Edit vehicle listing
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx   # Vehicle booking history
│   │   │   └── analytics/
│   │   │       └── page.tsx   # Vehicle performance analytics
│   │   └── loading.tsx
│   ├── bookings/
│   │   ├── page.tsx           # All bookings management
│   │   ├── [id]/
│   │   │   └── page.tsx       # Individual booking management
│   │   ├── upcoming/
│   │   │   └── page.tsx       # Upcoming pickups/returns
│   │   └── history/
│   │       └── page.tsx       # Completed bookings
│   ├── earnings/
│   │   ├── page.tsx           # Revenue dashboard
│   │   └── payouts/
│   │       └── page.tsx       # Payout history
│   ├── maintenance/
│   │   ├── page.tsx           # Maintenance schedule
│   │   └── [vehicleId]/
│   │       └── page.tsx       # Vehicle maintenance log
│   ├── gps-tracking/
│   │   └── page.tsx           # GPS tracking dashboard
│   ├── messages/
│   │   └── page.tsx           # Chat with renters
│   ├── settings/
│   │   └── page.tsx           # Owner settings
│   └── layout.tsx             # Owner dashboard layout
│
├── (admin)/                    # Admin panel (protected, admin only)
│   ├── dashboard/
│   │   └── page.tsx           # Admin main dashboard
│   ├── users/
│   │   ├── page.tsx           # User management
│   │   ├── [id]/
│   │   │   └── page.tsx       # User details/edit
│   │   ├── renters/
│   │   │   └── page.tsx       # Renter list
│   │   └── owners/
│   │       └── page.tsx       # Owner list
│   ├── listings/
│   │   ├── page.tsx           # All listings
│   │   ├── pending/
│   │   │   └── page.tsx       # Pending approvals queue
│   │   ├── active/
│   │   │   └── page.tsx       # Active listings
│   │   └── [id]/
│   │       └── page.tsx       # Listing review/edit
│   ├── bookings/
│   │   ├── page.tsx           # All bookings
│   │   └── [id]/
│   │       └── page.tsx       # Booking details
│   ├── transactions/
│   │   ├── page.tsx           # Transaction list
│   │   └── [id]/
│   │       └── page.tsx       # Transaction details
│   ├── disputes/
│   │   ├── page.tsx           # Dispute queue
│   │   └── [id]/
│   │       └── page.tsx       # Dispute resolution
│   ├── reviews/
│   │   ├── page.tsx           # Review moderation
│   │   └── flagged/
│   │       └── page.tsx       # Flagged reviews
│   ├── analytics/
│   │   ├── page.tsx           # Platform analytics
│   │   ├── revenue/
│   │   │   └── page.tsx       # Revenue analytics
│   │   └── users/
│   │       └── page.tsx       # User analytics
│   ├── settings/
│   │   ├── page.tsx           # Platform settings
│   │   ├── policies/
│   │   │   └── page.tsx       # Booking policies
│   │   └── payments/
│   │       └── page.tsx       # Payment gateway config
│   └── layout.tsx             # Admin panel layout
│
├── api/                        # API routes
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # Auth callback handler
│   ├── bookings/
│   │   ├── route.ts           # Create/list bookings
│   │   ├── [id]/
│   │   │   └── route.ts       # Update/delete booking
│   │   └── availability/
│   │       └── route.ts       # Check availability
│   ├── payments/
│   │   ├── route.ts           # Process payment
│   │   └── webhook/
│   │       └── route.ts       # Payment webhook handler
│   ├── vehicles/
│   │   ├── route.ts           # List vehicles
│   │   └── [id]/
│   │       └── route.ts       # Vehicle CRUD
│   ├── upload/
│   │   └── route.ts           # Image upload handler
│   └── notifications/
│       └── send/
│           └── route.ts       # Send notifications
│
├── layout.tsx                  # Root layout (global)
├── loading.tsx                 # Global loading state
├── error.tsx                   # Global error boundary
├── not-found.tsx              # 404 page
└── globals.css                # Global CSS imports
```

---

### Components (`src/components/`)

```
src/components/
├── ui/                         # Shadcn/UI base components
│   ├── button.tsx             # Button component
│   ├── card.tsx               # Card component
│   ├── input.tsx              # Input field
│   ├── label.tsx              # Form label
│   ├── dialog.tsx             # Modal dialog
│   ├── dropdown-menu.tsx      # Dropdown menu
│   ├── calendar.tsx           # Date picker calendar
│   ├── badge.tsx              # Badge/tag component
│   ├── avatar.tsx             # User avatar
│   ├── toast.tsx              # Toast notification
│   ├── table.tsx              # Data table
│   ├── tabs.tsx               # Tabs component
│   ├── select.tsx             # Select dropdown
│   ├── textarea.tsx           # Text area
│   ├── checkbox.tsx           # Checkbox
│   ├── radio-group.tsx        # Radio button group
│   ├── switch.tsx             # Toggle switch
│   ├── slider.tsx             # Range slider
│   ├── progress.tsx           # Progress bar
│   ├── skeleton.tsx           # Loading skeleton
│   └── separator.tsx          # Visual separator
│
├── layout/                     # Layout components
│   ├── Header.tsx             # Site header with navigation
│   ├── Footer.tsx             # Site footer
│   ├── Sidebar.tsx            # Dashboard sidebar
│   ├── MobileNav.tsx          # Mobile navigation menu
│   └── Container.tsx          # Content container wrapper
│
├── vehicle/                    # Vehicle-related components
│   ├── VehicleCard.tsx        # Vehicle listing card
│   ├── VehicleGrid.tsx        # Grid of vehicle cards
│   ├── VehicleList.tsx        # List view of vehicles
│   ├── VehicleGallery.tsx     # Image gallery for vehicle
│   ├── VehicleFilters.tsx     # Search filter sidebar
│   ├── VehicleDetails.tsx     # Vehicle information display
│   ├── VehicleSpecs.tsx       # Vehicle specifications
│   ├── VehicleReviews.tsx     # Reviews section
│   └── VehicleMap.tsx         # Location map
│
├── booking/                    # Booking components
│   ├── BookingWidget.tsx      # Sticky booking widget
│   ├── BookingCard.tsx        # Booking summary card
│   ├── BookingList.tsx        # List of bookings
│   ├── BookingDetails.tsx     # Detailed booking view
│   ├── BookingStatus.tsx      # Status indicator
│   ├── DateRangePicker.tsx    # Rental date picker
│   ├── PriceBreakdown.tsx     # Price calculation display
│   └── BookingTimeline.tsx    # Booking lifecycle timeline
│
├── payment/                    # Payment components
│   ├── PaymentMethods.tsx     # Payment method selection
│   ├── PaymentForm.tsx        # Payment details form
│   ├── PaymentStatus.tsx      # Payment status indicator
│   └── Receipt.tsx            # Payment receipt
│
├── review/                     # Review components
│   ├── ReviewCard.tsx         # Single review display
│   ├── ReviewList.tsx         # List of reviews
│   ├── ReviewForm.tsx         # Review submission form
│   ├── RatingStars.tsx        # Star rating display
│   └── ReviewStats.tsx        # Review statistics
│
├── owner/                      # Owner dashboard components
│   ├── FleetOverview.tsx      # Fleet status overview
│   ├── FleetCalendar.tsx      # Booking calendar view
│   ├── BookingManagement.tsx  # Booking management table
│   ├── RevenueChart.tsx       # Revenue visualization
│   ├── EarningsOverview.tsx   # Earnings summary
│   ├── VehicleForm.tsx        # Vehicle listing form
│   ├── ImageUploader.tsx      # Multi-image uploader
│   ├── MaintenanceForm.tsx    # Maintenance scheduling
│   ├── GPSTracker.tsx         # GPS tracking map
│   └── OwnerStats.tsx         # Owner statistics
│
├── admin/                      # Admin panel components
│   ├── UserTable.tsx          # User management table
│   ├── ListingApproval.tsx    # Listing approval card
│   ├── DisputeResolution.tsx  # Dispute handling interface
│   ├── PlatformStats.tsx      # Platform-wide statistics
│   ├── RevenueAnalytics.tsx   # Revenue analytics dashboard
│   ├── ModerationQueue.tsx    # Content moderation queue
│   └── SystemSettings.tsx     # System configuration
│
├── chat/                       # Chat components
│   ├── ChatWindow.tsx         # Main chat interface
│   ├── ChatList.tsx           # Conversation list
│   ├── ChatMessage.tsx        # Individual message
│   └── ChatInput.tsx          # Message input field
│
├── forms/                      # Form components
│   ├── LoginForm.tsx          # Login form
│   ├── SignUpForm.tsx         # Registration form
│   ├── ProfileForm.tsx        # Profile edit form
│   ├── SearchForm.tsx         # Vehicle search form
│   └── ContactForm.tsx        # Contact support form
│
├── shared/                     # Shared/common components
│   ├── LoadingSpinner.tsx     # Loading indicator
│   ├── ErrorMessage.tsx       # Error display
│   ├── EmptyState.tsx         # Empty state placeholder
│   ├── Pagination.tsx         # Pagination controls
│   ├── SearchBar.tsx          # Global search
│   ├── Breadcrumbs.tsx        # Breadcrumb navigation
│   ├── StatusBadge.tsx        # Generic status badge
│   ├── ImageWithFallback.tsx  # Image with error handling
│   └── ConfirmDialog.tsx      # Confirmation modal
│
└── providers/                  # Context providers
    ├── AuthProvider.tsx        # Authentication context
    ├── ThemeProvider.tsx       # Theme context
    └── ToastProvider.tsx       # Toast notification context
```

---

### Library Code (`src/lib/`)

```
src/lib/
├── supabase/                   # Supabase integration
│   ├── client.ts              # Browser Supabase client
│   ├── server.ts              # Server Supabase client
│   ├── middleware.ts          # Auth middleware
│   ├── auth.ts                # Authentication helpers
│   ├── storage.ts             # File storage helpers
│   └── queries/               # Database query functions
│       ├── vehicles.ts        # Vehicle queries
│       ├── bookings.ts        # Booking queries
│       ├── users.ts           # User queries
│       ├── reviews.ts         # Review queries
│       └── payments.ts        # Payment queries
│
├── utils/                      # Utility functions
│   ├── cn.ts                  # Class name merger (tailwind)
│   ├── format.ts              # Formatting utilities
│   │   ├── formatCurrency()   # Format PHP currency
│   │   ├── formatDate()       # Date formatting
│   │   └── formatPhoneNumber()# Phone formatting
│   ├── validation.ts          # Validation helpers
│   │   ├── validateEmail()
│   │   ├── validatePhone()
│   │   └── validatePlateNumber()
│   ├── pricing.ts             # Pricing calculations
│   │   ├── calculateTotalPrice()
│   │   ├── calculateDays()
│   │   └── applyDiscount()
│   ├── date.ts                # Date utilities
│   │   ├── isDateAvailable()
│   │   ├── getDateRange()
│   │   └── formatDateRange()
│   └── image.ts               # Image utilities
│       ├── compressImage()
│       └── getImageUrl()
│
├── constants.ts                # App-wide constants
│   ├── VEHICLE_TYPES
│   ├── BOOKING_STATUSES
│   ├── PAYMENT_METHODS
│   └── USER_ROLES
│
├── validations/                # Zod schemas
│   ├── vehicle.schema.ts      # Vehicle validation
│   ├── booking.schema.ts      # Booking validation
│   ├── user.schema.ts         # User validation
│   └── auth.schema.ts         # Auth validation
│
└── api/                        # API client helpers
    ├── client.ts              # Base API client
    ├── vehicles.ts            # Vehicle API calls
    ├── bookings.ts            # Booking API calls
    └── payments.ts            # Payment API calls
```

---

### Custom Hooks (`src/hooks/`)

```
src/hooks/
├── use-auth.ts                 # Authentication hook
├── use-user.ts                 # Current user data
├── use-vehicles.ts             # Vehicle data fetching
├── use-bookings.ts             # Booking management
├── use-reviews.ts              # Review handling
├── use-chat.ts                 # Real-time chat
├── use-toast.ts                # Toast notifications
├── use-mobile.ts               # Mobile detection
├── use-debounce.ts            # Debounce hook
├── use-media-query.ts         # Responsive breakpoints
└── use-local-storage.ts       # Local storage hook
```

---

### TypeScript Types (`src/types/`)

```
src/types/
├── database.types.ts           # Supabase generated types
├── vehicle.types.ts            # Vehicle types
│   ├── Vehicle
│   ├── VehicleType
│   ├── VehicleStatus
│   └── VehicleFilters
├── booking.types.ts            # Booking types
│   ├── Booking
│   ├── BookingStatus
│   ├── BookingRequest
│   └── BookingWithDetails
├── user.types.ts               # User types
│   ├── User
│   ├── UserRole
│   ├── OwnerProfile
│   └── RenterProfile
├── payment.types.ts            # Payment types
│   ├── Payment
│   ├── PaymentMethod
│   └── PaymentStatus
├── review.types.ts             # Review types
├── message.types.ts            # Chat message types
└── api.types.ts                # API response types
```

---

## Supabase Directory (`supabase/`)

```
supabase/
├── migrations/                 # Database migrations
│   ├── 00001_initial_schema.sql
│   ├── 00002_add_vehicles.sql
│   ├── 00003_add_bookings.sql
│   ├── 00004_add_payments.sql
│   ├── 00005_add_reviews.sql
│   ├── 00006_add_messages.sql
│   ├── 00007_add_rls_policies.sql
│   └── 00008_add_indexes.sql
│
├── functions/                  # Edge Functions
│   ├── process-payment/
│   │   └── index.ts           # Payment processing
│   ├── send-notification/
│   │   └── index.ts           # SMS/Email sending
│   ├── verify-booking/
│   │   └── index.ts           # Booking verification
│   └── generate-invoice/
│       └── index.ts           # Invoice generation
│
├── seed.sql                   # Database seed data
└── config.toml                # Supabase configuration
```

---

## Testing Directory (`tests/`)

```
tests/
├── unit/                       # Unit tests
│   ├── utils/
│   │   ├── pricing.test.ts
│   │   ├── format.test.ts
│   │   └── validation.test.ts
│   └── components/
│       ├── VehicleCard.test.tsx
│       └── BookingWidget.test.tsx
│
├── integration/                # Integration tests
│   ├── api/
│   │   ├── vehicles.test.ts
│   │   ├── bookings.test.ts
│   │   └── auth.test.ts
│   └── database/
│       └── queries.test.ts
│
└── e2e/                        # End-to-end tests
    ├── booking-flow.spec.ts   # Complete booking flow
    ├── owner-flow.spec.ts     # Owner workflows
    └── admin-flow.spec.ts     # Admin workflows
```

---

## Configuration Files

### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'your-supabase-project.supabase.co', // Supabase storage
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // JuanRide brand colors
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "supabase:gen-types": "supabase gen types typescript --project-id your-project-id > src/types/database.types.ts"
  }
}
```

---

## Key Architectural Decisions

### 1. **Next.js App Router**
- Uses the latest App Router (not Pages Router) for better performance
- Route groups for logical organization
- Server Components by default for better performance

### 2. **Supabase Backend**
- All backend logic handled by Supabase
- No separate Express/FastAPI backend needed
- Edge Functions for complex business logic

### 3. **TypeScript Throughout**
- Strict typing for better DX and fewer bugs
- Generated types from Supabase schema
- Type-safe API calls

### 4. **Component Organization**
- Atomic design principles (UI components, feature components)
- Clear separation of layout, feature, and UI components
- Shadcn/UI for consistent, accessible base components

### 5. **Route Protection**
- Middleware-based auth protection
- Route groups for different user types
- RLS policies in database for security

---

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `VehicleCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Pages: kebab-case folders with `page.tsx`

**Directories:**
- Feature-based (e.g., `vehicle/`, `booking/`)
- Grouped by function (e.g., `components/`, `hooks/`)

**Code:**
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

---

This structure provides a scalable, maintainable foundation for the JuanRide platform, supporting growth from MVP to full-featured application.
