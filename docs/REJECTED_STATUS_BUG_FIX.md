# Rejected Status Bug Fix

## Problem Summary

Owners with rejected business documents were seeing **"Account Pending Approval"** instead of **"Account Rejected"** when trying to log in. They were not being properly redirected to the resubmission page.

---

## Root Causes Identified

### **1. Admin Verification Logic Bug**
**File:** `src/app/admin/verifications/page.tsx` (Lines 380-396)

**Issue:** When admin approved one document, the code would reset account status to `'pending_verification'` even if other documents were still `'rejected'`.

**What happened:**
```
1. Admin rejects BIR Certificate → Account = 'rejected' ✅
2. Admin approves Business Permit → Account = 'pending_verification' ❌ (overwrites!)
3. User logs in → Sees "Pending Approval" instead of "Rejected" ❌
```

**Why it happened:**
```typescript
// OLD BUGGY CODE
let accountStatus = 'pending_verification'  // Always defaults to pending!
if (action === 'approve' && hasBusinessPermit && hasDtiOrSec && hasBir) {
  accountStatus = 'approved'
} else if (action === 'reject') {
  accountStatus = 'rejected'
}
// ❌ Doesn't check if ANY documents are already rejected
```

---

### **2. Auth Context Check Order Bug**
**File:** `src/contexts/auth-context.tsx` (Lines 187-206)

**Issue:** The code checked for `'pending_verification'` BEFORE checking for `'rejected'`, so rejected users were caught by the pending check.

**What happened:**
```
User logs in with rejected account
  ↓
Auth context loads profile
  ↓
First check: status === 'pending_verification'? 
  If YES (wrong status from bug #1) → Show "Pending" message ❌
  ↓
Second check: status === 'rejected'?
  Never reached because first check already triggered! ❌
```

---

## Fixes Applied

### **Fix 1: Admin Verification Logic**

**Added check for ANY rejected documents:**

```typescript
// NEW FIXED CODE
const hasRejectedDocs = ownerDocs?.some(d => d.status === 'rejected')

let accountStatus = 'pending_verification'
if (action === 'reject' || hasRejectedDocs) {
  // ✅ If rejecting OR any document already rejected → REJECTED
  accountStatus = 'rejected'
} else if (action === 'approve' && hasBusinessPermit && hasDtiOrSec && hasBir) {
  // ✅ Only approve when ALL required documents approved
  accountStatus = 'approved'
}
```

**Now:**
- If ANY document is rejected → Account stays `'rejected'`
- Only when ALL required docs approved → Account becomes `'approved'`
- Otherwise → Account stays `'pending_verification'`

---

### **Fix 2: Auth Context Check Order**

**Reordered checks to prioritize rejected status:**

```typescript
// ✅ NEW ORDER: Check rejected FIRST
if (data.account_verification_status === 'rejected') {
  console.warn('❌ User account rejected, redirecting to resubmission page...')
  window.location.href = '/resubmit'
  return data
}

// ✅ THEN check pending
if (data.account_verification_status === 'pending_verification') {
  console.warn('⏳ User account pending verification, forcing sign out...')
  await supabase.auth.signOut()
  window.location.href = '/login?message=Your+account+is+pending+verification...'
  return null
}
```

**Now:**
- Rejected accounts get redirected to `/resubmit` immediately
- Pending accounts see the pending message
- No overlap between the two states

---

### **Fix 3: Improved Login Message**

**Updated rejection message to be more explicit:**

```typescript
// OLD MESSAGE
"Your account was rejected. Please resubmit your documents."

// NEW MESSAGE
"Your account documents have been rejected by the admin. Please review and resubmit the required documents."
```

---

## Database Cleanup Required

Many owner accounts are currently in the wrong state (rejected docs but pending status).

### **Run the SQL Script:**

**File:** `fix-rejected-status.sql`

**What it does:**
1. Identifies all owners with rejected documents
2. Updates their `account_verification_status` to `'rejected'`
3. Sets proper `account_status_reason`
4. Verifies the fix

**Quick version:**
```sql
UPDATE users
SET 
  account_verification_status = 'rejected',
  account_status_reason = 'One or more business documents were rejected. Please review and resubmit the required documents.'
WHERE role = 'owner'
  AND id IN (
    SELECT DISTINCT owner_id
    FROM business_documents
    WHERE status = 'rejected'
  )
  AND account_verification_status != 'rejected';
```

