# JuanRide Siargao Hub - Data Flow Diagrams (Part 3)

**Version 1.0 | Date: November 18, 2025**

**Covers:** Real-time Chat, Vehicle Listing, Admin Dashboard & Security Flows

---

## DFD 5: Real-time Chat Messaging System

**Trace:** WebSocket Subscribe → Send Message → Database → Broadcast → Display

```
┌──────────────┐                    ┌──────────────┐
│    Renter    │                    │     Owner    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ (1) Open /messages/[bookingId]    │
       ▼                                   ▼
┌─────────────────────────────────────────────┐
│ Messages Page (messages/[bookingId]:40)     │
│ • Load existing messages                    │
│ • Subscribe to realtime updates             │
└──────┬──────────────────────────────────────┘
       │ (2) subscribeToBookingMessages()
       ▼
┌─────────────────────────────────────────────┐
│ Realtime Setup (realtime.ts:30)             │
│ • channel = booking:{id}:messages           │
│ • .on('INSERT', callback)                   │
└──────┬──────────────────────────────────────┘
       │ (3) WebSocket connection established
       ▼
┌─────────────────────────────────────────────┐
│ Supabase Realtime Service                   │
│ • Opens WebSocket channel                   │
│ • Listens for DB changes                    │
└─────────────────────────────────────────────┘

       USER SENDS MESSAGE
       
┌──────────────────────────────────────────────┐
│ Renter types & clicks "Send" (page:78)       │
└──────┬───────────────────────────────────────┘
       │ (4) sendMessage(content)
       ▼
┌─────────────────────────────────────────────┐
│ Message Insert (realtime.ts:98)             │
│ INSERT INTO messages (                      │
│   booking_id, sender_id,                    │
│   content, created_at                       │
│ )                                           │
└──────┬──────────────────────────────────────┘
       │ (5) Message saved
       ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ Table: messages                             │
│ • Triggers realtime broadcast               │
└──────┬──────────────────────────────────────┘
       │ (6) Database trigger
       ▼
┌─────────────────────────────────────────────┐
│ Supabase Realtime Broadcast                 │
│ • Sends to all channel subscribers          │
│ • Event: INSERT                             │
│ • Payload: new message object               │
└──────┬──────────────────────────────────────┘
       │ (7) Both users receive broadcast
       ▼
┌─────────────────────────────────────────────┐
│ onMessage Callback (page:45)                │
│ • Receives new message                      │
│ • Updates UI state                          │
│ • Appends to chat                           │
└──────┬──────────────────────────────────────┘
       │ (8) Display instantly
       ▼
┌─────────────────────────────────────────────┐
│ Chat UI Updated                             │
│ • Message in both browsers                  │
│ • No page refresh needed                    │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Channel: `booking:{bookingId}:messages`
- Transport: WebSocket (Supabase Realtime)
- Table: `messages`
- Real-time: INSERT events broadcast instantly

---

## DFD 6: Owner Vehicle Listing Creation

**Trace:** Form Submit → Image Upload → Vehicle Record → Admin Approval

```
┌──────────────┐
│     Owner    │
└──────┬───────┘
       │ (1) Navigate → /owner/vehicles/new
       ▼
┌─────────────────────────────────────────────┐
│ Vehicle Form (owner/vehicles/new)           │
│ • Vehicle details form                      │
│ • Image upload (multiple)                   │
│ • Pricing tiers (day/week/month)            │
└──────┬──────────────────────────────────────┘
       │ (2) Upload photos [img1, img2, ...]
       ▼
┌─────────────────────────────────────────────┐
│ Image Upload Loop (page:95)                 │
│ • Iterate files                             │
│ • uploadToSupabase() per image              │
└──────┬──────────────────────────────────────┘
       │ (3) Storage upload
       ▼
┌─────────────────────────────────────────────┐
│ Storage Upload (storage.ts:25)              │
│ • Generate unique filename                  │
│ • Upload to 'vehicle-images' bucket         │
│ • Return public URL                         │
└──────┬──────────────────────────────────────┘
       │ (4) Files stored
       ▼
┌─────────────────────────────────────────────┐
│ Supabase Storage                            │
│ Bucket: vehicle-images                      │
│ • Stores files                              │
│ • Generates CDN URLs                        │
│ • RLS protected                             │
└──────┬──────────────────────────────────────┘
       │ (5) Returns image URLs[]
       ▼
