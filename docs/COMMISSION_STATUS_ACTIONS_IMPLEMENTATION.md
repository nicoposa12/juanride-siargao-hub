# Commission Status Actions Implementation

## 📋 Overview

Implemented a **3-dot dropdown menu** system to replace the eye button in the admin commission page, providing 4 distinct status actions for managing commission payments.

---

## 🎯 New Status Flow

### Previous Status Names (Old):
- `pending` → Waiting for payment
- `submitted` → Owner uploaded proof
- `verified` → Admin verified
- `paid` → Commission received

### New Status Names (Implemented):

#### 1️⃣ **UNPAID** (formerly "pending")
**Meaning:** Commission generated, but owner has NOT paid it yet

**Applies to:** Both cash and cashless transactions

**Admin Actions:**
- Wait for owner's payment (cashless)
- Remind owner during store visit (cash)

**Badge Color:** Yellow (bg-yellow-100)

---

#### 2️⃣ **FOR VERIFICATION** (formerly "submitted")
**Meaning:** Owner already sent payment and uploaded proof

**Admin Actions:**
- Check proof of transfer
- Approve → Set to PAID
- Reject → Set back to UNPAID

**Badge Color:** Blue (bg-blue-100)

---

#### 3️⃣ **PAID** (same as before)
**Meaning:** Admin verified payment, commission fully settled

**Admin Actions:**
- Only set after confirmation
- No further actions needed

**Badge Color:** Green (bg-green-100)

---

#### 4️⃣ **SUSPENDED** (NEW)
**Meaning:** Admin suspended owner due to violations

**Reasons:**
- Repeated unpaid commissions
- Incorrect or fake proof of payment
- Violations related to commission settlement

**Effects When Suspended:**
- Owner cannot accept new bookings
- Owner can only view pending commissions
- Dashboard shows suspension message
- Can be lifted by admin at any time

**Badge Color:** Red (bg-red-100)

---

## 🗂️ Files Modified

### 1. **Database Migration**
**File:** `supabase/migrations/00045_update_commission_statuses.sql`

**Changes:**
- Updated status check constraint to new values
- Changed default status from 'pending' to 'unpaid'
- Added user suspension columns:
  - `is_suspended` (BOOLEAN)
  - `suspension_reason` (TEXT)
  - `suspended_at` (TIMESTAMPTZ)
  - `suspended_by` (UUID, references users)
- Added index for suspended users lookup
- Migrated existing status values

---

### 2. **TypeScript Types**
**File:** `src/lib/supabase/queries/commissions.ts`

#### Type Updates:
```typescript
// OLD
export type CommissionStatus = 'pending' | 'submitted' | 'verified' | 'paid'

// NEW
export type CommissionStatus = 'unpaid' | 'for_verification' | 'paid' | 'suspended'
```

#### Label Updates:
```typescript
// OLD
{
  pending: 'Pending Payment',
  submitted: 'Payment Submitted',
  verified: 'Verified',
  paid: 'Paid',
}

// NEW
{
  unpaid: 'Not Paid',
  for_verification: 'For Verification',
  paid: 'Paid',
  suspended: 'Suspended',
}
```

#### Summary Interface Updates:
```typescript
// OLD
pending_count, submitted_count, verified_count, paid_count

// NEW
unpaid_count, for_verification_count, paid_count, suspended_count
```

---

### 3. **New Query Functions**
**File:** `src/lib/supabase/queries/commissions.ts`

#### Added 3 New Functions:

**a) updateCommissionStatus()**
```typescript
updateCommissionStatus(
  commissionId: string,
  newStatus: CommissionStatus,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; error?: any }>
```
- Handles all 4 status transitions
- Automatically manages verification fields
- Clears payment proof when marking as unpaid

**b) suspendOwner()**
```typescript
suspendOwner(
  ownerId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: any }>
```
- Suspends owner account
- Records suspension reason and admin
- Sets `is_suspended = true` in users table

**c) unsuspendOwner()**
```typescript
unsuspendOwner(
  ownerId: string
): Promise<{ success: boolean; error?: any }>
```
- Lifts owner suspension
- Clears suspension fields
- Sets `is_suspended = false`

---

### 4. **Admin Commission Page UI**
**File:** `src/app/admin/commissions/page.tsx`

#### New Imports:
- `DropdownMenu` components
- `MoreVertical`, `Ban`, `Clock`, `FileCheck` icons
- New query functions

