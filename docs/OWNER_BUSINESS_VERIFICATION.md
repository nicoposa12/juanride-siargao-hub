# Owner Business Document Verification System

## Overview
Owners must upload required business documents during signup. Their account will be pending approval until an admin reviews and approves all business documents.

## Implementation Date
November 21, 2025

## Features

### Required Business Documents for Owners
1. **Business Permit or Mayor's Permit** (Required)
2. **DTI or SEC Registration** (At least one required)
   - DTI Registration for sole proprietorships
   - SEC Registration for corporations/partnerships
3. **BIR Certificate of Registration** (Required)

### Owner Signup Flow
1. Fill basic information (name, email, password, phone)
2. Select "Owner" role
3. **Additional Owner Fields Appear:**
   - Business Name (as registered)
   - Business Type (Sole Proprietorship, Partnership, Corporation, Cooperative)
   - Business Permit upload
   - DTI/SEC Registration upload (choose type first)
   - BIR COR upload
4. Submit form
5. Account created with `account_verification_status = 'pending_verification'`
6. All 3 documents uploaded to `business-documents` storage bucket
7. Records created in `business_documents` table
8. **Pending Approval Modal** shown
9. Redirected to login (but cannot login until approved)

### Database Changes

#### Migration: `00032_add_owner_business_verification.sql`

**New Table:** `business_documents`
```sql
- id UUID (Primary Key)
- owner_id UUID (References users)
- document_type TEXT (business_permit, dti_registration, sec_registration, bir_registration)
- status TEXT (pending_review, approved, rejected, expired)
- file_url TEXT
- file_path TEXT  
- business_name TEXT
- registration_number TEXT
- issue_date DATE
- expiry_date DATE
- submitted_at TIMESTAMPTZ
- reviewed_at TIMESTAMPTZ
- reviewer_id UUID
- rejection_reason TEXT
```

**New Columns in users:**
```sql
- business_name TEXT
- business_type TEXT (sole_proprietorship, partnership, corporation, cooperative)
```

**Updated Trigger:**
- `auto_approve_non_renters()` now only auto-approves admins
- Both renters and owners require verification

### Storage
- **Bucket:** `business-documents` (private)
- **Path Structure:** `{owner_id}/{document_type}_{timestamp}.{ext}`
- **RLS Policies:**
  - Owners can upload/read their own documents
  - Admins have full access

## Admin Approval Workflow

### Admin Dashboard Updates
The `/admin/verifications` page now includes:

1. **Tabs:** Toggle between "Renter IDs" and "Owner Business Docs"
2. **For Owner Documents:**
   - View all 3 documents for each owner
   - See business information (name, type)
   - Approve/Reject individual documents or entire account
   - Add rejection reasons

### Approval Process
1. Admin selects "Owner Business Docs" tab
2. Views pending owner verifications
3. Clicks to view all submitted documents
4. Reviews:
   - Business Permit
   - DTI/SEC Registration
   - BIR Certificate
5. Approves or rejects with reason
6. Owner account status updates to `approved` or `rejected`

## Key Implementation Files

### Frontend
- `/src/app/(auth)/signup/page.tsx` - Updated with owner document upload
- `/src/app/admin/verifications/page.tsx` - Extended for business documents
- `/src/components/auth/pending-approval-modal.tsx` - Reused for owners

### Backend
- `supabase/migrations/00032_add_owner_business_verification.sql`
- Storage bucket: `business-documents`

### Storage
- **business_documents** table stores all metadata
- **business-documents** bucket stores actual files

## Validation Rules

### File Validation
- **Formats:** JPG, PNG, WEBP, PDF
- **Size:** Maximum 5MB per file
- **Total:** 3 files required (Permit, DTI/SEC, BIR)

### Field Validation
- Business Name: Required, trimmed
- Business Type: Must select from dropdown
- All 3 documents: Required uploads

## Security Features

1. **Private Storage:** Documents in private bucket
2. **RLS Policies:** Owners only see their own docs
3. **Admin-Only Approval:** Only admins can approve/reject
4. **Audit Trail:** Tracks reviewer, timestamps, reasons
5. **Auth Blocking:** Pending owners cannot login

## Backward Compatibility

**Existing Owners (Before Migration):**
- Migration sets existing owners to `pending_verification`
- Admin should either:
  - Manually approve legacy owners, OR
  - Request them to submit business documents

**Recommendation:** Create an admin tool to bulk-approve legacy owners if trusted.

## Testing Checklist

- [ ] Owner can signup with all 3 business documents
- [ ] Cannot signup without all required documents
- [ ] Business name and type saved correctly
- [ ] Documents uploaded to correct storage bucket
- [ ] Pending owner cannot login
- [ ] Admin can view all 3 documents
- [ ] Admin can approve owner account
- [ ] Admin can reject with reason
- [ ] Approved owner can login
- [ ] File validation works (size, type)
- [ ] Business info displays in owner profile

## Future Enhancements

1. **Document Expiry Tracking**
   - Track permit/registration expiry dates
   - Send renewal reminders
   - Auto-flag expired documents

2. **Automated Verification**
   - OCR to extract business name/numbers
   - Verify with government APIs (DTI, SEC, BIR)
   - Cross-reference business name consistency

3. **Document Updates**
   - Allow owners to update expired documents
   - Version control for document history
   - Approval workflow for updates

4. **Business Insights**
   - Analytics on business types
   - Average approval time by business type
   - Rejection reasons analysis

5. **Email Notifications**
   - Welcome email on approval
   - Rejection email with instructions
   - Expiry reminders

## Related Documentation
- `RENTER_ID_VERIFICATION.md` - Renter verification system
- `supabase/migrations/00032_add_owner_business_verification.sql` - Schema

## Support

### Common Issues

**Issue:** "Business documents upload failed"
- Check all 3 files are selected
- Verify file size < 5MB each
- Ensure correct file formats

**Issue:** Existing owner cannot login
- May need admin approval
- Check `account_verification_status` in database
- Admin can manually approve

**Issue:** Admin cannot see owner documents
- Check RLS policies on `business_documents`
- Verify admin role
- Check storage bucket permissions

## Contact
For issues, contact development team or create support ticket.
