# JuanRide Siargao Hub - Data Flow Diagrams (Part 2)

**Version 1.0 | Date: November 18, 2025**

**Covers:** Booking Creation & Payment Processing Flows

---

## DFD 3: Booking Creation & Checkout Flow

**Trace:** Checkout Form → Price Calculation → Booking Record → Payment Init

```
┌──────────────┐
│    Renter    │
└──────┬───────┘
       │ (1) Click "Book Now" → /checkout?vehicleId=123
       ▼
┌─────────────────────────────────────────────┐
│ Checkout Page (checkout/page.tsx:85)        │
│ • Load vehicle details                      │
│ • Show date picker                          │
└──────┬──────────────────────────────────────┘
       │ (2) Select dates & submit
       ▼
┌─────────────────────────────────────────────┐
│ Price Calculation (checkout/page.tsx:83)    │
│ • days = end_date - start_date              │
│ • IF days >= 28: rate = month/30            │
│ • ELSE IF days >= 7: rate = week/7          │
│ • ELSE: rate = day                          │
│ • subtotal = days × rate                    │
│ • platform_fee = subtotal × 0.10            │
│ • total = subtotal + platform_fee           │
└──────┬──────────────────────────────────────┘
       │ (3) createBooking()
       ▼
┌─────────────────────────────────────────────┐
│ Booking Creation (bookings.ts:33)           │
│ INSERT INTO bookings (                      │
│   vehicle_id, renter_id,                    │
│   start_date, end_date,                     │
│   total_price, status='pending'             │
│ ) RETURNING *                               │
└──────┬──────────────────────────────────────┘
       │ (4) Booking saved
       ▼
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ Table: bookings                             │
│ Returns: booking object with ID             │
└──────┬──────────────────────────────────────┘
       │ (5) Redirect → /checkout/[bookingId]
       ▼
┌─────────────────────────────────────────────┐
│ Payment Page (checkout/[bookingId]/page:120)│
│ • Show booking summary                      │
│ • Payment method select (GCash/Maya/Card)   │
└──────┬──────────────────────────────────────┘
       │ (6) createPaymentRecord()
       ▼
┌─────────────────────────────────────────────┐
│ Payment Init (paymongo.ts:549)              │
│ INSERT INTO payments (                      │
│   booking_id, amount,                       │
│   payment_method, status='pending'          │
│ )                                           │
└──────┬──────────────────────────────────────┘
       │ (7) Ready for payment
       ▼
┌─────────────────────────────────────────────┐
│ Payment Gateway Ready                       │
│ • Booking locked (pending)                  │
│ • Payment record created                    │
└─────────────────────────────────────────────┘
```

**Key Data:**
- Input: vehicle_id, start_date, end_date
- Calculations: days, rate (tier-based), platform_fee (10%)
- Tables: `bookings`, `payments`

---

## DFD 4: PayMongo Payment Processing

**Trace:** Payment Method → PayMongo API → Gateway → Callback → Confirmation

```
┌──────────────┐
│    Renter    │
└──────┬───────┘
       │ (1) Select payment method (GCash/Maya/Card)
       ▼
┌─────────────────────────────────────────────┐
│ Payment Handler (checkout/[bookingId]:145)  │
│ • Validate card details (if card)           │
│ • Prepare billing info                      │
└──────┬──────────────────────────────────────┘
       │ (2) createPaymentSource()
       ▼
┌─────────────────────────────────────────────┐
│ PayMongo Client (paymongo.ts:297)           │
│ • Encode auth header (Base64)               │
│ • Build payload {type, amount, redirect}    │
└──────┬──────────────────────────────────────┘
       │ (3) POST /v1/sources
       ▼
┌─────────────────────────────────────────────┐
│ PayMongo API (External)                     │
│ https://api.paymongo.com/v1/sources         │
│ • Creates payment source                    │
│ • Generates checkout_url                    │
│ • Returns source.id                         │
└──────┬──────────────────────────────────────┘
       │ (4) Redirect to checkout_url
       ▼
┌─────────────────────────────────────────────┐
│ Payment Gateway                             │
│ • GCash/Maya app/web                        │
│ • User authenticates & pays                 │
│ • 2FA/OTP verification                      │
└──────┬──────────────────────────────────────┘
       │ (5) Payment complete → success URL
       ▼
┌─────────────────────────────────────────────┐
│ Payment Callback (payment/success:55)       │
│ • Extract source_id from URL                │
│ • Verify with PayMongo                      │
└──────┬──────────────────────────────────────┘
       │ (6) updatePaymentRecord()
       ▼
┌─────────────────────────────────────────────┐
│ Payment Update (paymongo.ts:493)            │
│ UPDATE payments SET                         │
│   status='paid',                            │
│   transaction_id=source_id,                 │
│   paid_at=NOW()                             │
│ WHERE booking_id                            │
└──────┬──────────────────────────────────────┘
       │ (7) Update booking
       ▼
┌─────────────────────────────────────────────┐
│ Booking Confirmation                        │
│ UPDATE bookings SET status='confirmed'      │
└──────┬──────────────────────────────────────┘
       │ (8) Send notifications
       ▼
┌─────────────────────────────────────────────┐
│ Email Notifications                         │
│ • Renter: Booking confirmed + receipt       │
│ • Owner: New booking alert                  │
└──────┬──────────────────────────────────────┘
       │ (9) Redirect
       ▼
┌─────────────────────────────────────────────┐
│ Confirmation Page                           │
│ • Success message                           │
│ • Booking details                           │
│ • "Chat with Owner" button                  │
└─────────────────────────────────────────────┘
```

**Key Data:**
- payment_method: gcash, maya, card
- amount: in centavos (₱3,500 = 350000)
- source_id: PayMongo source (src_xxxxx)
- transaction_id: Payment confirmation ID
- status: pending → paid → confirmed

**PayMongo API:**
- POST /v1/sources - Create payment source
- GET /v1/sources/:id - Verify payment

**Payment States:**
```
pending → checkout → paid → confirmed
            │
            └─→ failed
```

---

**Navigation:**
- [← Part 1 - Signup & Search](./DATA_FLOW_DIAGRAMS_PART1.md)
- [→ Part 3 - Chat & Listings](./DATA_FLOW_DIAGRAMS_PART3.md)