#### State Additions:
```typescript
const [statusDialog, setStatusDialog] = useState(false)
const [suspendDialog, setSuspendDialog] = useState(false)
const [selectedAction, setSelectedAction] = useState<CommissionStatus | null>(null)
```

#### Replaced Eye Button with Dropdown:
**Before:**
```typescript
<Button variant="outline" onClick={() => setSelectedCommission(commission)}>
  <Eye className="h-4 w-4" />
</Button>
```

**After:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    {/* 4 Status Action Options */}
    <DropdownMenuItem>Mark as Unpaid</DropdownMenuItem>
    <DropdownMenuItem>For Verification</DropdownMenuItem>
    <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600">Suspend Owner</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### New Handler Functions:

**handleStatusUpdate()**
- Updates commission status
- Shows success toast with action label
- Reloads commission list
- Supports optional notes

**handleSuspendOwner()**
- Validates suspension reason is provided
- Suspends owner account
- Updates commission status to 'suspended'
- Shows warning toast with owner name

---

## 🎨 UI Components Added

### 1. **Status Update Dialog**
**Features:**
- Shows current commission details (owner, amount, status)
- Allows admin to add optional notes
- Displays new status in dialog title
- Confirms before updating

**Layout:**
```
┌─────────────────────────────────────┐
│ Update Commission Status            │
│ Change the status to: Not Paid      │
├─────────────────────────────────────┤
│ Owner: Nico Mar Oposa               │
│ Amount: ₱50.00                      │
│ Current Status: For Verification    │
│                                     │
│ Notes (Optional):                   │
│ [Text area for notes]               │
├─────────────────────────────────────┤
│ [Cancel] [Update Status]            │
└─────────────────────────────────────┘
```

---

### 2. **Suspend Owner Dialog**
**Features:**
- Shows suspension effects warning
- Requires suspension reason (mandatory)
- Red color scheme to indicate serious action
- Lists consequences of suspension

**Layout:**
```
┌─────────────────────────────────────┐
│ Suspend Owner Account ⚠️           │
│ This will suspend Nico Mar Oposa    │
├─────────────────────────────────────┤
│ ⚠️ Suspension Effects:             │
│ • Cannot accept new bookings        │
│ • Can only view pending commissions │
│ • Dashboard shows suspension msg    │
│ • Can be lifted by admin anytime    │
│                                     │
│ Suspension Reason *:                │
│ [Text area for reason]              │
├─────────────────────────────────────┤
│ [Cancel] [Suspend Owner]            │
└─────────────────────────────────────┘
```

---

## 📊 Dropdown Menu Structure

```
┌─────────────────────────────────────┐
│ Change Status                       │
├─────────────────────────────────────┤
│ ⭕ Mark as Unpaid                   │
│    Owner has not paid yet           │
│                                     │
│ ⏰ For Verification                 │
│    Owner submitted proof            │
│                                     │
│ ✅ Mark as Paid                     │
│    Payment verified & received      │
├─────────────────────────────────────┤
│ 🚫 Suspend Owner                    │
│    Block from new bookings          │
└─────────────────────────────────────┘
```

**Icons Used:**
- **Unpaid:** `XCircle` (yellow)
- **For Verification:** `Clock` (blue)
- **Paid:** `CheckCircle` (green)
- **Suspend:** `Ban` (red)

---

## 🔄 Status Transition Logic

### Allowed Transitions:

```
UNPAID ──────┬──────────> FOR_VERIFICATION
 ↑           │                    │
 │           │                    ↓
 │           └────────────────> PAID
 │                               
 │                              
 └───────────────────────────> SUSPENDED
                                (from any status)
```

### Auto-Updates:

1. **submitCommissionPayment()** → Sets to `for_verification`
2. **verifyCommission()** → Sets to `paid`
3. **rejectCommission()** → Sets back to `unpaid`
4. **suspendOwner()** → Sets commission to `suspended` + suspends user
5. **updateCommissionStatus()** → Direct status change with admin action

---

## 🧪 Testing Scenarios

### Test 1: Mark Commission as Unpaid
1. Click 3-dot menu on a commission
2. Select "Mark as Unpaid"
3. Dialog opens with commission details
4. Add optional note (e.g., "Payment not received")
5. Click "Update Status"
6. **Expected:** Status changes to "Not Paid" (yellow badge)

