# JuanRide Data Flow Diagrams - Index

**Complete System Flow Documentation**

---

## Overview

This documentation provides comprehensive Data Flow Diagrams (DFDs) for all 8 core system flows in the JuanRide platform. Each diagram is traced from actual code execution paths, with specific file and line number references.

---

## Quick Navigation

### [Part 1: Authentication & Discovery](./DATA_FLOW_DIAGRAMS_PART1.md)

**DFD 1: User Signup & Profile Creation**
- User registration with email/password
- Supabase Auth integration
- Profile creation in database
- Welcome email notification
- Role-based redirect (renter/owner)

**DFD 2: Vehicle Search & Availability Filtering**
- Dynamic search filters (type, price, location)
- Database query construction
- Booking conflict detection
- Blocked dates validation
- Available vehicle display

---

### [Part 2: Booking & Payments](./DATA_FLOW_DIAGRAMS_PART2.md)

**DFD 3: Booking Creation & Checkout**
- Vehicle selection to checkout
- Pricing tier calculation (day/week/month)
- Platform fee computation (10%)
- Booking record creation
- Payment initialization

**DFD 4: PayMongo Payment Processing**
- Payment method selection (GCash/Maya/Card)
- PayMongo API integration
- Payment source creation
- Gateway redirect & processing
- Payment confirmation & booking update
- Email notifications

---

### [Part 3: Communication, Listings & Security](./DATA_FLOW_DIAGRAMS_PART3.md)

**DFD 5: Real-time Chat Messaging**
- WebSocket subscription setup
- Message sending & database insert
- Realtime broadcast to subscribers
- Instant message display (both users)

**DFD 6: Owner Vehicle Listing Creation**
- Vehicle details form submission
- Multiple image upload to storage
- Vehicle record creation (pending approval)
- Admin notification
- Admin approval workflow

**DFD 7: Admin Dashboard Analytics**
- Parallel data fetching (users, vehicles, bookings)
- Statistics aggregation & calculations
- Growth rate computation
- Revenue analytics
- Recent activity feed

**DFD 8: Middleware Role-Based Authorization**
- Session validation (JWT)
- User role cache lookup
- Route protection logic
- Authorization enforcement
- Redirect on access denial

---

## Key Technologies Mapped

### Frontend Layer
- **Next.js 14** - App Router, Server Components
- **React Query** - Data fetching & caching
- **TypeScript** - Type safety throughout

### Backend Layer
- **Next.js API Routes** - Server-side logic
- **Supabase Client** - Database operations

### Database Layer
- **PostgreSQL** - Relational data storage
- **Row Level Security (RLS)** - Data access control

### Real-time Layer
- **Supabase Realtime** - WebSocket subscriptions
- **Database Triggers** - Event broadcasting

### Authentication
- **Supabase Auth** - User management
- **JWT Sessions** - Secure authentication
- **Middleware** - Route protection

### External Services
- **PayMongo API** - Payment processing
- **Supabase Storage** - File hosting (images)
- **Email Service** - Notifications

---

## How to Use This Documentation

### For Developers
1. **Understanding Code Flow**: Each DFD shows the complete journey of data through the system
2. **Debugging**: Trace issues by following the flow from start to finish
3. **Code References**: File paths and line numbers point to actual implementation
4. **Integration**: See how different services connect and communicate

### For System Design
1. **Architecture Review**: Understand system structure and dependencies
2. **Security Analysis**: See where authentication and authorization occur
3. **Performance Optimization**: Identify bottlenecks in data flow
4. **Feature Planning**: Use as reference for new feature design

### For Documentation
1. **Onboarding**: Help new developers understand the system
2. **Technical Specifications**: Reference for technical documentation
3. **API Documentation**: See how endpoints are called and data flows
4. **Testing Strategy**: Identify test points along each flow

---

## Data Flow Patterns

### Synchronous Flows
- User Signup (DFD 1)
- Vehicle Search (DFD 2)
- Booking Creation (DFD 3)
- Vehicle Listing (DFD 6)
- Admin Dashboard (DFD 7)

### Asynchronous Flows
- Real-time Chat (DFD 5) - WebSocket
- Payment Processing (DFD 4) - Callback/Redirect

### Security Flows
- Middleware Authorization (DFD 8) - Every request
- Session Validation - All authenticated flows

---

## Database Tables Referenced

| Table | Used In DFDs | Purpose |
|-------|--------------|---------|
| `users` | 1, 2, 7, 8 | User profiles & roles |
| `vehicles` | 2, 6, 7 | Vehicle listings |
| `bookings` | 2, 3, 4, 5, 7 | Rental bookings |
| `payments` | 3, 4, 7 | Payment records |
| `messages` | 5 | Chat messages |
| `blocked_dates` | 2, 6 | Owner unavailability |

---

## Code Locations Quick Reference

### Core Files
- `src/app/(auth)/signup/page.tsx` - User registration
- `src/contexts/auth-context.tsx` - Auth logic
- `src/components/vehicle/VehicleGrid.tsx` - Vehicle search UI
- `src/lib/supabase/queries/vehicles.ts` - Vehicle queries
- `src/lib/supabase/queries/bookings.ts` - Booking queries
- `src/app/checkout/page.tsx` - Checkout flow
- `src/lib/payment/paymongo.ts` - Payment integration
- `src/lib/supabase/realtime.ts` - Chat system
- `src/app/messages/[bookingId]/page.tsx` - Chat UI
- `src/app/owner/vehicles/new/page.tsx` - Listing creation
- `src/lib/supabase/storage.ts` - File uploads
- `src/app/admin/dashboard/page.tsx` - Admin analytics
- `middleware.ts` - Route protection

---

## Related Documentation

- **[System Overview](./PART1_SYSTEM_OVERVIEW.md)** - Technology stack & architecture
- **[Technical Implementation](./PART2_TECHNICAL_IMPLEMENTATION.md)** - Code details
- **[Feature Deep-Dive](./PART3_FEATURE_IMPLEMENTATION.md)** - Feature breakdown
- **[Business Strategy](./PART4_BUSINESS_STRATEGY.md)** - Business model
- **[Defense Guide](./PART5_DEFENSE_GUIDE.md)** - Q&A preparation

---

**Last Updated:** November 18, 2025  
**Version:** 1.0  
**Status:** Complete - All 8 core flows documented
