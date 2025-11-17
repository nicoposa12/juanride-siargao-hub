# 💳 JuanRide Payment Flow Guide

## Complete Customer Payment Journey

### 📋 **Overview**

JuanRide uses PayMongo for secure payment processing with support for:
- 💳 Credit/Debit Cards (Visa, Mastercard)
- 📱 GCash
- 💰 Maya (PayMaya)
- 🚗 GrabPay (future)

---

## 🛣️ **Step-by-Step Payment Flow**

### **Step 1: Vehicle Selection & Booking Creation**

**URL:** `/checkout?vehicle=xxx&start=2024-01-01&end=2024-01-05`

**What happens:**
1. Customer selects dates and vehicle
2. System calculates:
   - Daily rate × number of days = Subtotal
   - Service fee (5%) = Subtotal × 0.05
   - **Total = Subtotal + Service Fee**
3. Customer fills in:
   - Pickup location
   - Return location (optional)
   - Special requests (optional)
4. **Customer selects payment method** (GCash/Maya/Card)
5. For card payments: Customer enters card details
6. Click "Continue to Payment"
7. System creates booking record in database
8. Redirects to `/checkout/[bookingId]` for payment

---

### **Step 2: Payment Processing**

**URL:** `/checkout/[bookingId]`

#### **Option A: Card Payment (Direct)**

```
Customer → PayMongo API → Instant Result
```

**Process:**
1. Create Payment Intent with PayMongo
2. Tokenize card (create Payment Method)
3. Attach Payment Method to Intent
4. Charge card **immediately**
5. Update database:
   ```sql
   UPDATE payments 
   SET status = 'paid', 
       transaction_id = 'pi_xxxxx',
       paid_at = NOW()
   WHERE booking_id = 'xxx';
   
   UPDATE bookings 
   SET status = 'confirmed' 
   WHERE id = 'xxx';
   ```
6. Send email confirmations
7. Redirect to `/booking-confirmation/[bookingId]`

**Timeline:** ⚡ **Instant** (2-5 seconds)

---

#### **Option B: E-Wallet Payment (GCash/Maya)**

```
Customer → Redirect to PayMongo → E-Wallet App → Redirect Back
```

**Process:**
1. Create Payment Source with PayMongo
2. Customer redirected to PayMongo gateway
3. PayMongo redirects to GCash/Maya app/web
4. Customer logs in and authorizes payment
5. Payment gateway processes payment
6. Customer redirected back to:
   - ✅ **Success:** `/payment/success?bookingId=xxx`
   - ❌ **Failed:** `/payment/failed?bookingId=xxx`
7. Success page updates database:
   ```sql
   UPDATE payments SET status = 'paid', paid_at = NOW();
   UPDATE bookings SET status = 'confirmed';
   ```
8. Redirect to `/booking-confirmation/[bookingId]`

**Timeline:** ⏱️ **30 seconds - 2 minutes**

---

## 🗄️ **Database Structure**

### **Payments Table**

```sql
CREATE TABLE public.payments (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,  -- 'gcash'|'maya'|'card'
    status TEXT NOT NULL,           -- 'pending'|'paid'|'failed'
    transaction_id TEXT,            -- PayMongo transaction ID
    payment_gateway_response JSONB, -- Full PayMongo response
    paid_at TIMESTAMPTZ,           -- When payment completed
    platform_fee DECIMAL(10, 2),   -- 5% platform fee
    owner_payout DECIMAL(10, 2),   -- Amount for vehicle owner
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### **Payment Status Flow**

```
pending → processing → paid ✅
   ↓
 failed ❌
   ↓
refunded 💰
```

---

## 🔍 **How to Track Payments**

### **1. Database Queries**

#### Check specific payment:
```sql
SELECT 
    p.id,
    p.booking_id,
    p.amount,
    p.payment_method,
    p.status,
    p.transaction_id,
    p.paid_at,
    b.status as booking_status,
    u.email as customer_email
