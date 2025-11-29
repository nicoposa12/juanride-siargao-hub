# Owner Suspension Warning Implementation

## 📋 Overview

Implemented suspension warning banners that appear on the **Owner Dashboard** and **Owner Commissions** pages when an owner's account has been suspended by an admin.

---

## 🎯 What Was Implemented

### 1. **Owner Dashboard Warning Banner**
**File:** `src/app/owner/dashboard/page.tsx`

#### Features:
- ✅ **Red alert banner** appears at top of dashboard when owner is suspended
- ✅ Shows **suspension reason** provided by admin
- ✅ Displays **suspension date**
- ✅ Shows **contact admin message** with mail icon
- ✅ Prominent warning that owner cannot accept new bookings

#### Example Banner:
```
┌─────────────────────────────────────────────┐
│ 🚫 Account Suspended                       │
│                                             │
│ Your account has been suspended and you     │
│ cannot accept new bookings at this time.    │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Reason:                              │   │
│ │ Repeated unpaid commissions          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Suspended on: November 28, 2025             │
│                                             │
│ 📧 Please contact the administrator to     │
│    resolve this issue and restore your     │
│    account.                                 │
└─────────────────────────────────────────────┘
```

---

### 2. **Owner Commissions Page Warning Banner**
**File:** `src/app/owner/commissions/page.tsx`

#### Features:
- ✅ **Same red alert banner** appears on commissions page
- ✅ Shows suspension reason and date
- ✅ Informs owner they can only view pending commissions
- ✅ Shows contact admin message

#### Example Banner:
```
┌─────────────────────────────────────────────┐
│ 🚫 Account Suspended                       │
│                                             │
│ Your account has been suspended. You can    │
│ only view pending commissions but cannot    │
│ accept new bookings.                        │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Reason:                              │   │
│ │ Repeated unpaid commissions          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Suspended on: November 28, 2025             │
│                                             │
│ 📧 Please contact the administrator to     │
│    resolve this issue and restore your     │
│    account.                                 │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Technical Implementation

### Database Columns Used

From migration `00045_update_commission_statuses.sql`:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);
```

### Suspension Info State

Both pages now track suspension info:

```typescript
const [suspensionInfo, setSuspensionInfo] = useState<{
  is_suspended: boolean
  suspension_reason: string | null
  suspended_at: string | null
} | null>(null)
```

### Data Fetching

Both pages fetch suspension status when loading:

```typescript
// Check if user is suspended
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('is_suspended, suspension_reason, suspended_at')
  .eq('id', user.id)
  .single()

if (!userError && userData) {
  setSuspensionInfo(userData)
}
```

### Conditional Rendering

Banner only shows when owner is suspended:

```tsx
{suspensionInfo?.is_suspended && (
  <Alert variant="destructive" className="mb-8 border-red-600 bg-red-50">
    <Ban className="h-5 w-5" />
    <AlertTitle className="text-xl font-bold">Account Suspended</AlertTitle>
    <AlertDescription className="mt-2 space-y-2">
      {/* Warning content */}
    </AlertDescription>
  </Alert>
)}
```

---

## 🎨 UI Components Used

### Imports Added:

**Dashboard:**
```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Ban, Mail } from 'lucide-react'
```

**Commissions:**
```typescript
import { AlertTitle } from '@/components/ui/alert' // Added
import { Ban, Mail } from 'lucide-react' // Added
```

### Styling:
- **Alert Variant:** `destructive` (red theme)
- **Border:** `border-red-600`
- **Background:** `bg-red-50`
- **Icon Color:** Red tint
- **Title:** `text-xl font-bold`
- **Reason Box:** `bg-red-100 border-red-300`

---

## 🔄 Complete User Flow

### When Admin Suspends an Owner:

1. **Admin clicks "Suspend Owner"** in commission dropdown menu
2. Admin enters suspension reason (e.g., "Repeated unpaid commissions")
3. Admin clicks "Suspend Owner" button
4. Database updates:
   ```sql
   UPDATE users SET
     is_suspended = TRUE,
     suspension_reason = 'Repeated unpaid commissions',
     suspended_at = NOW(),
     suspended_by = <admin_id>
   WHERE id = <owner_id>
   ```

### When Suspended Owner Logs In:

1. **Owner Dashboard:**
   - ✅ Red suspension banner appears at top
   - Shows full suspension details
   - Shows contact admin message

2. **Owner Commissions Page:**
   - ✅ Red suspension banner appears
   - Shows same suspension details
   - Informs they can only view pending commissions

3. **Owner Bookings Page:**
   - Owner should see suspension message (future implementation)
   - Cannot confirm new bookings

4. **Owner Vehicles Page:**
   - Owner should see suspension message (future implementation)
   - Cannot add new vehicles or activate listings

---

## 🧪 Testing Scenarios

### Test 1: Suspend Owner from Admin
1. Login as **Admin**
2. Go to **Admin Commissions** page
3. Click **3-dot menu** on Justin Gange's commission
4. Select **"Suspend Owner"**
5. Enter reason: "3+ unpaid commissions"
6. Click **"Suspend Owner"**
7. **Expected:** Toast shows "Owner Suspended" with Justin's name