┌─────────────────────────────────────────────┐
│ Form Submit (page:110)                      │
│ • Collect form data                         │
│ • Attach image URLs                         │
│ • createVehicle(payload)                    │
└──────┬──────────────────────────────────────┘
       │ (6) Create vehicle
       ▼
┌─────────────────────────────────────────────┐
│ Vehicle Creation (vehicles.ts:162)          │
│ INSERT INTO vehicles (                      │
│   owner_id, type, make, model,              │
│   price_per_day/week/month,                 │
│   location, image_urls[],                   │
│   is_approved=FALSE,                        │
│   status='pending'                          │
│ )                                           │
└──────┬──────────────────────────────────────┘
       │ (7) Vehicle saved
       ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ Table: vehicles                             │
│ • Awaits admin approval                     │
└──────┬──────────────────────────────────────┘
       │ (8) Notify admin
       ▼
┌─────────────────────────────────────────────┐
│ Admin Notification                          │
│ • Email: "New listing pending"              │
└──────┬──────────────────────────────────────┘
       │ (9) Success
       ▼
┌─────────────────────────────────────────────┐
│ Owner Dashboard                             │
│ • Redirect → /owner/vehicles                │
│ • Shows "Pending" badge                     │
│ • Not visible to renters yet                │
└─────────────────────────────────────────────┘

       ADMIN APPROVAL FLOW
       
┌─────────────────────────────────────────────┐
│ Admin Reviews (/admin/vehicles)             │
│ • View pending vehicles                     │
│ • Click "Approve" or "Reject"               │
└──────┬──────────────────────────────────────┘
       │ (10) Approve
       ▼
┌─────────────────────────────────────────────┐
│ Approval Update                             │
│ UPDATE vehicles SET                         │
│   is_approved=TRUE,                         │
│   status='available'                        │
│ WHERE id                                    │
└──────┬──────────────────────────────────────┘
       │ (11) Vehicle live
       ▼
┌─────────────────────────────────────────────┐
│ Vehicle Live                                │
│ • Visible in search                         │
│ • Bookable by renters                       │
│ • Owner notified                            │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Images: File[] → upload → URLs[]
- Storage: `vehicle-images` bucket
- Approval: `is_approved` flag
- Table: `vehicles`

---

## DFD 7: Admin Dashboard Analytics

**Trace:** Dashboard Load → Parallel Queries → Calculations → Display

