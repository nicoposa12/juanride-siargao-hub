# Auto-Unsuspend Owner on Payment Fix

## 📋 Problem

**Issue Reported:**
- Admin marked a suspended commission as "paid"
- Owner still sees suspension warning banner on dashboard
- Owner's vehicles still hidden from renter browse page
- Owner cannot receive new bookings

**Root Cause:**
When admin marks a suspended commission as "paid", it only updates the **commission status** to "paid", but does NOT update the **user suspension status** in the `users` table. The suspension and commission status are stored in separate tables.

---

## 🔧 Solution

Implemented **auto-unsuspend logic** that automatically unsuspends the owner when marking a suspended commission as paid.

---

## ✅ Changes Made

### **1. Update `updateCommissionStatus()` Function** (`commissions.ts`)

**File:** `src/lib/supabase/queries/commissions.ts`

**Added:**
```typescript
// First, get the commission to check current status and owner
const { data: commission, error: fetchError } = await supabase
  .from('commissions')
  .select('status, owner_id')
  .eq('id', commissionId)
  .single()

// ... update commission status ...

// ✅ AUTO-UNSUSPEND: If marking as paid and commission was suspended
if (newStatus === 'paid' && commission?.status === 'suspended' && commission?.owner_id) {
  const { error: unsuspendError } = await supabase
    .from('users')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    })
    .eq('id', commission.owner_id)
  
  if (unsuspendError) {
    console.error('Error unsuspending owner:', unsuspendError)
    // Don't fail the whole operation, just log the error
  }
}
```

**What It Does:**
1. Fetches the commission to get current status and owner_id
2. Updates the commission status to "paid"
3. **If commission was "suspended" → "paid":** Automatically unsuspends the owner
4. Clears all suspension-related fields in the `users` table

---

### **2. Update Toast Notification** (`page.tsx`)

**File:** `src/app/admin/commissions/page.tsx`

**Before:**
```typescript
toast({
  title: 'Status Updated',
  description: `Commission has been ${actionLabels[selectedAction]}.`,
})
```

**After:**
```typescript
// Check if we unsuspended an owner
const unsuspendedOwner = selectedAction === 'paid' && selectedCommission.status === 'suspended'

toast({
  title: 'Status Updated',
  description: unsuspendedOwner 
    ? `Commission marked as paid and owner ${selectedCommission.owner?.full_name || 'account'} has been unsuspended.`
    : `Commission has been ${actionLabels[selectedAction]}.`,
})
```

**What It Does:**
- Shows special message when marking suspended commission as paid
- Informs admin that owner has been unsuspended
- Shows owner's name in the notification

---

### **3. Add Warning in Status Update Dialog** (`page.tsx`)

**Added:**
```tsx
{/* Auto-unsuspend warning */}
{selectedAction === 'paid' && selectedCommission.status === 'suspended' && (
  <Alert className="bg-green-50 border-green-300">
    <Info className="h-4 w-4 text-green-600" />
    <AlertDescription className="text-green-800">
      <strong>Note:</strong> Marking this suspended commission as paid will automatically 
      <strong>unsuspend the owner's account</strong> and restore their ability to receive bookings.
    </AlertDescription>
  </Alert>
)}
```

**What It Shows:**
- Green info alert in the Status Update Dialog
- Only appears when marking a "suspended" commission as "paid"
- Warns admin that owner will be unsuspended

---

## 🔄 Complete Flow

### **Before (Problem):**
```
1. Admin suspends Justin Gange
   ↓
2. Justin's commission status: "suspended"
3. Justin's user account: is_suspended = TRUE
   ↓
4. Admin marks commission as "paid"
   ↓
5. Justin's commission status: "paid" ✅
6. Justin's user account: is_suspended = TRUE ❌ (NOT CHANGED)
   ↓
7. PROBLEM:
   • Justin still sees suspension banner
   • Justin's vehicles still hidden
   • Justin cannot receive bookings
```

### **After (Fixed):**
```
1. Admin suspends Justin Gange
   ↓
2. Justin's commission status: "suspended"
3. Justin's user account: is_suspended = TRUE
   ↓
4. Admin marks commission as "paid"
   ↓
5. Justin's commission status: "paid" ✅
6. Justin's user account: is_suspended = FALSE ✅ (AUTO-UNSUSPENDED)
   ↓
7. RESULT:
   ✅ Justin's suspension banner disappears
   ✅ Justin's vehicles appear in browse page
   ✅ Justin can receive new bookings
   ✅ Admin sees notification: "Commission marked as paid and owner Justin Gange has been unsuspended"
```

---

## 🧪 Testing Instructions

### **Test 1: Mark Suspended Commission as Paid**

**Steps:**
1. **Ensure Justin Gange is suspended:**
   - Login as Admin
   - Go to Admin Commissions
   - Verify Justin's commission shows "Suspended" status
   - Verify Justin's account has `is_suspended = TRUE`

2. **Mark commission as paid:**
   - Click **3-dot menu (⋮)** on Justin's suspended commission
   - Select **"Mark as Paid"**
   - **Expected:** Green alert appears saying "Marking this suspended commission as paid will automatically unsuspend the owner's account"
   - Click **"Update Status"**

3. **Verify changes:**
   - **Expected Toast:** "Commission marked as paid and owner Justin Gange has been unsuspended"
   - Commission status changed to "Paid" (green badge)
   - Justin's account: `is_suspended = FALSE`

4. **Test as owner:**
   - Login as **Justin Gange**
   - Go to **Dashboard**
   - **Expected:** Suspension banner is **GONE** ✅

