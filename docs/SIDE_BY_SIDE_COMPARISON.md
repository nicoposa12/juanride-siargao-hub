# Side-by-Side Comparison: Capstone Updates

## Visual Guide for Manual Document Updates

This document shows before/after comparisons in table format for easy reference.

---

## Section 1: Database Technology

| BEFORE (MongoDB) | AFTER (Supabase/PostgreSQL) |
|------------------|----------------------------|
| **Database Type:** NoSQL, document-based | **Database Type:** Relational, table-based |
| **Data Structure:** JSON documents | **Data Structure:** Tables with relationships (foreign keys, joins) |
| **Access Tool:** Prisma ORM | **Access Tool:** Supabase SDK with RESTful API |
| **Data Handling:** Flexible schema | **Data Handling:** Structured schema with data integrity |
| **Features:** Scalable, flexible | **Features:** Real-time subscriptions, RLS policies, JWT auth, cloud storage |

---

## Section 2: Authentication System

| BEFORE | AFTER |
|--------|-------|
| Generic "user authentication" | **JWT Token Authentication** via Supabase Auth |
| Manual user profile creation | **Automated profile creation** via database trigger (`on_auth_user_created`) |
| Basic session management | **Middleware-based session validation** with role caching |
| Simple login/logout | **Role-based routing**: admin→/admin/dashboard, owner→/owner/dashboard, renter→/ |

---

## Section 3: Payment Processing

| BEFORE | AFTER |
|--------|-------|
| Generic "online payment" | **PayMongo Payment Gateway** (Philippine-based) |
| Mentions "e-wallets" | **Specific Support:** GCash, Maya, Credit/Debit Cards, Bank Transfers |
| No fee structure | **Automated Fee Calculation:** 10% platform fee, 90% owner payout |
| Manual payment tracking | **Database trigger** automatically calculates fees upon payment |
| No stakeholder connection | **Solves Miss Arah's concerns:** GCash fees, partial payments eliminated |
| Generic confirmation | **Resend email service** sends receipts to renter and owner |

---

## Section 4: Booking System

| BEFORE | AFTER |
|--------|-------|
| Basic booking creation | **Database trigger chain** for automation |
| Manual double-booking checks | **Automatic conflict detection** via `check_booking_conflicts_trigger` |
| Manual owner assignment | **Automatic owner_id population** via `set_booking_owner_trigger` |
| Manual status updates | **Automatic vehicle status** update via `update_vehicle_status_trigger` |
| Client-side validation only | **Server-side validation** with database exceptions |

---

## Section 5: Real-Time Features

| BEFORE | AFTER |
|--------|-------|
| Basic messaging | **Real-time chat** via Supabase channels |
| Page refresh needed | **Live updates** without refresh using `.on('postgres_changes')` |
| No live subscriptions | **Subscription-based updates** to messages table |
| Delayed notifications | **Instant message delivery** to all connected users |
| No real-time availability | **Live availability updates** with instant conflict checking |

---

## Section 6: Security Implementation

| BEFORE | AFTER |
|--------|-------|
| Generic "secure login" | **JWT token-based authentication** |
| Basic access control | **Row-Level Security (RLS) policies** on all database tables |
| Application-level security only | **Defense-in-depth**: Application + Database level security |
| No middleware | **Request middleware** for route protection and role validation |
| Manual permission checks | **Automatic RLS policy enforcement** by database |
| Generic encryption | **Encrypted data** in transit (HTTPS) and at rest (Supabase) |

---

## Section 7: Admin Features

| BEFORE | AFTER |
|--------|-------|
| Manual vehicle approval | **Query-based approval system**: `WHERE is_approved=false` |
| No notification system | **Automatic owner notification** via `createNotification()` |
| Basic dashboard | **Role-specific dashboards** with KPIs and analytics |
| Manual status updates | **One-click approval** updates `is_approved=true` |
| No visibility control | **RLS policies** control who sees pending vs approved vehicles |

---

## Section 8: Software Stack Comparison

| Component | BEFORE | AFTER |
|-----------|--------|-------|
| **Frontend** | Next.js 14, React | Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/UI |
| **Backend** | Node.js | Next.js (SSR) + Supabase (BaaS) |
| **Database** | MongoDB | PostgreSQL via Supabase |
| **ORM/SDK** | Prisma | Supabase Client SDK |
| **Auth** | Custom/Generic | Supabase Auth (JWT) |
| **Payment** | Generic mention | PayMongo API |
| **Email** | Not specified | Resend service |
| **Real-time** | Not specified | Supabase Realtime |
| **Storage** | Not specified | Supabase Storage |
| **Hosting** | DigitalOcean, GoDaddy | Vercel/DigitalOcean + Supabase Cloud + GoDaddy |

---

## Section 9: Key Terminology Changes

