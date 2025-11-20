# Storage Setup Guide

## 📦 Vehicle Assets Storage Bucket

This guide explains how to set up the `vehicle-assets` storage bucket for vehicle documents (registration, insurance certificates, etc.).

## 🚀 Quick Setup

### Option 1: Using Supabase Dashboard (Recommended for First-Time Setup)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Click **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** button
   - Enter bucket name: `vehicle-assets`
   - Enable **"Public bucket"** toggle
   - Set **File size limit**: `10 MB`
   - Set **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
   - Click **"Create bucket"**

3. **Apply RLS Policies**
   - Go to **SQL Editor** in the dashboard
   - Copy and paste the contents of `storage-policies.sql`
   - Click **"Run"**
   - Verify policies were created successfully

### Option 2: Using SQL Migration

1. **Using Supabase CLI**
   ```bash
   # Apply the migration
   supabase db push
   ```

2. **Or using SQL Editor**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `migrations/20251121_vehicle_assets_storage.sql`
   - Click **"Run"**

## 📋 Files Included

- **`storage-policies.sql`** - Standalone SQL script with bucket and policies
- **`migrations/20251121_vehicle_assets_storage.sql`** - Migration file for version control
- **`STORAGE_SETUP.md`** - This guide

## 🔐 Security Policies

The following RLS policies are created:

| Policy | Action | Who | Description |
|--------|--------|-----|-------------|
| Upload | INSERT | Authenticated | Owners can upload documents |
| Read | SELECT | Public | Anyone can view documents |
| Update | UPDATE | Authenticated | Owners can update documents |
| Delete | DELETE | Authenticated | Owners can delete documents |

## ✅ Verification

After setup, run these queries to verify:

### Check if bucket exists
```sql
SELECT * FROM storage.buckets WHERE id = 'vehicle-assets';
```

Expected result:
```
id              | name            | public | file_size_limit | allowed_mime_types
----------------|-----------------|--------|-----------------|-------------------
vehicle-assets  | vehicle-assets  | true   | 10485760        | {application/pdf,image/jpeg,image/jpg,image/png}
```

### Check policies
```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%vehicle%'
ORDER BY policyname;
```

Expected result: 4 policies related to vehicle documents

## 📁 Folder Structure

Documents are organized as:
```
vehicle-assets/
├── vehicle-documents/
│   ├── {timestamp}_{random}_registration.pdf
│   ├── {timestamp}_{random}_insurance.pdf
│   └── ...
```

## 🛠️ Troubleshooting

### "Bucket not found" error
- Verify the bucket was created: Check Storage > Buckets in dashboard
- Ensure bucket name is exactly `vehicle-assets` (no typos)

### Upload fails with permission error
- Check if RLS policies were applied
- Verify user is authenticated
- Check browser console for detailed error messages

### Documents not visible after upload
- Verify bucket is set to **public**
- Check if the public read policy was applied
- Try refreshing the page

## 🔄 Alternative: More Restrictive Policies

If you want users to only access their own documents, uncomment the alternative policies in `storage-policies.sql`. These restrict access based on user ID folders.

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify bucket exists and is public
3. Confirm policies are active
4. Check authentication status

---

**Created**: 2025-11-21  
**For**: JuanRide Vehicle Rental Platform
