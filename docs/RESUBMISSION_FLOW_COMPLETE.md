# Document Resubmission Flow - Complete Implementation

## ✅ Flow is Already Implemented!

The document resubmission flow for rejected accounts is fully working as requested.

---

## 🔄 Complete Flow Diagram

```
User with rejected account
    ↓
Tries to Sign In
    ↓
Auth Context detects: account_verification_status = 'rejected'
    ↓
Auto-redirect to /resubmit (stays authenticated)
    ↓
Shows Resubmission Form with rejected documents only
    ↓
User uploads rejected documents
    ↓
Submits form
    ↓
Shows confirmation toast: 'Your documents have been resubmitted. Please wait for admin approval.'
    ↓
Signs user out
    ↓
Redirects to /login after 2 seconds
    ↓
User sees message on login page: 'Your documents have been resubmitted. Please wait for admin approval.'
```

---

## 🎯 Implementation Details

### **1. Auth Context Detection** (`/src/contexts/auth-context.tsx`)

**Lines 197-206:**
```typescript
// Check for rejected accounts - redirect to resubmission page
if (data.account_verification_status === 'rejected') {
  console.warn('❌ User account rejected, redirecting to resubmission page...')
  // Don't sign out - keep them authenticated so they can resubmit
  // Only redirect if not already on the resubmit page (prevent infinite loop)
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/resubmit')) {
    window.location.href = '/resubmit'
  }
  return data // Return the profile data so the page can use it
}
```

