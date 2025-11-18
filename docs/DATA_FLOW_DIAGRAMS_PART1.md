# JuanRide Siargao Hub - Data Flow Diagrams (Part 1)

**Version 1.0 | Date: November 18, 2025**

**Covers:** User Signup & Vehicle Search Flows

---

## DFD 1: User Signup & Profile Creation Flow

**Trace:** Signup Form → Auth Context → Supabase Auth → Database → Email Notification

```
┌──────────────┐
│   New User   │
└──────┬───────┘
       │ (1) Submits form [email, password, name, phone, role]
       ▼
┌─────────────────────────────────────────────┐
│ Signup Form (signup/page.tsx:45)           │
│ • Validates inputs                          │
└──────┬──────────────────────────────────────┘
       │ (2) signUp() call
       ▼
┌─────────────────────────────────────────────┐
│ AuthContext.signUp() (auth-context.tsx:392)│
│ • Calls supabase.auth.signUp()              │
└──────┬──────────────────────────────────────┘
       │ (3) Create auth user
       ▼
┌─────────────────────────────────────────────┐
│ Supabase Auth Service                       │
│ • Generates UUID                            │
│ • Hashes password (bcrypt)                  │
│ • Returns user object                       │
└──────┬──────────────────────────────────────┘
       │ (4) Create profile
       ▼
┌─────────────────────────────────────────────┐
│ Profile Creation (auth-context.tsx:420)     │
│ INSERT INTO users (id, email, name, phone)  │
└──────┬──────────────────────────────────────┘
       │ (5) Record saved
       ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ Table: users                                │
└──────┬──────────────────────────────────────┘
       │ (6) Send welcome email
       ▼
┌─────────────────────────────────────────────┐
│ Email API (auth-context.tsx:446)            │
│ POST /api/notifications/email               │
└──────┬──────────────────────────────────────┘
       │ (7) Redirect user
       ▼
┌─────────────────────────────────────────────┐
│ Role-based redirect                         │
│ • Renter → /vehicles                        │
│ • Owner → /owner/dashboard                  │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Input: email, password, full_name, phone, role
- Output: user_id (UUID), session token
- Tables: `users`, Supabase Auth

---

## DFD 2: Vehicle Search & Availability

**Trace:** Search Filters → Query Builder → Database → Availability Check → Results

```
┌──────────────┐
│    Renter    │
└──────┬───────┘
       │ (1) Apply filters [type, price, location, dates]
       ▼
┌─────────────────────────────────────────────┐
│ VehicleGrid (VehicleGrid.tsx:35)           │
│ • React Query useQuery                      │
└──────┬──────────────────────────────────────┘
       │ (2) searchVehicles(filters)
       ▼
┌─────────────────────────────────────────────┐
│ Query Builder (vehicles.ts:46)              │
│ SELECT * FROM vehicles                      │
│ JOIN users ON owner_id                      │
│ WHERE is_approved=true, status='available'  │
└──────┬──────────────────────────────────────┘
       │ (3) Apply filters
       ▼
┌─────────────────────────────────────────────┐
│ Filter Layer (vehicles.ts:60)               │
│ • .in('type', types[])                      │
│ • .gte('price_per_day', min)                │
│ • .lte('price_per_day', max)                │
│ • .ilike('location', '%search%')            │
└──────┬──────────────────────────────────────┘
       │ (4) Execute query
       ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ Returns: vehicles[] with owner data         │
└──────┬──────────────────────────────────────┘
       │ (5) Check availability
       ▼
┌─────────────────────────────────────────────┐
│ Availability Check (vehicles.ts:98)         │
│ filterByAvailability(vehicles, dates)       │
└──────┬──────────────────────────────────────┘
       │ (6) Check conflicts
       ▼
┌─────────────────────────────────────────────┐
│ Conflict Detection (vehicles.ts:229)        │
│ SELECT FROM bookings                        │
│ WHERE start <= end_date AND end >= start    │
│ AND status IN (pending, confirmed, active)  │
└──────┬──────────────────────────────────────┘
       │ (7) Check blocked dates
       ▼
┌─────────────────────────────────────────────┐
│ Blocked Dates (vehicles.ts:238)             │
│ SELECT FROM blocked_dates                   │
│ WHERE vehicle_id AND date IN range          │
└──────┬──────────────────────────────────────┘
       │ (8) Return available vehicles
       ▼
┌─────────────────────────────────────────────┐
│ VehicleGrid Display                         │
│ • Shows available vehicles                  │
│ • "Book Now" enabled                        │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Filters: type, price_range, location, dates
- Tables: `vehicles`, `bookings`, `blocked_dates`, `users`
- Validation: Booking conflicts, owner blocks

---

**Continue to:** [Part 2 - Booking & Payment Flows](./DATA_FLOW_DIAGRAMS_PART2.md)