```
┌──────────────┐
│     Admin    │
└──────┬───────┘
       │ (1) Navigate → /admin/dashboard
       ▼
┌─────────────────────────────────────────────┐
│ Dashboard Page (admin/dashboard:97)         │
│ • loadDashboardData()                       │
└──────┬──────────────────────────────────────┘
       │ (2) Parallel fetching (Promise.all)
       │
       ├──────────┬──────────┬──────────┐
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Users  │ │Vehicles │ │Bookings │ │Payments │
   │(:105)  │ │(:138)   │ │(:170)   │ │         │
   └───┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
       │           │           │           │
       │ (3) SELECT queries                │
       ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ • users (role, created_at)                  │
│ • vehicles (status, is_approved)            │
│ • bookings (status, total_price)            │
│ • payments (status, amount)                 │
└──────┬──────────────────────────────────────┘
       │ (4) All data returned
       ▼
┌─────────────────────────────────────────────┐
│ Data Aggregation (page:134-265)             │
│                                             │
│ (5a) User Statistics:                       │
│   • Total count                             │
│   • By role (renter/owner)                  │
│   • Growth rate % (monthly)                 │
│                                             │
│ (5b) Vehicle Statistics:                    │
│   • Total vehicles                          │
│   • Pending approval count                  │
│   • Available vs unavailable                │
│                                             │
│ (5c) Revenue Aggregation (:198):            │
│   • total = SUM(total_price)                │
│   • platform_fee = total × 0.10             │
│   • By date range                           │
│                                             │
│ (5d) Booking Statistics:                    │
│   • Pending, confirmed, active              │
│   • Completion rate                         │
│                                             │
│ (5e) Recent Activity (:234):                │
│   • Latest bookings (joined)                │
│   • Latest vehicles                         │
│   • Combined & sorted                       │
└──────┬──────────────────────────────────────┘
       │ (6) Render dashboard
       ▼
┌─────────────────────────────────────────────┐
│ Dashboard UI (:289)                         │
│ • Stats Cards (users, vehicles, revenue)    │
│ • Alert Cards (pending, active)             │
│ • Recent Activity Feed                      │
│ • Charts (revenue, bookings)                │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Queries: users, vehicles, bookings, payments
- Calculations: growth %, revenue, counts
- Activity: Recent bookings + vehicles
- Display: Stats cards, charts, feed

---

## DFD 8: Middleware Role-Based Authorization

**Trace:** Request → Session Check → Role Verify → Route Protection

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ (1) Navigate to protected route
       │     e.g., /owner/dashboard
       ▼
┌─────────────────────────────────────────────┐
│ Middleware Intercept (middleware.ts:12)     │
│ • Intercepts ALL requests                   │
└──────┬──────────────────────────────────────┘
       │ (2) Validate session
       ▼
┌─────────────────────────────────────────────┐
│ Session Validation (middleware.ts:12)       │
│ const { data: { session } } =               │
│   await supabase.auth.getSession()          │
│                                             │
│ IF no session:                              │
│   → Redirect to /login                      │
└──────┬──────────────────────────────────────┘
       │ (3) Session valid → Check role
       ▼
┌─────────────────────────────────────────────┐
│ Role Cache Lookup (middleware.ts:46)        │
│ userRole = getCachedUserRole(user_id)       │
│                                             │
│ IF cache miss:                              │
│   → Query database (fallback)               │
└──────┬──────────────────────────────────────┘
       │ (4) Cache miss → Direct query
       ▼
┌─────────────────────────────────────────────┐
│ Direct Role Query (middleware.ts:54)        │
│ SELECT role FROM users                      │
│ WHERE id = user_id                          │
└──────┬──────────────────────────────────────┘
       │ (5) Role retrieved
       ▼
┌─────────────────────────────────────────────┐
│ Route Protection Logic                      │
│                                             │
│ IF route.startsWith('/owner'):              │
│   IF userRole !== 'owner' AND !== 'admin':  │
│     → Redirect /unauthorized (:102)         │
│                                             │
│ IF route.startsWith('/admin'):              │
│   IF userRole !== 'admin':                  │
│     → Redirect /unauthorized (:109)         │
│                                             │
│ IF route.startsWith('/renter'):             │
│   IF userRole !== 'renter':                 │
│     → Redirect /unauthorized                │
└──────┬──────────────────────────────────────┘
       │ (6) Authorization passed
       ▼
┌─────────────────────────────────────────────┐
│ Allow Request                               │
│ • Continue to protected page                │
│ • User can access route                     │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Session: JWT token (checked first)
- Role: renter, owner, admin (from `users` table)
- Cache: User role cached for performance
- Protection: Route-based authorization

**Protected Routes:**
- `/owner/*` → owner or admin only
- `/admin/*` → admin only
- `/renter/*` → renter only
- `/messages/*` → authenticated users

**Security Flow:**
```
Request → Session Check → Role Check → Route Match → Allow/Deny
             ↓ NO           ↓ Invalid      ↓ No access
          /login       /unauthorized   /unauthorized
```

---

**Navigation:**
- [← Part 2 - Booking & Payment](./DATA_FLOW_DIAGRAMS_PART2.md)
- [← Part 1 - Signup & Search](./DATA_FLOW_DIAGRAMS_PART1.md)

---

## Summary: Complete System Data Flows

### All 8 Core Flows Documented:

1. **User Signup** - Authentication & profile creation
2. **Vehicle Search** - Filtering & availability checking
3. **Booking Creation** - Checkout & pricing calculation
4. **Payment Processing** - PayMongo integration
5. **Real-time Chat** - WebSocket messaging
6. **Vehicle Listing** - Owner uploads & admin approval
7. **Admin Dashboard** - Analytics & monitoring
8. **Middleware Auth** - Role-based security

### Key Technologies:
- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Real-time:** Supabase Realtime (WebSocket)
- **Auth:** Supabase Auth + RLS
- **Payment:** PayMongo API
- **Storage:** Supabase Storage

### Security Layers:
1. Session validation (JWT)
2. Role-based access control (middleware)
3. Row-level security (RLS policies)
4. Input validation (Zod schemas)
5. HTTPS encryption (TLS)
