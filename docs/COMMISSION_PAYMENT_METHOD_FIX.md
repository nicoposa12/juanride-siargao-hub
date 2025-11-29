# Commission Payment Method Fix

## 📊 Analysis Summary

### Problem Identified
The admin commission page was showing **all commissions with "Pending Payment" status** and **defaulting payment methods to "Cash"**, regardless of the actual payment method the renter chose when making the booking.

### Root Cause

1. **confirmBooking() function** was defaulting to `'cash'` payment method
2. **No integration** with the `payments` table to fetch actual payment method
3. **Backfill tool** was also hardcoding `'cash'` for all historical bookings

## 🔍 How Payment Flow Should Work

```
Renter Books Vehicle
    ↓
Renter Chooses Payment Method
(QRPh, GCash, PayMaya, GrabPay, BillEase, or Cash)
    ↓
Payment Record Created in payments table
    ↓
Owner Confirms Booking
    ↓
confirmBooking() fetches payment method from payments table
    ↓
Commission Created with ACTUAL payment method
    ↓
Admin sees correct payment type (Cashless or Cash)
```

## ✅ Fixes Implemented

### 1. Updated `confirmBooking()` Function
**File:** `src/lib/supabase/queries/bookings.ts`

**Changes:**
- ✅ Now fetches payment information from `payments` table
- ✅ Maps database payment methods to commission payment methods
- ✅ Uses renter's actual payment choice instead of defaulting to 'cash'

**Payment Method Mapping:**
```typescript
Database (payments table) → Commission (commissions table)
---------------------------------------------------------
'gcash'          → 'gcash'
'maya'           → 'paymaya'
'paymaya'        → 'paymaya'
'qrph'           → 'qrph'
'grab_pay'       → 'grabpay'
'grabpay'        → 'grabpay'
'billease'       → 'billease'
'card'           → 'gcash' (cashless)
'bank_transfer'  → 'gcash' (cashless)
'cash'           → 'cash'
```

**Before:**
```typescript
// Always defaulted to cash
const method: PaymentMethod = paymentMethod || 'cash'
```

**After:**
```typescript
// Fetches from payment record
const payment: any = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
const dbPaymentMethod = payment?.payment_method

// Maps to commission payment method
const methodMap: Record<string, PaymentMethod> = { ... }
if (dbPaymentMethod && methodMap[dbPaymentMethod]) {
  method = methodMap[dbPaymentMethod]
}
```

---

### 2. Updated Backfill Tool
**File:** `src/app/admin/commissions/backfill/page.tsx`

**Changes:**
- ✅ Query now includes payment information
- ✅ Uses actual payment method from payment record
- ✅ Same payment method mapping as confirmBooking()
- ✅ Updated description to reflect payment method source

**Before:**
```typescript
// Always defaulted to cash
'cash' // Default to cash for historical bookings
```

**After:**
```typescript
// Gets payment method from payment record
const payment: any = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
const dbPaymentMethod = payment?.payment_method || 'cash'

// Maps and uses actual payment method
const paymentMethod = (methodMap[dbPaymentMethod] || 'cash') as any
```

---

## 📊 Database Schema

### Payments Table
```sql
payments
  - booking_id (UUID, references bookings)
  - amount (DECIMAL)
  - payment_method (TEXT) -- gcash, maya, qrph, grab_pay, billease, card, bank_transfer, cash
  - status (TEXT) -- pending, processing, paid, failed, refunded
  - created_at (TIMESTAMPTZ)
```

### Commissions Table
```sql
commissions
  - booking_id (UUID, references bookings)
  - payment_method (TEXT) -- qrph, gcash, paymaya, grabpay, billease, cash
  - payment_type (TEXT) -- cashless, cash
  - status (TEXT) -- pending, submitted, verified, paid
  - commission_amount (DECIMAL)
  - created_at (TIMESTAMPTZ)
```

---

## 🎯 Expected Behavior After Fix

### When Owner Confirms Booking:

1. **Renter paid with QRPh**
   - Commission created with `payment_method: 'qrph'`
   - Commission `payment_type: 'cashless'`
   - Admin sees "QRPh" badge in commission table

2. **Renter paid with GCash**
   - Commission created with `payment_method: 'gcash'`
   - Commission `payment_type: 'cashless'`
   - Admin sees "GCash" badge in commission table

3. **Renter paid with Cash**
   - Commission created with `payment_method: 'cash'`
   - Commission `payment_type: 'cash'`
   - Admin sees "Cash" badge in commission table

### When Backfilling Historical Bookings:

The tool will:
1. ✅ Fetch payment record for each booking
2. ✅ Extract the payment method used by the renter
3. ✅ Create commission with correct payment method
4. ✅ Calculate payment type (cashless vs cash)

---

## 📈 Admin Commission Page Display

### Summary Cards:
- **Total Commission**: ₱X,XXX.XX
- **Cashless Payments**: ₱X,XXX.XX (QRPh + GCash + PayMaya + GrabPay + BillEase)
- **Cash Payments**: ₱X,XXX.XX