FROM payments p
JOIN bookings b ON b.id = p.booking_id
JOIN users u ON u.id = b.renter_id
WHERE p.booking_id = 'your-booking-id';
```

#### View all successful payments today:
```sql
SELECT 
    p.*,
    v.name as vehicle_name,
    u.email as renter_email
FROM payments p
JOIN bookings b ON b.id = p.booking_id
JOIN vehicles v ON v.id = b.vehicle_id
JOIN users u ON u.id = b.renter_id
WHERE p.status = 'paid' 
  AND DATE(p.paid_at) = CURRENT_DATE
ORDER BY p.paid_at DESC;
```

#### Calculate daily revenue:
```sql
SELECT 
    DATE(paid_at) as date,
    COUNT(*) as num_payments,
    SUM(amount) as total_revenue,
    SUM(platform_fee) as platform_revenue,
    SUM(owner_payout) as owner_payouts
FROM payments
WHERE status = 'paid'
GROUP BY DATE(paid_at)
ORDER BY date DESC;
```

---

### **2. Owner Dashboard**

Owners can view their earnings at `/owner/earnings`:

```typescript
// Query payments for owner's vehicles
const { data: payments } = await supabase
  .from('payment_summary')
  .select('*')
  .eq('owner_id', userId)
  .eq('status', 'paid')
  .order('paid_at', { ascending: false });
```

---

### **3. Admin Dashboard**

Admins can view all payments at `/admin/payments`:

```typescript
// Query all payments with filters
const { data: payments } = await supabase
  .from('payment_summary')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

---

## 📧 **Email Notifications**

When payment succeeds, automatic emails are sent:

### **To Customer:**
1. **Booking Confirmation Email**
   - Booking details
   - Vehicle information
   - Pickup/return dates
   - Total amount paid
   
2. **Payment Receipt Email**
   - Transaction ID
   - Payment method
   - Amount breakdown
   - Receipt PDF (future)

### **To Vehicle Owner:**
1. **New Booking Alert**
   - Customer details
   - Booking dates
   - Expected payout amount

---

## 🔐 **Payment Security**

### **What's Stored:**
- ✅ Transaction ID
- ✅ Payment amount
- ✅ Payment status
- ✅ Gateway response (encrypted JSONB)

### **What's NOT Stored:**
- ❌ Full card numbers
- ❌ CVV codes
- ❌ Raw card data

**All card data is tokenized by PayMongo** - we never see the actual card details!

---

## 🧪 **Testing Payments**

### **Test Card Numbers:**

```
✅ Successful Payment:
Card: 4123450131001381
Exp:  12/25
CVC:  123

❌ Failed Payment:
Card: 4571736000000075
Exp:  12/25
CVC:  123
```

### **Test E-Wallets:**

For GCash/Maya in test mode:
1. You'll see a test authorization page
2. Click **"Authorize"** to simulate success
3. Click **"Cancel"** to simulate failure

---

## 💡 **Webhooks (Optional - Production)**

For real-time payment updates, set up webhooks:

### **Endpoint:** `/api/webhooks/paymongo`

### **Events to Subscribe:**
- `payment.paid` - Payment successful
- `payment.failed` - Payment failed
- `source.chargeable` - E-wallet payment ready

### **Setup:**
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to Developers → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/webhooks/paymongo`
4. Select events above
5. Copy webhook secret to `.env.local`:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## 📊 **Payment Reconciliation**

### **Daily Reconciliation Process:**

1. **Export from Database:**
```sql
SELECT 
    transaction_id,
    amount,
    payment_method,
    status,
    paid_at,
    booking_id
FROM payments
WHERE DATE(paid_at) = '2024-01-01'
  AND status = 'paid';
