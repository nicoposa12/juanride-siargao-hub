# Complete Document Verification System

## Overview
JuanRide now has a comprehensive document verification system for both renters and owners. Both user types must upload required documents during signup, and their accounts remain pending until an admin approves them.

## Implementation Date
November 21, 2025

---

## Renter ID Verification

### Required Documents
- **One valid government-issued ID** from:
  - Driver's License (required for motorcycles/cars)
  - Passport
  - UMID
  - SSS ID
  - PhilHealth ID
  - Postal ID
  - Voter's ID
  - National ID (PhilSys)
  - PRC ID
  - School ID (with supporting documents)

### Storage
- **Bucket:** `id-documents` (private)
- **Table:** `id_documents`

### Migration
- `00031_add_renter_account_approval.sql`

---

## Owner Business Verification

### Required Documents
1. **Business Permit or Mayor's Permit** (Required)
2. **DTI OR SEC Registration** (At least one required)
3. **BIR Certificate of Registration** (Required)

### Additional Information
- Business Name (as registered)
- Business Type (Sole Proprietorship, Partnership, Corporation, Cooperative)

### Storage
- **Bucket:** `business-documents` (private)
- **Table:** `business_documents`

### Migration
- `00032_add_owner_business_verification.sql`

---

## System Architecture

### Database Schema

#### Users Table Additions
```sql
-- Account verification
account_verification_status TEXT (pending_verification, approved, rejected, suspended)
account_status_reason TEXT
account_verified_at TIMESTAMPTZ
verified_by UUID

-- Business info (owners only)
business_name TEXT
business_type TEXT
```

#### Document Tables
1. **id_documents** - Renter ID documents
2. **business_documents** - Owner business documents

Both tables share similar structure:
- Document type
- Status (pending_review, approved, rejected, expired)
- File URLs and paths
- Submission and review tracking
- Reviewer information

### Auto-Approval Logic

**Updated Trigger:** `auto_approve_non_renters()`
```sql
- Admins: Auto-approved immediately
- Renters: Require ID verification
- Owners: Require business document verification
```

### Authentication Flow

```
User Signup → Upload Documents → Pending Status
     ↓
Cannot Login (blocked by auth context)
     ↓
Admin Reviews & Approves
     ↓
User Can Now Login
```

### Auth Context Protection

Location: `src/contexts/auth-context.tsx`

Checks on every profile load:
1. `is_active === false` → Deactivated
2. `account_verification_status === 'pending_verification'` → Pending
3. `account_verification_status === 'rejected'` → Rejected
4. `account_verification_status === 'suspended'` → Suspended

All non-approved statuses → Force logout + redirect to login with message

---

## User Interface

### Signup Page (`/signup`)

**Dynamic Fields Based on Role:**

**Renter Selected:**
- ID Document Type dropdown
- ID Document upload
- Alert about verification requirement

**Owner Selected:**
- Business Name input
- Business Type dropdown
- Business Permit upload
- DTI/SEC Type selection
- DTI/SEC Registration upload
- BIR Certificate upload
- Summary of required documents

### Pending Approval Modal

**Shown after successful signup:**
- Role-specific messaging (ID docs vs business docs)
- Verification timeline (24-48 hours)
- Instructions on what happens next
- Contact support option

### Admin Dashboard (`/admin/verifications`)

**Features:**
- Toggle between "Renter IDs" and "Owner Business Docs"
- Filter by status (Pending, Approved, Rejected)
- Statistics cards showing counts
- View document images
- Approve/Reject actions
- Rejection reason requirement
- User information display

**Navigation:**
- Admin Sidebar → ID Verifications (ShieldCheck icon)

---

## File Validation

### Accepted Formats
- JPG, JPEG
- PNG
- WEBP
- PDF

### Size Limits
- **Maximum:** 5MB per file
- **Total for Owners:** 15MB (3 files)

### Storage Structure
```
id-documents/
  └── {renter_id}/
      └── {document_type}_{timestamp}.{ext}

business-documents/
  └── {owner_id}/
      ├── business_permit_{timestamp}.{ext}
      ├── dti_registration_{timestamp}.{ext} OR
      ├── sec_registration_{timestamp}.{ext}
      └── bir_registration_{timestamp}.{ext}
```

---

## Security & Privacy

### Row Level Security (RLS)

**Both Document Tables:**
- Users can only view/manage their own documents
- Admins have full access
- No public access

### Storage Policies

**Both Buckets:**
- Users can upload to their own folder
- Users can read their own files
- Admins can read all files
- Private buckets (not publicly accessible)

### Audit Trail