---

## Expected Behavior After Fix

### **Scenario 1: User with Rejected Documents Logs In**

```
User enters email/password
  ↓
Login page checks profile
  ↓
Status = 'rejected' detected
  ↓
🔴 Toast: "Account Rejected"
"Your account documents have been rejected by the admin..."
  ↓
Wait 1.5 seconds
  ↓
Auto-redirect to /resubmit page
  ↓
Resubmit page shows:
- Specific rejection reasons
- Only rejected documents
- Upload fields
```

### **Scenario 2: Admin Workflow**

```
Admin reviews owner documents
  ↓
Admin rejects BIR Certificate
  ↓
✅ Account status = 'rejected'
✅ Email sent to owner
  ↓
Admin later approves Business Permit
  ↓
✅ Account status STAYS 'rejected' (not overwritten!)
  ↓
Admin approves DTI
  ↓
✅ Account status STILL 'rejected' (BIR still rejected)
  ↓
Owner resubmits BIR Certificate
  ↓
New BIR with status 'pending_review'
Account becomes 'pending_verification'
  ↓
Admin approves new BIR
  ↓
✅ ALL docs approved → Account becomes 'approved'
```

---

## Files Modified

### **1. Admin Verification Page**
- **File:** `src/app/admin/verifications/page.tsx`
- **Lines:** 380-402
- **Change:** Added check for rejected documents before setting status

### **2. Auth Context**
- **File:** `src/contexts/auth-context.tsx`
- **Lines:** 187-206
- **Change:** Reordered status checks (rejected first, then pending)

### **3. Login Page**
- **File:** `src/app/(auth)/login/page.tsx`
- **Lines:** 134-137
- **Change:** Updated rejection message text

### **4. SQL Fix Script**
- **File:** `fix-rejected-status.sql`
- **Purpose:** Fix existing accounts in wrong state

---

## Testing Checklist

- [ ] Owner with rejected BIR sees "Account Rejected" message
- [ ] Owner is redirected to `/resubmit` page
- [ ] Resubmit page shows only rejected documents
- [ ] Admin approving one doc doesn't clear rejection status
- [ ] Admin approving ALL docs changes status to approved
- [ ] Rejection email sent to owner
- [ ] Owner can resubmit documents
- [ ] After resubmit, account becomes 'pending_verification'
- [ ] SQL script fixes existing accounts

---

## Prevention

This bug won't happen again because:

1. ✅ **Admin logic now checks for ANY rejected documents** before setting status
2. ✅ **Auth context prioritizes rejected status** in check order
3. ✅ **Clear separation of concerns** - rejection check happens first
4. ✅ **Proper state machine** - rejected stays rejected until ALL docs approved

---

## Visual Flow After Fix

```
┌─────────────────────────────────────────┐
│  Owner with Rejected Documents          │
└─────────────────────────────────────────┘
                 ↓
         Attempts to Log In
                 ↓
    ┌──────────────────────────┐
    │  Auth Context Loads      │
    │  Checks Status Order:    │
    │  1. ✅ Rejected?         │
    │  2. Pending?             │
    │  3. Suspended?           │
    └──────────────────────────┘
                 ↓
         Status = 'rejected'
                 ↓
    ┌──────────────────────────┐
    │  🔴 Toast Notification   │
    │  "Account Rejected"      │
    │  Documents rejected by   │
    │  admin. Please resubmit  │
    └──────────────────────────┘
                 ↓
         Wait 1.5 seconds
                 ↓
    ┌──────────────────────────┐
    │  Redirect to /resubmit   │
    └──────────────────────────┘
                 ↓
    ┌──────────────────────────┐
    │  Resubmission Form       │
    │  - Shows rejection       │
    │    reasons               │
    │  - Upload fields for     │
    │    rejected docs only    │
    └──────────────────────────┘
```

---

## Status

- **Issue:** ✅ Identified
- **Root Cause:** ✅ Found
- **Code Fix:** ✅ Applied
- **Database Fix:** ⏳ Ready (run SQL script)
- **Testing:** ⏳ Pending
- **Documentation:** ✅ Complete

---

**Last Updated:** November 28, 2025  
**Status:** Ready for Testing
