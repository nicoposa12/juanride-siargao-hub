# Document Resubmission - Final Implementation

## Overview
Implemented the document resubmission flow where rejected users must upload **ALL required documents again** (not just rejected ones) when they attempt to sign in.

## Implementation Date
November 28, 2025 (Final Version)

---

## User Flow

### Step 1: Rejected User Tries to Sign In
```
User with rejected account
    ↓
Enters credentials on /login
    ↓
Authentication successful
    ↓
System detects status = 'rejected'
    ↓
Auto-redirect to /resubmit (kept authenticated)
```

### Step 2: Resubmission Form
**URL**: `/resubmit`

**What Users See:**
- ❌ Red alert showing rejection reason from admin
- 📧 Their email (read-only)
- 📝 ALL required document upload fields (based on role)

**For Renters:**
- ID Document Type (dropdown)
- ID Document Upload

**For Owners:**
- Business Name (read-only)
- Business Permit Upload
- DTI/SEC Type Selection
- DTI/SEC Certificate Upload
- BIR Certificate Upload

### Step 3: Submit Documents
```
User fills form with ALL required documents
    ↓
Clicks "Resubmit Documents"
    ↓
Documents uploaded with status 'pending_resubmission'
    ↓
User status changed to 'pending_verification'
    ↓
Success message: "Your documents have been resubmitted. 
                  Please wait for admin approval."
    ↓
User automatically signed out
    ↓
Auto-redirect to /login after 2 seconds
```

### Step 4: Back to Login
User sees confirmation message on login page and must wait for admin approval.

---

## Key Design Decisions

### ✅ Upload ALL Documents (Not Just Rejected)
**Reasoning:**
- Ensures complete document set
- Prevents confusion about which docs to upload
- Simpler validation logic
- Clearer for users (upload everything)
- Admin gets fresh complete submission

### ✅ Status: 'pending_resubmission'
**Reasoning:**
- Distinguishes resubmissions from new users
- Admins can prioritize resubmissions
- Better tracking and analytics
- Orange badge/card in admin panel for visibility

### ✅ Keep User Authenticated During Resubmission
**Reasoning:**
- Better UX (don't force re-login)
- Secure (only rejected users can access)
- Smooth transition from login to resubmit

### ✅ Sign Out After Submission
**Reasoning:**
- Clean slate for re-review
- Prevents access to app with pending status
- Forces user to wait for approval

---

## Form Fields

### Renter Resubmission Form
```
┌──────────────────────────────────────────┐
│ Document Resubmission                    │
│ Please upload the required documents     │
│ again for verification.                  │
├──────────────────────────────────────────┤
│ ⚠️ Rejection Reason:                     │
│ Photo is blurry and document expired     │
├──────────────────────────────────────────┤
│ Email: user@email.com                    │
│                                          │
│ ID Document Type * [Select Type ▼]      │
│                                          │
│ Upload ID Document *                     │
│ [Choose File] ✅                         │
│                                          │
│ 📋 Important Tips                        │
│ • Ensure documents are clear             │
│ • Documents should not be expired        │
│ • Max 10MB per file                      │
│                                          │
│ [Resubmit Documents]                     │
│ [Cancel and Return to Login]             │
└──────────────────────────────────────────┘
```

### Owner Resubmission Form
```
┌──────────────────────────────────────────┐
│ Document Resubmission                    │
│ Please upload the required documents     │
│ again for verification.                  │
├──────────────────────────────────────────┤
│ ⚠️ Rejection Reason:                     │
│ Business Permit is expired               │
├──────────────────────────────────────────┤
│ Email: owner@email.com                   │
│ Business Name: ABC Corporation           │
│                                          │
│ Business Permit *                        │
│ [Choose File] ✅                         │
│                                          │
│ DTI or SEC Type * [DTI Registration ▼]  │
│                                          │
│ DTI/SEC Certificate *                    │
│ [Choose File] ✅                         │
│                                          │
│ BIR Certificate *                        │
│ [Choose File] ✅                         │
│                                          │
│ 📋 Important Tips                        │
│ • All documents required                 │
│ • Documents must be current              │
│ • Max 10MB per file                      │
│                                          │
│ [Resubmit Documents]                     │
│ [Cancel and Return to Login]             │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### Authentication Flow
**File:** `/src/contexts/auth-context.tsx`
```typescript
if (data.account_verification_status === 'rejected') {
  // Only redirect if not already on resubmit page (prevent loop)
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/resubmit')) {
    window.location.href = '/resubmit'
  }
  return data // Return profile data so page can use it
}
```

### Login Check
**File:** `/src/app/(auth)/login/page.tsx`
```typescript
if (userProfile.account_verification_status === 'rejected') {
  toast({
    title: 'Account Rejected',
    description: 'Your account was rejected. Please resubmit your documents.',
    variant: 'destructive',
  })
  setTimeout(() => {
    router.push('/resubmit')
  }, 1500)
  return
}
```

### Document Upload Status
**File:** `/src/app/(auth)/resubmit/page.tsx`
```typescript
// Upload documents with resubmission status
await supabase
  .from('business_documents')
  .insert({
    owner_id: userId,
    document_type: documentType,
    file_url: publicUrl,
    file_path: fileName,
    status: 'pending_resubmission',  // Special status for admin tracking
    submitted_at: new Date().toISOString(),
  })