```

2. **Export from PayMongo Dashboard:**
   - Go to Payments section
   - Filter by date
   - Export CSV

3. **Match Records:**
   - Compare `transaction_id` from both exports
   - Verify amounts match
   - Flag discrepancies

---

## 🚨 **Handling Failed Payments**

### **Customer Experience:**

1. Payment fails → Redirected to `/payment/failed`
2. Options shown:
   - **Retry Payment** (keeps same booking)
   - **Contact Support**
   - **Cancel Booking**

### **Database State:**

```sql
-- Payment marked as failed
UPDATE payments SET status = 'failed' WHERE booking_id = 'xxx';

-- Booking remains 'pending' for retry
-- After 24 hours with no successful payment, booking auto-cancels
```

---

## 💰 **Payment Fees**

### **PayMongo Transaction Fees:**

| Payment Method | Fee |
|---------------|-----|
| GCash | 2.5% |
| Maya | 2.5% |
| Credit/Debit Cards | 3.5% + ₱15 |
| GrabPay | 2.5% |

### **JuanRide Platform Fee:**

- **5% of booking amount**
- Calculated automatically
- Split: 95% to owner, 5% to platform

**Example:**
```
Booking amount: ₱1,000
Platform fee (5%): ₱50
Owner payout: ₱950
```

---

## 🔄 **Refund Process**

### **Steps:**

1. **Admin/Owner initiates refund** in dashboard
2. System calls PayMongo refund API
3. Update database:
```sql
UPDATE payments 
SET status = 'refunded',
    refunded_at = NOW(),
    refund_amount = amount
WHERE id = 'payment-id';
```
4. Funds returned to customer (3-5 business days)
5. Email sent to customer with refund confirmation

---

## 📱 **Mobile Responsiveness**

Payment flow is fully mobile-optimized:
- ✅ Card input with auto-formatting
- ✅ Mobile wallet deep links
- ✅ Touch-optimized buttons
- ✅ Progressive disclosure of information

---

## 🎯 **Key Metrics to Monitor**

### **Payment Success Rate:**
```sql
SELECT 
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid')::NUMERIC / 
        COUNT(*)::NUMERIC * 100, 
        2
    ) as success_rate_percent
FROM payments
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### **Average Time to Payment:**
```sql
SELECT 
    AVG(EXTRACT(EPOCH FROM (paid_at - created_at))) / 60 as avg_minutes
FROM payments
WHERE status = 'paid';
```

### **Popular Payment Methods:**
```sql
SELECT 
    payment_method,
    COUNT(*) as count,
    ROUND(AVG(amount), 2) as avg_amount
FROM payments
WHERE status = 'paid'
GROUP BY payment_method
ORDER BY count DESC;
```

---

## 🆘 **Troubleshooting**

### **"Payment Intent Creation Failed"**
- Check API keys in `.env.local`
- Verify amount is >= ₱100 (minimum)
- Check PayMongo dashboard for rate limits

### **"Card Payment Declined"**
- Check test card numbers
- Verify expiry date is in future
- Ensure CVC is 3 digits

### **"E-Wallet Redirect Failed"**
- Verify redirect URLs are absolute
- Check callback URLs are accessible
- Ensure PayMongo account is activated

### **"Payment Status Not Updating"**
- Check database triggers are enabled
- Verify RLS policies allow updates
- Check webhook endpoint if configured

---

## 📚 **Additional Resources**

- **PayMongo Docs:** https://developers.paymongo.com/
- **PayMongo Dashboard:** https://dashboard.paymongo.com/
- **JuanRide Payment Setup:** `/docs/PAYMENT_SETUP.md`
- **PayMongo API Tester:** `/paymongo-tester`

---

## ✅ **Production Checklist**

Before going live:

- [ ] Switch to live API keys (`pk_live_` / `sk_live_`)
- [ ] Test all payment methods in production
- [ ] Set up webhook endpoints
- [ ] Configure SSL certificate
- [ ] Enable fraud detection rules
- [ ] Test refund process
- [ ] Set up monitoring and alerts
- [ ] Train staff on payment reconciliation
- [ ] Prepare customer support scripts
- [ ] Test mobile experience thoroughly

---

**Last Updated:** November 2025
