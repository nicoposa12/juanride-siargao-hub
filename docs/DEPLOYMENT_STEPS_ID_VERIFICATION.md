# Deployment Steps for ID Verification Feature

## Prerequisites
- Supabase CLI installed
- Access to Supabase project
- Database backup (recommended)

## Step 1: Run Database Migration

```bash
# Navigate to project root
cd /path/to/juanride-siargao-hub

# Run the migration
npx supabase db push

# Or run specific migration
npx supabase migration up --file supabase/migrations/00031_add_renter_account_approval.sql
```

**Note:** The migration will:
- Add new columns to `users` table
- Create indexes for performance
- Set up auto-approval trigger
- Mark existing users as approved (backward compatibility)

## Step 2: Verify Storage Bucket

Ensure the `id-documents` bucket exists:

```bash
# Check in Supabase Dashboard
# Storage → Buckets → id-documents (should be private)
```

If not exists, the migration `00021_id_document_storage_policies.sql` should have created it. Verify RLS policies are active.

## Step 3: Update TypeScript Types (Optional but Recommended)

```bash
# Generate new types from database schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

## Step 4: Test the Feature

### Test Renter Signup
1. Go to `/signup`
2. Select "Renter" role
3. Verify ID upload fields appear
4. Upload a test ID document
5. Submit form
6. Verify pending approval modal appears
7. Try to login → should show "pending verification" message

### Test Admin Dashboard
1. Login as admin
2. Navigate to `/admin/verifications`
3. Verify test ID document appears
4. Click "View" → verify image loads
5. Click "Approve" → verify account gets approved
6. Logout and login as the test renter → should work now

### Test Owner Signup
1. Go to `/signup`
2. Select "Owner" role
3. Verify NO ID upload fields appear
4. Submit form
5. Verify can login immediately (no pending approval)

## Step 5: Update Environment Variables (If Needed)

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 6: Deploy Frontend

```bash
# Build and test locally first
npm run build
npm start

# Or deploy to Vercel
vercel --prod
```

## Step 7: Monitor & Verify

After deployment:
1. Check Supabase logs for any errors
2. Monitor signup success rate
3. Check admin can access verification dashboard
4. Verify email notifications work (if implemented)

## Rollback Plan (If Issues Occur)

### Quick Rollback
```sql
-- Temporarily disable pending verification for all renters
UPDATE users 
SET account_verification_status = 'approved' 
WHERE role = 'renter' AND account_verification_status = 'pending_verification';
```

### Full Rollback
```bash
# Revert migration (if critical issues)
npx supabase migration revert 00031_add_renter_account_approval

# Or manually drop columns
ALTER TABLE users DROP COLUMN IF EXISTS account_verification_status;
ALTER TABLE users DROP COLUMN IF EXISTS account_status_reason;
ALTER TABLE users DROP COLUMN IF EXISTS account_verified_at;
ALTER TABLE users DROP COLUMN IF EXISTS verified_by;
```

## Common Issues & Solutions

### Issue: "id-documents bucket not found"
**Solution:** Run migration `00021_id_document_storage_policies.sql` or create bucket manually in Supabase Dashboard

### Issue: Existing renters cannot login
**Solution:** Run this SQL to approve all existing renters:
```sql
UPDATE users 
SET account_verification_status = 'approved',
    account_verified_at = NOW()
WHERE role = 'renter';
```

### Issue: Admin cannot see verifications page
**Solution:** Verify admin navigation config and user has `role = 'admin'`

### Issue: File upload fails
**Solution:** 
- Check storage bucket policies
- Verify bucket is created
- Check file size < 5MB
- Verify valid file type (JPG, PNG, WEBP, PDF)

## Performance Considerations

The migration includes indexes:
- `idx_users_verification_status` - Fast filtering by status
- `idx_users_pending_renters` - Fast queries for pending renters

Monitor query performance in Supabase Dashboard → Database → Query Performance.

## Security Checklist

- [ ] Storage bucket is set to **private** (not public)
- [ ] RLS policies are enabled on `id_documents` table
- [ ] Only admins can approve/reject accounts
- [ ] Pending users cannot access protected routes
- [ ] ID documents not exposed in API responses

## Post-Deployment Monitoring

### Metrics to Track
1. **Signup completion rate** - % who complete ID upload
2. **Average approval time** - Time from signup to approval
3. **Rejection rate** - % of IDs rejected
4. **Support tickets** - Related to verification issues

### Dashboard Queries
```sql
-- Count pending verifications
SELECT COUNT(*) FROM users WHERE account_verification_status = 'pending_verification';

-- Average time to approval
SELECT AVG(account_verified_at - created_at) as avg_approval_time
FROM users 
WHERE account_verification_status = 'approved' AND role = 'renter';

-- Rejection rate
SELECT 
  COUNT(*) FILTER (WHERE account_verification_status = 'rejected') * 100.0 / COUNT(*) as rejection_rate
FROM users 
WHERE role = 'renter';
```

## Support & Documentation

- **Feature Documentation:** `docs/RENTER_ID_VERIFICATION.md`
- **Migration File:** `supabase/migrations/00031_add_renter_account_approval.sql`
- **Admin Dashboard:** `/admin/verifications`

## Next Steps (Future Enhancements)

1. Set up email notifications for approvals/rejections
2. Add analytics dashboard for verification metrics
3. Implement automated ID verification (OCR, face matching)
4. Add expiration tracking for IDs
5. Create admin bulk approval tools

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** 1.0.0