| OLD TERM | NEW TERM | CONTEXT |
|----------|----------|---------|
| MongoDB database | Supabase/PostgreSQL database | Throughout document |
| NoSQL | Relational database | Database type descriptions |
| Prisma ORM | Supabase SDK / Database triggers | Data access layer |
| Document schema | Table schema with relationships | Database structure |
| Manual processing | Automated via triggers | Business logic |
| E-wallet | GCash, Maya | Payment methods |
| Payment gateway | PayMongo | Payment provider |
| Generic auth | JWT authentication | Security |
| Access control | Row-Level Security (RLS) | Database security |
| Basic routing | Middleware route protection | Application security |

---

## Section 10: Feature Additions Summary

### NEW Features to Add in Documentation:

#### Database Features:
- ✅ Row-Level Security (RLS) policies
- ✅ Database triggers for automation
- ✅ Foreign key relationships
- ✅ Data integrity constraints
- ✅ Automatic conflict detection

#### Authentication Features:
- ✅ JWT token system
- ✅ Role-based access control (admin/owner/renter)
- ✅ Middleware session validation
- ✅ In-memory role caching
- ✅ Automatic profile creation via triggers

#### Payment Features:
- ✅ PayMongo integration
- ✅ GCash support (most popular in PH)
- ✅ Maya support
- ✅ Credit/Debit card support
- ✅ 10% platform fee / 90% owner payout
- ✅ Automatic fee calculation
- ✅ Email receipt system

#### Real-Time Features:
- ✅ Live chat messaging
- ✅ Real-time subscriptions
- ✅ Instant availability updates
- ✅ Live notifications

#### Security Features:
- ✅ Request middleware
- ✅ Route protection
- ✅ RLS policies at database level
- ✅ JWT encryption
- ✅ Defense-in-depth architecture

---

## Section 11: Interview Integration Points

### Miss Arah's Concerns → Your Solutions

| Interview Problem (Miss Arah, Page 44) | JuanRide Solution |
|----------------------------------------|-------------------|
| **"GCash has a cash out fee that we shoulder, which lowers our income"** | PayMongo handles GCash with transparent 10% platform fee only. No additional cash-out fees. |
| **"Some renters pay only half at first and promise to settle the rest later. This leads to delays and follow-ups."** | Full payment required via PayMongo before booking confirmation. Automated payment verification eliminates partial payments. |
| **"It becomes time consuming when inquiries increase."** | Real-time availability checking, automated booking system, and instant notifications reduce manual work. |
| **"We still manage it manually and we can track which units are out."** | Dashboard with real-time vehicle status, automated conflict detection prevents double-booking. |
| **"Some return late without informing us, which makes tracking harder."** | Automated notifications for due time and return reminders via email/SMS. |

---

## Section 12: Architecture Flow Diagrams

### Payment Flow - BEFORE vs AFTER

**BEFORE (Generic):**
```
User → Select Vehicle → Choose Payment Method → Manual Processing → Confirmation
```

**AFTER (Specific with GCash):**
```
Renter → Checkout Page → createPaymentIntent()
  ↓
PayMongo Payment Page
  ↓
Select Method: [GCash] / Maya / Card
  ↓
Complete Payment
  ↓
PayMongo Webhook → System Verification
  ↓
Database Trigger: calculate_payment_fees
  ├── platform_fee = amount × 10%
  └── owner_payout = amount × 90%
  ↓
updateBookingStatus('confirmed')
  ↓
Resend Email Service
  ├── Receipt to Renter
  └── Notification to Owner
```

### Authentication Flow - BEFORE vs AFTER

**BEFORE (Generic):**
```
User → Register → Login → Access System
```

**AFTER (Specific with Roles):**
```
User → Signup Form (email, password, role)
  ↓
Supabase Auth → Create auth.users (JWT token)
  ↓
Database Trigger: on_auth_user_created
  ↓
handle_new_user() → Insert public.users (role metadata)
  ↓
Login → Middleware Intercepts Request
  ↓
getCachedUserRole() → Check in-memory cache
  ↓
Role-Based Routing:
  ├── admin → /admin/dashboard
  ├── owner → /owner/dashboard
  └── renter → / (homepage)
```

---

## Section 13: Quick Stats to Include

### System Capabilities (Add to Results/Discussion):
- **Payment Methods:** 4 (GCash, Maya, Cards, Bank Transfer)
- **User Roles:** 3 (Admin, Owner, Renter)
- **Automated Triggers:** 5 (profile creation, owner assignment, conflict check, status update, fee calculation)
- **Security Layers:** 3 (Middleware, RLS policies, JWT tokens)
- **Real-Time Features:** 2 (Chat messaging, Availability updates)
- **Fee Structure:** 10% platform / 90% owner
- **Database Tables:** 6+ (users, vehicles, bookings, payments, messages, notifications)

---

## How to Use This Document

1. **Print this document** for easy reference while editing
2. **Use the side-by-side tables** to understand what needs changing
3. **Reference the flows** when explaining system architecture
4. **Check terminology changes** to ensure consistency
5. **Verify interview connections** are included
6. **Use stats** to add concrete numbers to your documentation

---

**Document Purpose:** Visual guide for manual capstone document updates  
**Created:** November 17, 2025  
**Related Files:** 
- CAPSTONE_UPDATE_GUIDE.md (detailed changes)
- QUICK_REFERENCE_UPDATES.md (find/replace guide)
