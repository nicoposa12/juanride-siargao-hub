# Commission System Documentation

## Overview

The JuanRide commission system automatically tracks and manages 10% commission payments from vehicle owners to the admin for every confirmed rental transaction.

## Key Features

### 1. Automatic Commission Creation
- **Trigger**: Commission record is created automatically when a booking is confirmed
- **Amount**: 10% of the total rental price
- **Status**: Initially set to `pending`

### 2. Payment Types

#### Cashless Payments
Payment methods classified as cashless:
- **QRPh** - QR Code Philippines
- **GCash**
- **PayMaya**
- **GrabPay**
- **BillEase**

**Owner Process:**
1. Transfer 10% commission to Admin's bank account
2. Submit payment proof with:
   - Bank name
   - Transfer reference number
   - Transfer date
3. Status changes to `submitted`
4. Wait for admin verification

**Admin Process:**
1. Review submitted payment proof
2. Verify bank transfer
3. Mark as `paid` (approved) or reject with reason
4. Add optional verification notes

#### Cash Payments
- **Payment Method**: Cash
- **Collection**: In-person during store visits
- **Summary**: Clear daily/weekly/monthly/yearly totals shown for easy tracking

### 3. Commission Status Flow

```
pending → submitted → paid
   ↓
rejected (cashless only, returns to pending)
```

**Status Definitions:**
- `pending`: Commission payment not yet submitted
- `submitted`: Owner has submitted payment proof (cashless only)
- `verified`: Admin has verified the submission (optional intermediate state)
- `paid`: Commission confirmed as received by admin

### 4. Time Period Filters

Both Admin and Owner pages support filtering by:
- **Daily**: Current day's commissions
- **Weekly**: Current week's commissions (Monday-Sunday)
- **Monthly**: Current month's commissions
- **Yearly**: Current year's commissions

### 5. Summary Statistics

#### Admin View
- Total Commission (all payment types)
- Cashless Commission total
- Cash Commission total
- Count by status (pending, submitted, verified, paid)

#### Owner View
- Total Commission for period
- Cashless Commission (requires bank transfer)
- Cash Commission (for in-person payment)
- Transaction history with payment method labels

### 6. Transaction History

Full transaction table showing:
- Date
- Booking reference
- Vehicle information
- Rental amount
- Commission amount (10%)
- Payment method (labeled as Cashless or Cash)
- Current status
- Action buttons (for owners to submit proof)

## Database Schema

### `commissions` Table

```sql
- id: UUID (Primary Key)
- booking_id: UUID (Foreign Key → bookings)
- owner_id: UUID (Foreign Key → users)
- rental_amount: DECIMAL(10, 2)
- commission_amount: DECIMAL(10, 2)
- commission_percentage: DECIMAL(5, 2) DEFAULT 10.00
- payment_method: TEXT (qrph, gcash, paymaya, grabpay, billease, cash)
- payment_type: TEXT (cashless, cash)
- status: TEXT (pending, submitted, verified, paid)

-- Cashless payment fields
- bank_transfer_reference: TEXT
- bank_name: TEXT
- transfer_date: TIMESTAMPTZ
- payment_proof_url: TEXT

-- Verification tracking
- verified_by: UUID (Foreign Key → users)
- verified_at: TIMESTAMPTZ
- verification_notes: TEXT

-- Timestamps
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## User Flows

### Owner - Cashless Payment Flow

1. **View Commission Due**
   - Navigate to `/owner/commissions`
   - See alert showing pending cashless commission amount
   - Filter by time period to see specific commissions

2. **Submit Payment Proof**
   - Click "Submit Proof" on pending commission
   - Fill in:
     - Bank Name
     - Transfer Reference Number
     - Transfer Date
   - Submit for verification

3. **Track Status**
   - Monitor status changes
   - View verification notes from admin
   - Resubmit if rejected

### Owner - Cash Payment Flow

1. **View Cash Commission Due**
   - Navigate to `/owner/commissions`
   - See alert showing total pending cash commission
   - Use time period filters (daily, weekly, monthly, yearly)

2. **Prepare for Store Visit**
   - Calculate total cash commission for the period
   - Print or note the summary
   - Visit store with exact amount

3. **Post-Payment**
   - Admin marks cash commissions as paid in system
   - Status automatically updates to `paid`

### Admin Flow

1. **Monitor All Commissions**
   - Navigate to `/admin/commissions`
   - View comprehensive dashboard with all owner commissions
   - Filter by:
     - Status (pending, submitted, verified, paid)
     - Payment Type (cashless, cash)
     - Time Period (daily, weekly, monthly, yearly)

2. **Verify Cashless Payments**
   - Review submitted payment proofs
   - Check bank account for matching transfer
   - Actions:
     - **Verify & Mark as Paid**: Confirms payment received
     - **Reject**: Returns to pending, owner must resubmit

3. **Track Cash Collections**
   - View cash commission summary by period
   - Use for store visit planning
   - Mark as paid after in-person collection

4. **Export Data**
   - Download CSV report of all commissions
   - Includes all transaction details
   - Use for accounting and reconciliation

## API Functions

### Commission Queries (`/src/lib/supabase/queries/commissions.ts`)

```typescript
// Create commission (auto-called on booking confirmation)
createCommission(bookingId, ownerId, rentalAmount, paymentMethod)

