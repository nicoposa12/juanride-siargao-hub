# Quick Reference: Capstone Documentation Updates

## Simple Find & Replace Guide

This document provides quick find-and-replace pairs for updating your capstone documentation.

---

## 1. Database References

### Find:
```
MongoDB
```
### Replace with:
```
Supabase (PostgreSQL)
```

**Note:** Context matters. Some places need more detailed explanation.

---

## 2. Complete Database Section Replacement

### Find (in Technical Background section):
```
JuanRide uses MongoDB as the primary database system, combined with Prisma
```

### Replace with:
```
JuanRide uses Supabase, a backend-as-a-service platform built on PostgreSQL, as the primary database and backend infrastructure
```

---

## 3. Key Terms to Update Throughout Document

| OLD TERM | NEW TERM | NOTES |
|----------|----------|-------|
| MongoDB | Supabase/PostgreSQL | Main database system |
| NoSQL | Relational database | Database type |
| Prisma ORM | Supabase SDK | Database interface |
| Document-based | Table-based with relationships | Data structure |

---

## 4. New Terms to Add (When Relevant)

- **Row-Level Security (RLS)**
- **JWT token authentication**
- **Database triggers**
- **PayMongo payment gateway**
- **GCash** (Philippine mobile wallet)
- **Maya** (formerly PayMaya)
- **Real-time subscriptions**
- **Middleware route protection**
- **Automated fee calculation** (10% platform, 90% owner)

---

## 5. Payment System - Key Points to Include

When discussing payment features, ensure these are mentioned:

✅ **PayMongo** as the payment gateway  
✅ **GCash** support (most popular in PH)  
✅ **Maya** support (alternative e-wallet)  
✅ **10% platform fee** calculation  
✅ **90% owner payout** calculation  
✅ **Automated fee splitting** via database triggers  
✅ **Email notifications** via Resend service  

**Reference:** This addresses Miss Arah's interview concerns about GCash fees and partial payments (Interview transcript, page 44)

---

## 6. Software Requirements Table Quick Update

### OLD Row:
```
Database and ORM: MongoDB (Cloud/Local), Prisma (Object-Relational Mapping)
```

### NEW Rows:
```
Database and Backend: Supabase (PostgreSQL-based BaaS), Authentication, Real-time, Storage
Payment Integration: PayMongo API (GCash, Maya, Cards)
Email Service: Resend (Transactional emails)
```

---

## 7. Technical Features to Highlight

Add these features when describing the system capabilities:

### Security Features:
- Row-Level Security (RLS) policies
- JWT-based authentication
- Middleware route protection
- Role-based access control (admin, owner, renter)

### Automation Features:
- Database triggers for business logic
- Automatic owner assignment on bookings
- Automatic conflict detection (prevents double-booking)
- Automatic fee calculation on payments
- Automatic email notifications

### Real-Time Features:
- Live chat messaging via Supabase channels
- Instant booking availability updates
- Real-time notification system

---

## 8. Architecture Flow Summary (Add to Results Section)

```
User Registration → JWT Auth → Database Trigger → Profile Creation → Role-Based Routing

Vehicle Search → Filter by Approval → Check Availability → Query Conflicts → Display Results

Booking Creation → Validate Dates → Trigger Chain → Assign Owner → Check Conflicts → Update Status

Payment Flow → PayMongo → GCash/Maya/Card → Webhook → Calculate Fees (10%/90%) → Confirm → Email

Chat System → Supabase Channel → Real-time Subscription → Insert Message → Live Update

Admin Approval → Query Pending → Update Approval → Notification → Live for Renters
```

---

## 9. Interview Connection Points

Link these interview quotes to your technical solutions:

**Miss Arah (Page 44):**
> "We accept cash, GCash, and bank transfers. GCash has a cash out fee that we shoulder, which lowers our income."

**Your Solution:**
- PayMongo integration eliminates direct GCash fees for owners
- 10% platform fee is transparent and consistent
- Automated calculation prevents confusion

**Miss Arah (Page 44):**
> "Some renters pay only half at first and promise to settle the rest later. This leads to delays and follow-ups."

**Your Solution:**
- Full payment required before booking confirmation
- Automated payment verification
- No manual follow-ups needed

---

## 10. Checklist for Manual Document Update

### Chapter 3 - Methodology
- [ ] Update Technical Background - Database section
- [ ] Add Payment Processing System section
- [ ] Update SDLC Design phase (mention RLS, triggers, JWT)
- [ ] Update SDLC Implementation phase (mention Supabase, PayMongo, middleware)
- [ ] Update Table 3: Software Requirements

### Chapter 4 - Results and Discussion
- [ ] Add "System Architecture & Implementation" section
- [ ] Include authentication flow description
- [ ] Include payment processing flow with GCash
- [ ] Include real-time chat explanation
- [ ] Include security measures (RLS, middleware)

### Throughout Document
- [ ] Replace "MongoDB" → "Supabase/PostgreSQL" (where appropriate)
- [ ] Add "GCash" mentions in payment contexts
- [ ] Add "PayMongo" as payment gateway
- [ ] Mention "10%/90% fee split" when discussing revenue
- [ ] Add "database triggers" for automation features
- [ ] Add "RLS policies" for security features

---

## 11. Don't Forget These Specifics

### Payment Methods Supported:
1. GCash (QR code/mobile number)
2. Maya (formerly PayMaya)
3. Credit/Debit Cards (Visa, Mastercard)
4. Bank Transfers

### Database Tables (for technical accuracy):
- `users` (with role: admin/owner/renter)
- `vehicles` (with is_approved flag)
- `bookings` (with owner_id, renter_id)
- `payments` (with platform_fee, owner_payout)
- `messages` (for real-time chat)
- `notifications` (for alerts)

### Key Database Triggers:
1. `on_auth_user_created` → Creates user profile
2. `set_booking_owner_trigger` → Auto-assigns owner
3. `check_booking_conflicts_trigger` → Prevents double-booking
4. `update_vehicle_status_trigger` → Updates vehicle status
5. `calculate_payment_fees` → Calculates 10%/90% split

---

**Quick Reference Version:** 1.0  
**Use this for:** Fast manual updates to your official capstone Word document  
**Detailed version:** See CAPSTONE_UPDATE_GUIDE.md