**Key Features:**
- ✅ Detects `rejected` status automatically on login
- ✅ Keeps user authenticated (doesn't sign out)
- ✅ Redirects to `/resubmit` page
- ✅ Prevents infinite redirect loop

---

### **2. Resubmission Form** (`/src/app/(auth)/resubmit/page.tsx`)

#### **Smart Document Detection** (Lines 124-150)
```typescript
// Fetch rejected documents
if (profile.role === 'renter') {
  const { data: rejectedIdDocs } = await supabase
    .from('id_documents')
    .select('*')
    .eq('renter_id', user.id)
    .eq('status', 'rejected')
    .order('submitted_at', { ascending: false })
  
  if (rejectedIdDocs && rejectedIdDocs.length > 0) {
    setRejectedDocuments(rejectedIdDocs)
    setIdDocumentType(rejectedIdDocs[0].document_type)
  }
} else if (profile.role === 'owner') {
  const { data: rejectedBizDocs } = await supabase
    .from('business_documents')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'rejected')
    .order('submitted_at', { ascending: false })
  
  if (rejectedBizDocs && rejectedBizDocs.length > 0) {
    setRejectedDocuments(rejectedBizDocs)
  }
}
```

**Key Features:**
- ✅ Fetches ONLY rejected documents
- ✅ Shows rejection reason for each document
- ✅ Dynamic form based on rejected docs

---

#### **Submission Handler** (Lines 295-307)
```typescript
// Sign out the user
await supabase.auth.signOut()

// Show success message
toast({
  title: 'Documents Resubmitted Successfully! ✅',
  description: 'Your documents have been resubmitted. Please wait for admin approval.',
  duration: 6000,
})

// Redirect to login after a short delay
setTimeout(() => {
  router.push('/login?message=Your+documents+have+been+resubmitted.+Please+wait+for+admin+approval.')
}, 2000)
```

**Key Features:**
- ✅ Shows confirmation toast
- ✅ Signs user out
- ✅ Redirects to login page with success message
- ✅ 2-second delay to let user see the toast

---

## 🎨 User Experience Flow

### **Step 1: Login Attempt**
```
Login Page
┌─────────────────────────────────────┐
│ Email: rejected@example.com         │
│ Password: ••••••••                  │
│ [Sign In]                           │
└─────────────────────────────────────┘
    ↓
Auto-redirect detected!
```

### **Step 2: Resubmission Page**
```
Document Resubmission
┌─────────────────────────────────────────────┐
│ ⚠️ Rejection Reason: Documents expired     │
├─────────────────────────────────────────────┤
│ Email: rejected@example.com                 │
│ Business Name: JuanRide                     │
│                                             │
│ ⚠️ Only resubmit rejected documents:       │
│ • BIR Certificate: Document expired         │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ BIR Certificate of Registration *    │  │
│ │ Rejection Reason: Document expired    │  │
│ │ [Choose File] ✅                      │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [Resubmit Documents]                        │
└─────────────────────────────────────────────┘
```

### **Step 3: Success Toast**
```
┌────────────────────────────────────────────┐
│ ✅ Documents Resubmitted Successfully!    │
│ Your documents have been resubmitted.     │
│ Please wait for admin approval.           │
└────────────────────────────────────────────┘
```

### **Step 4: Back to Login**
```
Login Page
┌─────────────────────────────────────────────┐
│ ✅ Your documents have been resubmitted.   │
│    Please wait for admin approval.         │
├─────────────────────────────────────────────┤
│ Email: [                    ]               │
│ Password: [                    ]            │
│ [Sign In]                                   │
└─────────────────────────────────────────────┘
```

---

## 📋 Confirmation Messages

### **Toast Notification (In-App)**
```typescript
toast({
  title: 'Documents Resubmitted Successfully! ✅',
  description: 'Your documents have been resubmitted. Please wait for admin approval.',
  duration: 6000,  // Shows for 6 seconds
})
```

### **Login Page Message (URL Parameter)**
```
/login?message=Your+documents+have+been+resubmitted.+Please+wait+for+admin+approval.
```

---

## 🔐 Security Features

### **Authenticated Resubmission**
- ✅ User stays logged in during resubmit process
- ✅ Can only see their own rejected documents
- ✅ RLS policies protect document access
- ✅ Signs out after successful submission

### **Redirect Protection**
```typescript
// Prevent infinite redirect loop
if (typeof window !== 'undefined' && !window.location.pathname.includes('/resubmit')) {
  window.location.href = '/resubmit'
}
```

---

## 🎯 Smart Resubmission Features

### **Only Rejected Documents Shown**
**Example: Owner with 3 documents**
```
Business Permit: ✅ Approved    → NOT shown
DTI Registration: ✅ Approved   → NOT shown
BIR Certificate: ❌ Rejected    → SHOWN ✅
```

**User only uploads:** BIR Certificate

### **Rejection Reasons Displayed**
```
┌─────────────────────────────────────┐
│ BIR Certificate *                   │
│ Rejection Reason: Document expired  │
│ [Choose File]                       │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

- [x] Rejected user redirected to /resubmit on login
- [x] User stays authenticated during resubmit
- [x] Only rejected documents shown
- [x] Rejection reasons displayed per document
- [x] User can upload new files
- [x] Submission validates all rejected docs uploaded
- [x] Success toast shown after submission
- [x] User signed out after submission
- [x] Redirected to login page after 2 seconds
- [x] Success message shown on login page

---

## 📊 Status After Resubmission

### **Database Changes**
```sql
-- Before resubmission
business_documents:
  id: 1, status: 'rejected', rejection_reason: 'Document expired'

-- After resubmission
business_documents:
  id: 1, status: 'rejected'  (old document unchanged)
  id: 2, status: 'pending_review' (new document created)

users:
  account_verification_status: 'pending_verification'  (updated from 'rejected')
  account_status_reason: NULL  (cleared)
```

### **Admin View**
```
Owner Business Documents
┌────────────────────────────────────────┐
│ Owner: Kim                             │
│ Business: JuanRide                     │
│ Documents Status: 🕐 3 documents       │
│                   (All Pending)        │
│ Submitted: Nov 28, 2025                │
└────────────────────────────────────────┘
```

---

## 📝 Code Files Involved

1. **Auth Context** - `/src/contexts/auth-context.tsx`
   - Detects rejected status
   - Redirects to resubmit page
   - Keeps user authenticated

2. **Resubmit Page** - `/src/app/(auth)/resubmit/page.tsx`
   - Fetches rejected documents
   - Shows smart form
   - Handles submission
   - Shows confirmation
   - Redirects to login

3. **Login Page** - Displays success message from URL parameter

---

## ✨ Summary

The complete resubmission flow is **already fully implemented** and working:

1. ✅ **Rejected users** are automatically redirected to `/resubmit` on login
2. ✅ **Smart form** shows only rejected documents with reasons
3. ✅ **Confirmation message** shown as toast and on login page
4. ✅ **Auto-redirect** back to login after 2 seconds
5. ✅ **User signed out** after successful submission
6. ✅ **Account status updated** to `pending_verification`

**No changes needed!** The flow matches your requirements exactly. 🎉

---

## 🎯 Exact Flow As Requested

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| If account status is Rejected, redirect to Resubmission Form on login | ✅ Done | `auth-context.tsx` lines 197-206 |
| Ask to upload rejected documents again | ✅ Done | Smart form shows only rejected docs |
| After submitting, show confirmation message | ✅ Done | Toast: 'Your documents have been resubmitted...' |
| Redirect to Sign In page | ✅ Done | Auto-redirect after 2 seconds |

**Everything is working as specified!** 🚀