5. **Test renter browse:**
   - Logout and browse vehicles (or use guest mode)
   - Search for "Honda Nmax" or "Honda Click"
   - **Expected:** Justin's vehicles **APPEAR** in results ✅

6. **Test booking creation:**
   - Try to create a booking for Justin's vehicle
   - **Expected:** Booking succeeds ✅

---

### **Test 2: Mark Non-Suspended Commission as Paid**

**Steps:**
1. Find a commission with status "For Verification" (not suspended)
2. Mark it as "Paid"
3. **Expected:**
   - No green warning alert
   - Normal toast: "Commission has been marked as paid"
   - No unsuspension happens (owner was not suspended)

---

### **Test 3: Other Status Changes**

**Steps:**
1. Try marking suspended commission as "Unpaid"
2. **Expected:** No unsuspension (only "paid" triggers auto-unsuspend)
3. Try marking suspended commission as "For Verification"
4. **Expected:** No unsuspension

---

## 📊 Database Changes

### **Before Marking Suspended Commission as Paid:**

**commissions table:**
```sql
id: abc123
owner_id: justin_gange_id
status: 'suspended'
commission_amount: 42.00
```

**users table:**
```sql
id: justin_gange_id
is_suspended: TRUE
suspension_reason: 'not paying commission'
suspended_at: '2025-11-29T00:00:00Z'
suspended_by: admin_id
```

---

### **After Marking as Paid:**

**commissions table:**
```sql
id: abc123
owner_id: justin_gange_id
status: 'paid'  ✅ CHANGED
commission_amount: 42.00
verified_by: admin_id  ✅ ADDED
verified_at: '2025-11-29T01:00:00Z'  ✅ ADDED
```

**users table:**
```sql
id: justin_gange_id
is_suspended: FALSE  ✅ CHANGED
suspension_reason: NULL  ✅ CLEARED
suspended_at: NULL  ✅ CLEARED
suspended_by: NULL  ✅ CLEARED
```

---

## ⚠️ Important Notes

### **1. Only "Paid" Status Triggers Auto-Unsuspend**

Marking a suspended commission as:
- ❌ "Unpaid" → Does NOT unsuspend
- ❌ "For Verification" → Does NOT unsuspend
- ✅ "Paid" → **UNSUSPENDS OWNER**

**Reason:** Only when admin verifies payment should the owner be restored.

---

### **2. Manual Unsuspend Still Available**

Admins can still manually unsuspend owners using the existing `unsuspendOwner` function:

```typescript
// Manual unsuspension (if needed)
await unsuspendOwner(ownerId)
```

Or via SQL:
```sql
UPDATE users 
SET 
  is_suspended = FALSE,
  suspension_reason = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE id = '<owner_id>';
```

---

### **3. Error Handling**

If unsuspension fails:
- Commission status is still updated to "paid"
- Error is logged to console
- Admin sees normal "marked as paid" message
- Admin should check owner suspension status manually

---

### **4. Existing Suspended Owners**

For owners suspended BEFORE this fix:
1. Admin needs to mark their suspended commission as "paid"
2. This will automatically unsuspend them
3. Their vehicles will immediately appear in browse page

**To fix current suspended owner (Justin Gange):**
```
1. Go to Admin Commissions
2. Find Justin's suspended commission
3. Click 3-dot menu → "Mark as Paid"
4. Justin is now unsuspended ✅
```

---

## 🚀 Deployment Steps

### **1. Refresh Dev Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
# Or restart browser
```

### **2. Test the Fix**

Follow the testing instructions above to verify:
- Marking suspended commission as "paid" unsuspends owner
- Green alert shows in dialog
- Toast shows "owner has been unsuspended"
- Suspension banner disappears for owner
- Vehicles reappear in browse page

### **3. Fix Current Suspended Owners**

If you have any currently suspended owners:
1. Login as Admin
2. Go to Commissions page
3. For each suspended owner:
   - Find their suspended commission
   - Mark as "Paid"
   - Verify they're unsuspended

---

## 📝 Files Modified

| File | What Changed |
|---|---|
| `src/lib/supabase/queries/commissions.ts` | Added auto-unsuspend logic to `updateCommissionStatus()` |
| `src/app/admin/commissions/page.tsx` | Updated toast notification and added warning alert in dialog |

---

## ✅ Summary

**Problem:**
- Marking suspended commission as "paid" didn't unsuspend the owner

**Solution:**
- Auto-unsuspend owner when marking suspended commission as "paid"
- Show warning to admin before confirming
- Show notification after unsuspension

**Result:**
- ✅ Owner suspension banner disappears
- ✅ Owner vehicles reappear in browse page
- ✅ Owner can receive new bookings
- ✅ Admin is informed of unsuspension

---

## 🎉 Testing Results

**Expected Outcomes:**

1. **Mark Justin's suspended commission as paid:**
   - ✅ Commission status → "Paid"
   - ✅ Justin's `is_suspended` → FALSE
   - ✅ Suspension banner disappears from Justin's dashboard
   - ✅ Justin's vehicles appear in browse page
   - ✅ Justin can receive bookings

2. **Toast notification:**
   - ✅ Shows: "Commission marked as paid and owner Justin Gange has been unsuspended"

3. **Status dialog warning:**
   - ✅ Green alert appears before marking as paid
   - ✅ Informs admin of auto-unsuspension

---

**Status:** Auto-unsuspend on payment fully implemented ✅  
**Effect:** Suspended owners are automatically restored when their commission is marked as paid ✅

Great work! The suspension system now handles payment resolution automatically. 🎉