// Get all commissions (Admin)
getAllCommissions(filters?)

// Get owner's commissions
getOwnerCommissions(ownerId)

// Submit payment proof (Owner)
submitCommissionPayment(commissionId, data)

// Verify commission (Admin)
verifyCommission(commissionId, adminId, notes?)

// Reject commission (Admin)
rejectCommission(commissionId, adminId, notes)

// Get summary statistics
getCommissionSummary(filters?)

// Get commission by booking
getCommissionByBookingId(bookingId)
```

### Updated Booking Flow (`/src/lib/supabase/queries/bookings.ts`)

```typescript
// Confirm booking - now creates commission automatically
confirmBooking(bookingId, paymentMethod?)
```

## Pages

### Admin Commission Page
**Route**: `/admin/commissions`
**Features**:
- Comprehensive transaction table
- Time period filters (daily, weekly, monthly, yearly)
- Status and payment type filters
- Summary cards (total, cashless, cash)
- Verify/Reject actions for submitted payments
- CSV export

### Owner Commission Page
**Route**: `/owner/commissions`
**Features**:
- Transaction history table
- Payment method labels (Cashless/Cash)
- Submit payment proof dialog
- Time period filters
- Summary cards
- Pending payment alerts
- Status tracking

## Notifications & Alerts

### Owner Notifications
- **Pending Cashless Commission**: Yellow alert showing amount to transfer
- **Pending Cash Commission**: Blue alert showing amount for store visit
- **Submission Awaiting Verification**: Status badge indicating review

### Admin Notifications
- **New Submissions**: Highlighted rows for submitted payments
- **Action Required**: Count of submissions awaiting verification

## Security & Permissions

### Row-Level Security (RLS)

**Admins can:**
- View all commissions
- Update verification status
- Access all commission data

**Owners can:**
- View only their own commissions
- Update their own submissions
- Submit payment proof

**System (automated):**
- Create commission records on booking confirmation

## Best Practices

### For Owners
1. Submit payment proof immediately after transfer
2. Keep transfer references for records
3. Use correct payment method labels
4. Check commission status regularly
5. Prepare cash commissions before store visits

### For Admins
1. Verify submissions promptly
2. Add clear verification notes
3. Regular reconciliation with bank statements
4. Use time filters for accurate cash collection planning
5. Export data for monthly accounting

## Future Enhancements

Potential improvements:
- Automatic payment reminders
- Bulk verification for multiple commissions
- Integration with payment gateways
- Automated bank reconciliation
- Commission payment history analytics
- Mobile notifications for submission updates
- Automatic commission calculation based on vehicle tier
- Multi-currency support for international operations
