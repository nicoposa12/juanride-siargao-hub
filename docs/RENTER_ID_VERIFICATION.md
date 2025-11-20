# Renter ID Verification & Account Approval System

## Overview
This document describes the implementation of the renter ID verification system, which requires renters to upload a valid government-issued ID during signup. Their account will be pending approval until an admin reviews and approves the ID document.

## Implementation Date
November 21, 2025

## Features

### 1. **Required ID Upload for Renters**
During signup, renters must:
- Select an ID document type from approved list
- Upload a clear photo/scan of the ID (max 5MB)
- Valid formats: JPG, PNG, WEBP, PDF

### 2. **Supported ID Types**
- Driver's License (Required for motorcycles/cars)
- Passport
- UMID
- SSS ID
- PhilHealth ID
- Postal ID
- Voter's ID
- National ID (PhilSys)
- PRC ID
- School ID (with supporting documents)

### 3. **Account Verification Statuses**
- `pending_verification` - Waiting for admin approval (cannot login)
- `approved` - Account approved, can login normally
- `rejected` - Account rejected with reason
- `suspended` - Account temporarily suspended

### 4. **Admin Verification Dashboard**
Admins can:
- View all pending ID verifications
- See renter details (name, email, phone, registration date)
- View uploaded ID document
- Approve accounts (allows login)
- Reject accounts with reason (blocks login)
- Filter by status (pending, approved, rejected)

## Database Changes

### Migration: `00031_add_renter_account_approval.sql`

Added columns to `users` table:
```sql
- account_verification_status TEXT (pending_verification, approved, rejected, suspended)
- account_status_reason TEXT (rejection/suspension reason)
- account_verified_at TIMESTAMPTZ (when approved)
- verified_by UUID (admin who approved)
```

### Existing Tables (from migration 00020)
- `id_documents` - Stores uploaded ID documents
- Storage bucket: `id-documents` (private)

## File Structure

### Frontend Components
```
src/
├── app/
│   ├── (auth)/signup/page.tsx          # Updated signup with ID upload
│   └── admin/verifications/page.tsx    # New admin verification dashboard
├── components/
│   └── auth/pending-approval-modal.tsx # Modal shown after renter signup
└── contexts/
    └── auth-context.tsx                # Updated to block pending users
```

### Backend
```
supabase/
└── migrations/
    ├── 00020_identity_verification.sql         # ID documents table
    ├── 00021_id_document_storage_policies.sql  # Storage policies
    └── 00031_add_renter_account_approval.sql   # Account approval system
```

## User Flow

### Renter Signup Flow
1. User fills signup form
2. Selects "Renter" role
3. **NEW:** Additional fields appear:
   - ID Document Type dropdown
   - File upload input
4. Submit form
5. Account created with `account_verification_status = 'pending_verification'`
6. ID uploaded to Supabase Storage
7. Record created in `id_documents` table with status `pending_review`
8. **Pending Approval Modal** shown
9. User redirected to login (but cannot login until approved)

### Login Flow (Pending Account)
1. User tries to login
2. Auth context loads profile
3. Detects `account_verification_status = 'pending_verification'`
4. Forces logout
5. Redirects to login with message: "Your account is pending verification. Please wait for admin approval."

### Admin Approval Flow
1. Admin navigates to **ID Verifications** page
2. Sees list of pending ID documents
3. Clicks "View" to see details:
   - Renter information
   - ID document image
   - Document type
4. Admin reviews ID:
   - **Approve:** Sets account to `approved`, user can now login
   - **Reject:** Sets account to `rejected` with reason, user cannot login

### Login Flow (Approved Account)
1. User logs in normally
2. Auth context loads profile
3. `account_verification_status = 'approved'`
4. User proceeds to dashboard

## Key Implementation Details

### 1. File Upload Validation
```typescript
// File type validation
const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

// File size validation (max 5MB)
if (file.size > 5 * 1024 * 1024) {
  // Show error
}
```

### 2. Storage Path Structure
```
id-documents/
  └── {userId}/
      └── {documentType}_{timestamp}.{ext}
```

### 3. Auth Context Blocking Logic
```typescript
// Check for pending verification status
if (data.account_verification_status === 'pending_verification') {
  await supabase.auth.signOut()
  setProfile(null)
  setUser(null)
  window.location.href = '/login?message=Your+account+is+pending+verification...'
  return null
}
```

### 4. Auto-Approval for Owners/Admins
```sql
-- Trigger automatically approves non-renter accounts
CREATE TRIGGER trg_auto_approve_non_renters
BEFORE INSERT OR UPDATE OF role ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_non_renters();
```

## Security Considerations

### Storage Security
- ID documents stored in **private bucket** (`id-documents`)
- RLS policies ensure:
  - Renters can only access their own documents
  - Admins can access all documents
  - Owners can view documents linked to their bookings

### Data Privacy
- ID documents contain sensitive personal information
- Only admins can view pending documents
- Rejection reasons are stored for audit trail
- Documents can be deleted by admins or renters

## Admin Dashboard Access

**URL:** `/admin/verifications`

**Navigation:** Admin Sidebar → ID Verifications (with ShieldCheck icon)

## Testing Checklist

- [ ] Renter can signup with ID upload
- [ ] Owner signup works without ID requirement
- [ ] Pending renter cannot login
- [ ] Admin can view pending verifications
- [ ] Admin can approve renter account
- [ ] Admin can reject renter account with reason
- [ ] Approved renter can login successfully
- [ ] Rejected renter sees rejection reason
- [ ] File upload validates type and size
- [ ] Storage policies work correctly
- [ ] Auth context blocks pending users

## Future Enhancements

1. **Email Notifications**
   - Send email when account is approved
   - Send email when account is rejected
   - Reminder emails for pending accounts

2. **Document Expiration**
   - Track ID expiration dates
   - Remind users to update expired IDs
   - Auto-flag expired documents

3. **Advanced Verification**
   - OCR text extraction from IDs
   - Face matching between ID and profile photo
   - Integration with government verification APIs

4. **Analytics**
   - Average approval time
   - Rejection rate by ID type
   - Peak verification times

## Related Documentation
- `ADMIN_UI_ENHANCEMENTS.md` - Admin dashboard features
- `docs/migrations/00020_identity_verification.sql` - ID documents schema
- `docs/migrations/00031_add_renter_account_approval.sql` - Account approval schema

## Support & Troubleshooting

### Common Issues

**Issue:** "Failed to upload ID document"
- **Cause:** File too large or wrong format
- **Solution:** Ensure file is < 5MB and JPG/PNG/WEBP/PDF

**Issue:** Pending renter keeps getting logged out
- **Cause:** Account not approved yet
- **Solution:** Wait for admin approval or contact support

**Issue:** Admin cannot see pending verifications
- **Cause:** RLS policies or wrong role
- **Solution:** Verify user has `role = 'admin'` in database

## Contact
For issues or questions, contact the development team or create a support ticket.