### Transaction Table:
Each row shows:
- Date
- Owner
- Booking (vehicle details)
- Rental Amount
- Commission (10%)
- **Payment Method** (Badge showing actual method: QRPh, GCash, PayMaya, etc.)
- Status (Pending, Submitted, Verified, Paid)
- Actions

---

## 🧪 Testing Scenarios

### Scenario 1: New Booking with QRPh Payment
```
1. Renter books vehicle
2. Renter chooses QRPh payment
3. Payment record created with payment_method='qrph'
4. Owner confirms booking
5. Commission created with payment_method='qrph', payment_type='cashless'
6. Admin sees commission with "QRPh" badge
```

### Scenario 2: New Booking with Cash Payment
```
1. Renter books vehicle
2. Renter chooses Cash payment
3. Payment record created with payment_method='cash'
4. Owner confirms booking
5. Commission created with payment_method='cash', payment_type='cash'
6. Admin sees commission with "Cash" badge
```

### Scenario 3: Backfill Existing Bookings
```
1. Navigate to /admin/commissions/backfill
2. Click "Analyze Bookings"
3. System finds bookings without commissions
4. Click "Create Commissions"
5. For each booking:
   - Fetches payment record
   - Gets actual payment method
   - Creates commission with correct payment method
6. Admin sees all commissions with accurate payment methods
```

---

## 🔄 Payment Type Classification

The system automatically determines `payment_type` based on `payment_method`:

**Cashless:**
- qrph
- gcash
- paymaya
- grabpay
- billease

**Cash:**
- cash

This affects:
- Summary statistics (cashless vs cash totals)
- Owner payment workflow (bank transfer vs in-person)
- Admin collection process

---

## ✨ Benefits of This Fix

1. **Accurate Reporting**: Admin sees real payment methods used by renters
2. **Better Tracking**: Can distinguish between cashless and cash commissions
3. **Proper Workflow**: Owner knows whether to do bank transfer or prepare cash
4. **Financial Clarity**: Clear breakdown of payment types for accounting
5. **Audit Trail**: Historical bookings show correct payment methods

---

## 📝 Migration Notes

### For Existing Commissions (Before Fix):
If you have existing commission records created with default 'cash':

1. **Option A**: Delete and re-backfill
   ```sql
   DELETE FROM commissions WHERE created_at < '2025-11-28'; -- Before fix date
   ```
   Then use the backfill tool

2. **Option B**: Update manually
   ```sql
   UPDATE commissions c
   SET payment_method = p.payment_method,
       payment_type = CASE 
         WHEN p.payment_method IN ('qrph', 'gcash', 'maya', 'paymaya', 'grab_pay', 'grabpay', 'billease', 'card', 'bank_transfer') 
         THEN 'cashless'
         ELSE 'cash'
       END
   FROM payments p
   WHERE c.booking_id = p.booking_id
   AND c.payment_method = 'cash'; -- Only update defaulted ones
   ```

---

## 🎯 Next Steps

1. ✅ **Applied Fix**: confirmBooking() and backfill tool updated
2. 🔄 **Test New Bookings**: Confirm a new booking and verify payment method
3. 🔄 **Run Backfill**: Use backfill tool to update historical commissions
4. 🔄 **Verify Admin Page**: Check that payment methods display correctly
5. 🔄 **Test Owner View**: Ensure owners see correct payment requirements

---

## 🆘 Troubleshooting

### Issue: Commission still shows "Cash" for cashless payment

**Check:**
1. Does the booking have a payment record?
   ```sql
   SELECT * FROM payments WHERE booking_id = 'your-booking-id';
   ```

2. What payment method is in the payment record?
3. Is the commission using the confirmBooking() function or was it created manually?

**Solution:**
Re-create the commission using the backfill tool or manually update it.

### Issue: Payment method is NULL

**Cause:** Booking doesn't have a payment record

**Solution:**
Create a payment record for the booking:
```sql
INSERT INTO payments (booking_id, amount, payment_method, status)
VALUES ('booking-id', 500.00, 'gcash', 'paid');
```

Then re-create the commission.

---

## 📚 Related Files

- `src/lib/supabase/queries/bookings.ts` - confirmBooking() function
- `src/lib/supabase/queries/commissions.ts` - Commission creation logic
- `src/app/admin/commissions/backfill/page.tsx` - Backfill tool
- `src/app/admin/commissions/page.tsx` - Admin commission display
- `supabase/migrations/00043_create_commissions_table.sql` - Commission table schema

---

## ✅ Verification Checklist

- [ ] confirmBooking() fetches payment information
- [ ] Payment method mapping is correct
- [ ] Backfill tool uses actual payment methods
- [ ] Admin page displays correct payment badges
- [ ] Summary cards show accurate cashless vs cash totals
- [ ] Owner sees correct payment requirements
- [ ] New bookings create commissions with correct payment method
- [ ] Historical backfill works correctly

---

**Status:** ✅ Fixed and Ready for Testing

The commission system now correctly uses the renter's chosen payment method instead of defaulting to cash. Both new bookings and backfilled historical bookings will have accurate payment information.