```

### User Status Update
```typescript
// Update user back to pending after resubmission
await supabase
  .from('users')
  .update({
    account_verification_status: 'pending_verification',
    account_status_reason: null,  // Clear rejection reason
  })
  .eq('id', userId)
```

---

## Validation Rules

### Renter Validation
- ✅ Document type must be selected
- ✅ ID file must be uploaded
- ✅ File must be image or PDF
- ✅ File must be under 10MB

### Owner Validation
- ✅ Business Permit file required
- ✅ DTI/SEC type must be selected
- ✅ DTI/SEC Certificate file required
- ✅ BIR Certificate file required
- ✅ All files must be images or PDFs
- ✅ Each file must be under 10MB

---

## Admin Integration

### Admin Sees Resubmitted Documents
**Admin Verification Page** shows:

**Stats Card (Orange):**
```
┌──────────────────────┐
│ Pending Resubmission │
│ 🔄                   │
│ 3                    │
└──────────────────────┘
```

**Filter Option:**
- Pending Resubmission (shows only resubmitted docs)

**Badge Color:**
- 🟠 Orange with RefreshCw icon

**Admin Actions:**
- ✅ **Approve**: Changes status to 'approved'
- ❌ **Reject**: Changes status to 'rejected' (user can resubmit again)

---

## Security Features

### ✅ Authentication Required
- Page checks for authenticated user
- Redirects to login if not authenticated

### ✅ Status Verification
- Verifies user is actually in 'rejected' status
- Redirects non-rejected users to login

### ✅ Infinite Loop Prevention
- Auth context checks current path before redirecting
- Prevents redirect loop on `/resubmit` page

### ✅ File Security
- Documents uploaded to private Supabase buckets
- Signed URLs generated for admin viewing
- File type restrictions enforced

---

## Error Handling

### Missing Documents
```
Toast: "Missing Documents"
Description: "Please upload all required business documents."
```

### Upload Failure
```
Toast: "Submission Failed"
Description: [Error message from server]
User stays on form with data intact
```

### Not Authenticated
```
Toast: "Not Authenticated"
Description: "Please sign in to resubmit documents."
Redirect to /login
```

### Not Rejected Status
```
Toast: "Account Not Rejected"
Description: "Your account is not in rejected status."
Redirect to /login
```

---

## Database Operations

### Insert New Documents
```sql
-- Renter ID Document
INSERT INTO id_documents (
  renter_id,
  document_type,
  file_url,
  file_path,
  status,
  submitted_at
) VALUES (
  [user_id],
  [document_type],
  [file_url],
  [file_path],
  'pending_resubmission',
  NOW()
);