All approvals/rejections tracked:
- `reviewer_id` - Who approved/rejected
- `reviewed_at` - When the action occurred
- `rejection_reason` - Why it was rejected
- `account_status_reason` - Reason in user table

---

## Migration Steps

### 1. Run Migrations
```bash
npx supabase db push
```

This runs:
- `00031_add_renter_account_approval.sql`
- `00032_add_owner_business_verification.sql`

### 2. Verify Storage Buckets
Check in Supabase Dashboard:
- `id-documents` bucket exists (private)
- `business-documents` bucket exists (private)

### 3. Update Existing Users

**Renters:**
```sql
-- Approve existing renters (if no verification needed)
UPDATE users 
SET account_verification_status = 'approved',
    account_verified_at = NOW()
WHERE role = 'renter' AND account_verification_status = 'pending_verification';
```

**Owners:**
```sql
-- Approve trusted existing owners
UPDATE users 
SET account_verification_status = 'approved',
    account_verified_at = NOW()
WHERE role = 'owner' 
AND account_verification_status = 'pending_verification'
AND created_at < '2025-11-21'; -- Before verification requirement
```

Or require them to upload documents.

---

## API Endpoints & Functions

### Supabase Functions

**`is_account_approved(user_id UUID)`**
- Returns boolean
- Checks if account is approved and active

**`has_all_required_business_documents(user_id UUID)`**
- Returns boolean
- Checks if owner uploaded all 3 required documents

---

## Testing Checklist

### Renter Flow
- [ ] Can signup with valid ID
- [ ] Cannot signup without ID
- [ ] Pending modal shows correct message
- [ ] Cannot login while pending
- [ ] Admin can view ID document
- [ ] Admin can approve renter
- [ ] Approved renter can login
- [ ] Admin can reject with reason
- [ ] Rejected renter sees reason

### Owner Flow
- [ ] Can signup with all 3 business docs
- [ ] Cannot signup missing any document
- [ ] Business name/type saved correctly
- [ ] Pending modal shows correct message
- [ ] Cannot login while pending
- [ ] Admin can view all 3 documents
- [ ] Admin can approve owner
- [ ] Approved owner can login
- [ ] Admin can reject with reason
- [ ] Rejected owner sees reason

### Admin Dashboard
- [ ] Can toggle between renters/owners
- [ ] Statistics show correct counts
- [ ] Can filter by status
- [ ] Document images load correctly
- [ ] Approve action works
- [ ] Reject action requires reason
- [ ] User details display correctly

---

## Documentation Files

1. **RENTER_ID_VERIFICATION.md** - Detailed renter verification docs
2. **OWNER_BUSINESS_VERIFICATION.md** - Detailed owner verification docs
3. **DEPLOYMENT_STEPS_ID_VERIFICATION.md** - Deployment guide
4. **VERIFICATION_SYSTEM_SUMMARY.md** - This file

---

## Future Enhancements

### Phase 2
1. Email notifications (approval/rejection)
2. Document expiration tracking
3. Renewal reminders
4. Bulk approval tools for admins

### Phase 3
1. OCR document scanning
2. Government API verification
3. Face matching (ID photo vs profile)
4. Automated verification

### Phase 4
1. Document update workflow
2. Version control for documents
3. Analytics dashboard
4. Verification metrics

---

## Support & Troubleshooting

### Common Issues

**"Cannot upload document"**
- Check file size (< 5MB)
- Verify file format (JPG, PNG, WEBP, PDF)
- Ensure correct bucket exists

**"Pending user cannot login"**
- Expected behavior until admin approves
- User sees message explaining this
- Admin must approve in dashboard

**"Existing users locked out"**
- Run migration SQL to approve legacy users
- Or require document upload

**"Admin cannot see documents"**
- Verify admin role in database
- Check RLS policies enabled
- Ensure storage policies active

### Support Contact
- Email: support@juanride.com
- Admin Dashboard: `/admin/verifications`

---

## Metrics to Track

1. **Signup Completion Rate**
   - % who complete document upload
   
2. **Approval Metrics**
   - Average time to approval
   - Approval rate
   - Rejection rate by document type
   
3. **User Impact**
   - Pending account wait time
   - Support tickets related to verification
   
4. **Document Quality**
   - Rejection reasons analysis
   - Common issues

---

## Version History

- **v1.0.0** (Nov 21, 2025) - Initial implementation
  - Renter ID verification
  - Owner business document verification
  - Admin approval dashboard
  - Auth context blocking

---

**Last Updated:** November 21, 2025  
**Status:** ✅ Implemented & Ready for Testing