### Test 2: Move to For Verification
1. Click 3-dot menu
2. Select "For Verification"
3. Add note (e.g., "Owner uploaded proof")
4. Click "Update Status"
5. **Expected:** Status changes to "For Verification" (blue badge)

### Test 3: Mark as Paid
1. Click 3-dot menu on "For Verification" commission
2. Select "Mark as Paid"
3. Add verification note
4. Click "Update Status"
5. **Expected:** Status changes to "Paid" (green badge)
6. **Expected:** `verified_by` and `verified_at` fields are populated

### Test 4: Suspend Owner
1. Click 3-dot menu
2. Select "Suspend Owner"
3. Red warning dialog appears
4. Enter suspension reason (e.g., "3+ unpaid commissions")
5. Click "Suspend Owner"
6. **Expected:** 
   - Owner's `is_suspended` = `true`
   - Commission status = "Suspended" (red badge)
   - Owner cannot accept new bookings
   - Toast shows owner's name

---

## 📋 Database Schema Changes

### Users Table (New Columns):
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES users(id);

CREATE INDEX idx_users_is_suspended 
ON users(is_suspended) WHERE is_suspended = TRUE;
```

### Commissions Table (Updated Constraint):
```sql
ALTER TABLE commissions 
DROP CONSTRAINT commissions_status_check;

ALTER TABLE commissions 
ADD CONSTRAINT commissions_status_check 
CHECK (status IN ('unpaid', 'for_verification', 'paid', 'suspended'));

ALTER TABLE commissions 
ALTER COLUMN status SET DEFAULT 'unpaid';
```

---

## 🚀 Migration Guide

### Step 1: Run Database Migration
```bash
cd c:\Users\basco\Documents\GitHub\juanride-siargao-hub
supabase db push
```

Or manually run:
```sql
-- Run supabase/migrations/00045_update_commission_statuses.sql
```

### Step 2: Verify Migration
```sql
-- Check constraint updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'commissions_status_check';

-- Check new user columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('is_suspended', 'suspension_reason');
```

### Step 3: Test UI
1. Navigate to `/admin/commissions`
2. Verify 3-dot menu appears (no more eye icon)
3. Click dropdown and see 4 options
4. Test each status action
5. Verify dialogs open and close correctly

---

## ⚠️ Important Notes

### 1. Status Names Changed
- Code using old status names will break
- Update any manual SQL queries
- Check for hardcoded status references

### 2. Suspension is Serious
- Only admins can suspend owners
- Suspension blocks new bookings immediately
- Owner can still view existing commissions
- Must be manually lifted by admin

### 3. Backward Compatibility
- Migration auto-converts old status values
- `pending` → `unpaid`
- `submitted` → `for_verification`
- `verified` → `for_verification`
- `paid` → `paid` (unchanged)

---

## 🎯 Next Steps (Pending)

1. **Owner Commission Page Update**
   - Add similar 3-dot dropdown for owners
   - Limited actions (submit proof, view details)
   - No admin-only actions

2. **Owner Dashboard Warning**
   - Check `is_suspended` status on dashboard
   - Show red alert banner if suspended
   - Display suspension reason
   - Contact admin message

3. **Booking Restriction Logic**
   - Prevent suspended owners from confirming bookings
   - Add check in booking confirmation flow
   - Show error message to suspended owners

4. **Notification System**
   - Notify owner when suspended
   - Notify owner when unsuspended
   - Email notifications for status changes

---

## 📞 Support

### Common Issues:

**Issue:** Dropdown doesn't appear
**Solution:** Clear cache, verify imports are correct

**Issue:** Status won't update
**Solution:** Check migration ran successfully, verify admin role

**Issue:** Suspension doesn't block bookings
**Solution:** Implement booking confirmation check (pending)

---

## ✅ Checklist

- [x] Database migration created
- [x] TypeScript types updated
- [x] New query functions added
- [x] Admin page dropdown implemented
- [x] Status update dialog added
- [x] Suspend owner dialog added
- [x] Handler functions implemented
- [x] Badge colors updated
- [ ] Owner page dropdown (pending)
- [ ] Dashboard suspension warning (pending)
- [ ] Booking restriction logic (pending)
- [ ] Notification system (pending)

---

**Status:** Admin implementation complete ✅  
**Remaining:** Owner page updates and suspension enforcement

Good luck! 🚀
