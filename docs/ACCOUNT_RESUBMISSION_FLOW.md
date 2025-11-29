# Account Resubmission Flow for Rejected Users

## Overview
Implemented a complete document resubmission workflow for users whose accounts have been rejected by admins. When a rejected user attempts to sign in, they are automatically redirected to a resubmission form where they can upload corrected documents.

## Implementation Date
November 27, 2025

## User Flow

### 1. Rejected User Attempts Login
**Scenario**: User with rejected account tries to sign in

**Flow**:
1. User enters credentials on login page
2. System authenticates user successfully
3. System checks `account_verification_status` field
4. If status is `'rejected'`, system:
   - Shows toast: "Account Rejected - Your account was rejected. Please resubmit your documents."
   - Keeps user authenticated (doesn't sign out)
   - Redirects to `/resubmit` after 1.5 seconds

### 2. Resubmission Form Page
**Location**: `/resubmit`

**Features**:
- ✅ Shows rejection reason from admin
- ✅ Displays user's email and role
- ✅ Role-specific document upload fields
- ✅ Document type selection
- ✅ File validation and preview
- ✅ Important tips section
- ✅ Cancel option to return to login

**Renter Form Fields**:
- ID Document Type (dropdown)
  - Driver's License
  - Passport
  - National ID (PhilID)
  - UMID
  - SSS ID
  - PhilHealth ID
  - Postal ID
  - Voter's ID
  - PRC ID
  - School ID
- ID Document File Upload (image/PDF, max 10MB)

**Owner Form Fields**:
- Business Name (read-only, from profile)
- Business Permit Upload
- DTI/SEC Registration Type (dropdown)
  - DTI Registration (Sole Proprietorship)
  - SEC Registration (Corporation/Partnership)
- DTI/SEC Certificate Upload
- BIR Certificate Upload

### 3. Document Submission
**Process**:
1. User fills out form and uploads all required documents
2. System validates all required fields
3. Documents are uploaded to Supabase Storage:
   - **Renters**: `id-documents` bucket
   - **Owners**: `business-documents` bucket
4. Document records created in database with `status: 'pending_review'`
5. User's `account_verification_status` updated to `'pending_verification'`
6. User's `account_status_reason` cleared (set to null)
7. User is automatically signed out
8. Success message displayed
9. Redirect to login page after 2 seconds

### 4. Post-Submission
**Message Displayed**:
> "Your documents have been resubmitted. Please wait for admin approval."

**User Actions**:
- Cannot log in until admin reviews and approves
- Will see "Account Pending Approval" message if they try to log in
- Must wait for admin verification

## Components Modified

### 1. Auth Context (`src/contexts/auth-context.tsx`)

**Changed**: Line 197-203

**Old Behavior**:
```typescript
// Signed out rejected users and redirected to login with error message
await supabase.auth.signOut()
window.location.href = `/login?message=Your+account+has+been+rejected.${reason}`
```

**New Behavior**:
```typescript
// Keeps user authenticated and redirects to resubmission page
// Don't sign out - keep them authenticated so they can resubmit
window.location.href = '/resubmit'
```

### 2. Login Page (`src/app/(auth)/login/page.tsx`)

**Added**: Lines 131-157

**New Checks** (after admin check, before success):
1. **Rejected Account Check**:
   - Shows toast notification
   - Keeps user authenticated
   - Redirects to `/resubmit` after 1.5 seconds

2. **Pending Verification Check** (moved up):
   - Shows toast notification
   - Signs out user
   - Prevents login

### 3. New Resubmission Page (`src/app/(auth)/resubmit/page.tsx`)

**Location**: `src/app/(auth)/resubmit/page.tsx`

**Key Functions**:
- `checkRejectedAccount()`: Validates user is authenticated and actually rejected
- `uploadIdDocument()`: Uploads renter ID documents to storage
- `uploadBusinessDocument()`: Uploads owner business documents to storage
- `handleSubmit()`: Handles form submission and database updates

**Security Checks**:
- ✅ Requires authenticated user
- ✅ Verifies user is actually in rejected status
- ✅ Redirects to login if not rejected
- ✅ Prevents access without authentication

## Database Operations

### Renter Resubmission
```sql
-- 1. Upload new ID document
INSERT INTO id_documents (
  renter_id,
  document_type,
  file_url,
  file_path,
  status,
  submitted_at
) VALUES (
  [user_id],
  [selected_type],
  [public_url],
  [file_path],
  'pending_review',
  NOW()
);

-- 2. Update user status
UPDATE users
SET account_verification_status = 'pending_verification',
    account_status_reason = NULL
WHERE id = [user_id];
```

### Owner Resubmission
```sql
-- 1. Upload business permit
INSERT INTO business_documents (...) VALUES (...);

-- 2. Upload DTI/SEC registration
INSERT INTO business_documents (...) VALUES (...);

-- 3. Upload BIR certificate
INSERT INTO business_documents (...) VALUES (...);

-- 4. Update user status
UPDATE users
SET account_verification_status = 'pending_verification',
    account_status_reason = NULL
WHERE id = [user_id];
```

## Storage Buckets

### Renter Documents
- **Bucket**: `id-documents`
- **Path Pattern**: `{userId}/{documentType}-{timestamp}.{ext}`
- **Example**: `123e4567-e89b-12d3-a456-426614174000/drivers_license-1732723800000.jpg`

### Owner Documents
- **Bucket**: `business-documents`
- **Path Pattern**: `{userId}/{documentType}-{timestamp}.{ext}`
- **Examples**:
  - `business_permit-1732723800000.jpg`
  - `dti_registration-1732723800000.pdf`
  - `bir_registration-1732723800000.png`

## UI/UX Features

### Rejection Reason Alert
```
┌─────────────────────────────────────────┐
│ ⚠️ Account Rejected                     │
│                                         │
│ Rejection Reason: Documents are        │
│ unclear and expired. Please upload     │
│ current valid IDs.                     │
└─────────────────────────────────────────┘
```

### Document Upload Indicators
- ✅ Green checkmark icon when file is selected
- 📄 File type icon for document fields
- ℹ️ File format and size requirements

### Important Tips Section
```
📋 Important Tips
• Ensure documents are clear and legible
• All required information must be visible
• Documents should be current and not expired
• Maximum file size: 10MB per document
```

### Loading States
- Spinner during initial account check
- "Submitting..." button state during upload
- Disabled buttons during submission
- Success message before redirect

## Error Handling

### Not Authenticated
**Error**: User accesses `/resubmit` without being logged in
**Action**: Redirect to `/login` with toast notification

### Not Rejected
**Error**: User with non-rejected status accesses `/resubmit`
**Action**: Redirect to `/login` with toast notification

### Missing Documents
**Error**: User submits without all required documents
**Action**: Show toast "Missing Documents - Please upload all required documents"

### Upload Failure
**Error**: File upload to storage fails
**Action**: Show toast with error message, keep form open

### Database Error
**Error**: Cannot update user status
**Action**: Show toast with error message, don't sign out user

## Validation Rules

### File Requirements
- **Accepted Formats**: JPG, PNG, PDF
- **Maximum Size**: 10MB per file
- **Required Fields**: All document uploads are mandatory

### Renter Requirements
- Must select document type
- Must upload ID document file

### Owner Requirements
- Must upload business permit
- Must select DTI or SEC type
- Must upload DTI/SEC certificate
- Must upload BIR certificate

## Account Status Transitions

```
rejected → (user resubmits) → pending_verification → (admin approves) → approved
                                                   → (admin rejects) → rejected (loop)
```

## Admin Integration

After resubmission:
1. New documents appear in Admin Verifications page
2. Status shows as "Pending Review"
3. Admin can:
   - View new documents
   - Approve (sets status to `approved`)
   - Reject again (sends rejection email, user can resubmit again)

## Security Considerations

### Authentication Required
- All resubmission actions require authenticated user
- Session maintained during resubmission process
- User automatically signed out after successful submission

### Status Verification
- System verifies user is actually in rejected status
- Prevents abuse by non-rejected users
- Redirects unauthorized access attempts

### File Upload Security
- Files uploaded to private Supabase buckets
- Signed URLs generated for admin viewing
- File type and size restrictions enforced

## Testing Checklist

- [ ] Rejected renter can access resubmission form
- [ ] Rejected owner can access resubmission form
- [ ] Non-rejected users cannot access form
- [ ] Unauthenticated users redirected to login
- [ ] Rejection reason displays correctly
- [ ] Renter can upload ID document
- [ ] Owner can upload all 3 business documents
- [ ] File validation works (type, size)
- [ ] Form submission updates database correctly
- [ ] User status changes to pending_verification
- [ ] User is signed out after submission
- [ ] Success message displays
- [ ] Redirect to login works
- [ ] New documents appear in admin panel
- [ ] Cancel button returns to login

## Future Enhancements

1. **Document Preview**: Show thumbnail of uploaded file before submission
2. **Progress Bar**: Show upload progress for large files
3. **Drag & Drop**: Allow drag-and-drop file upload
4. **Multiple Attempts Tracking**: Track how many times user resubmitted
5. **Email Notification**: Send email confirmation when documents are resubmitted
6. **Partial Resubmission**: Allow resubmitting only specific rejected documents
7. **Document Comparison**: Show old vs new document side-by-side for admin
8. **Auto-save Draft**: Save form data if user navigates away

## Related Documentation
- [Document Rejection Notification](./DOCUMENT_REJECTION_NOTIFICATION.md)
- [Admin Verification Page Analysis](./ADMIN_VERIFICATION_PAGE.md)

## Support

If users have questions about resubmission:
- Email: support@juanride.com
- Available: 24/7
- Include: User email and rejection reason