### Test 2: View Dashboard as Suspended Owner
1. Login as **Justin Gange** (suspended owner)
2. Go to **Owner Dashboard**
3. **Expected:**
   - Red banner at top
   - Shows "Account Suspended" title
   - Shows suspension reason
   - Shows suspension date
   - Shows contact admin message

### Test 3: View Commissions as Suspended Owner
1. Still logged in as **Justin Gange**
2. Go to **Owner Commissions** page
3. **Expected:**
   - Same red banner appears
   - Shows suspension details
   - Can view commission list
   - Cannot submit new payment proofs (if also implemented)

### Test 4: Unsuspend Owner
1. Login as **Admin**
2. Go to **User Management** (if available) or database
3. Set `is_suspended = FALSE` for Justin Gange
4. Login as **Justin Gange**
5. **Expected:** No suspension banner appears

---

## 📋 Status Summary Updates

### Owner Commissions Page - Fixed Status References

**Old Status Names:**
- `pending` → `unpaid`
- `submitted` → `for_verification`
- `paid` → `paid` (unchanged)

**Updated Functions:**
```typescript
// Badge colors
const colors = {
  unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  for_verification: 'bg-blue-100 text-blue-800 border-blue-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
  suspended: 'bg-red-100 text-red-800 border-red-300',
}

// Pending cash total
.filter(c => c.payment_type === 'cash' && c.status === 'unpaid')

// Pending cashless total
.filter(c => c.payment_type === 'cashless' && c.status === 'unpaid')

// Submit proof button
{commission.status === 'unpaid' && commission.payment_type === 'cashless' && ...}

// Awaiting verification message
{commission.status === 'for_verification' && ...}
```

---

## ⚠️ Important Notes

### 1. **Suspension Only Shows Warning**
Currently, suspension only displays a warning message. It does NOT actually block:
- Booking confirmations
- Vehicle listings
- Payment submissions

These restrictions need to be implemented in the respective components.

### 2. **Admin Can Suspend from Commissions Page**
Admins can suspend owners directly from the commission management page using the 3-dot dropdown menu.

### 3. **Suspension is Account-Wide**
When an owner is suspended:
- All their vehicles are affected
- All their commission records remain visible
- They can still login and view data
- They just can't accept new bookings (when enforced)

### 4. **Database Changes Required**
Make sure migration `00045_update_commission_statuses.sql` has been run to add the suspension columns to the `users` table.

---

## 🚀 Next Steps (Recommended)

### 1. **Enforce Booking Restrictions**
- Check `is_suspended` before allowing booking confirmations
- Show error message to suspended owners
- Prevent new bookings from being created for suspended owners

### 2. **Add Suspension Warning to Other Owner Pages**
- **Bookings Page:** Show banner, disable confirmation buttons
- **Vehicles Page:** Show banner, disable add/edit actions
- **Earnings Page:** Show banner (view-only is okay)

### 3. **Admin Notification**
- Send email to owner when suspended
- Include suspension reason and admin contact
- Provide clear steps to resolve

### 4. **Unsuspension Flow**
- Add admin UI to unsuspend owners
- Send email notification when account is restored
- Log unsuspension event for audit trail

### 5. **Automatic Suspension Triggers**
- Implement auto-suspension for 3+ unpaid commissions >30 days
- Send warning before auto-suspension
- Admin review required before final suspension

---

## ✅ Checklist

- [x] Add suspension columns to users table (migration)
- [x] Fetch suspension info on owner dashboard
- [x] Display suspension banner on owner dashboard
- [x] Fetch suspension info on owner commissions page
- [x] Display suspension banner on owner commissions page
- [x] Update owner commissions status references (unpaid, for_verification)
- [x] Style banners with red theme and proper messaging
- [x] Include suspension reason and date
- [x] Show contact admin message
- [ ] Enforce booking restrictions (pending)
- [ ] Add suspension warning to bookings page (pending)
- [ ] Add suspension warning to vehicles page (pending)
- [ ] Create unsuspension UI for admin (pending)
- [ ] Implement email notifications (pending)

---

## 📞 Support

### How to Suspend an Owner:
1. Go to **Admin Commissions** page
2. Find a commission from the owner you want to suspend
3. Click **3-dot menu (⋮)**
4. Select **"Suspend Owner"** (red option at bottom)
5. Enter detailed suspension reason
6. Click **"Suspend Owner"** button

### How to Unsuspend an Owner:
Currently via database:
```sql
UPDATE users 
SET 
  is_suspended = FALSE,
  suspension_reason = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE id = '<owner_user_id>';
```

**Recommendation:** Add admin UI for unsuspension in user management page.

---

**Status:** Owner suspension warning banners fully implemented ✅  
**Remaining:** Enforce booking restrictions and add unsuspension UI

Great work! The suspension system is now visible to owners. 🎉