-- Owner Business Documents (3 inserts)
INSERT INTO business_documents (
  owner_id,
  document_type,
  file_url,
  file_path,
  status,
  submitted_at
) VALUES (
  [user_id],
  [document_type],
  [file_url],
  [file_path],
  'pending_resubmission',
  NOW()
);
```

### Update User Status
```sql
UPDATE users
SET 
  account_verification_status = 'pending_verification',
  account_status_reason = NULL
WHERE id = [user_id];
```

---

## Success Messages

### During Upload
```
Toast: "Submitting..."
Shows loading spinner on button
```

### After Successful Upload
```
Toast: "Documents Resubmitted Successfully! ✅"
Description: "Your documents have been resubmitted. 
              Please wait for admin approval."
Duration: 6 seconds
```

### On Login Page After Redirect
```
Message: "Your documents have been resubmitted. 
         Please wait for admin approval."
```

---

## File Structure

```
/src/app/(auth)/resubmit/page.tsx    - Main resubmission form
/src/contexts/auth-context.tsx       - Handles rejected user redirect
/src/app/(auth)/login/page.tsx       - Additional login check
/src/app/admin/verifications/page.tsx - Admin review interface
```

---

## Status Flow Chart

```
New User
    ↓
Signs Up → status: 'pending_verification'
    ↓
Admin Reviews
    ↓
    ├─→ Approved → status: 'approved' → Can access app
    │
    └─→ Rejected → status: 'rejected'
            ↓
        User tries to login
            ↓
        Redirected to /resubmit
            ↓
        Uploads ALL documents
            ↓
        status: 'pending_verification'
        documents status: 'pending_resubmission'
            ↓
        Admin Re-reviews
            ↓
            ├─→ Approved → Done
            │
            └─→ Rejected → Cycle repeats
```

---

## Benefits

### For Users
✅ Clear guidance on what went wrong  
✅ Simple process (upload all documents)  
✅ No confusion about partial resubmission  
✅ Confirmation message for peace of mind  

### For Admins
✅ Easy to spot resubmissions (orange badge)  
✅ Complete document set to review  
✅ Better tracking with dedicated status  
✅ Can prioritize resubmissions  

### For System
✅ Clean data (fresh complete submissions)  
✅ Better analytics on approval rates  
✅ Reduced complexity (no partial logic)  
✅ Clear audit trail  

---

## Testing Checklist

- [ ] Rejected renter can access resubmit page
- [ ] Rejected owner can access resubmit page
- [ ] Non-rejected users cannot access resubmit page
- [ ] Unauthenticated users redirected to login
- [ ] Rejection reason displays correctly
- [ ] Renter can upload ID document
- [ ] Owner can upload all 3 business documents
- [ ] File validation works (type, size)
- [ ] Form submission creates new documents
- [ ] Documents get 'pending_resubmission' status
- [ ] User status changes to 'pending_verification'
- [ ] User is signed out after submission
- [ ] Success message displays correctly
- [ ] Redirect to login works
- [ ] Login page shows confirmation message
- [ ] New documents appear in admin panel with orange badge
- [ ] Admin can filter by "Pending Resubmission"
- [ ] Admin can approve resubmitted documents
- [ ] Admin can reject resubmitted documents
- [ ] No infinite redirect loop occurs

---

## Related Documentation

- [Pending Resubmission Status](./PENDING_RESUBMISSION_STATUS.md) - Admin tracking feature
- [Document Rejection Notification](./DOCUMENT_REJECTION_NOTIFICATION.md) - Email notifications
- [Account Resubmission Flow](./ACCOUNT_RESUBMISSION_FLOW.md) - Original implementation

---

## Summary

The final resubmission implementation requires users to upload **ALL required documents** when their account is rejected. This approach:

- **Simplifies** the user experience (no confusion about which docs)
- **Ensures** complete document sets for admin review
- **Maintains** clear tracking with 'pending_resubmission' status
- **Provides** smooth flow from rejection to resubmission to approval

Users are redirected to the resubmission form when they try to sign in, upload all required documents, receive confirmation, and are redirected back to the login page to wait for admin approval. 🎯
