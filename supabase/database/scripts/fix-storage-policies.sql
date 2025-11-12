-- Fix Storage Policies for JuanRide
-- Run this in Supabase SQL Editor to fix upload issues

-- ============================================================================
-- REMOVE OLD POLICIES (if any exist)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own vehicle images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;

-- ============================================================================
-- SIMPLE WORKING POLICIES FOR VEHICLE IMAGES
-- ============================================================================

-- Allow anyone to view vehicle images (public bucket)
CREATE POLICY "Public vehicle images read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Allow authenticated users to upload vehicle images
CREATE POLICY "Authenticated vehicle images insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow authenticated users to update vehicle images
CREATE POLICY "Authenticated vehicle images update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images')
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow authenticated users to delete vehicle images
CREATE POLICY "Authenticated vehicle images delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- ============================================================================
-- SIMPLE WORKING POLICIES FOR PROFILE IMAGES
-- ============================================================================

-- Allow anyone to view profile images (public bucket)
CREATE POLICY "Public profile images read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload profile images
CREATE POLICY "Authenticated profile images insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update profile images
CREATE POLICY "Authenticated profile images update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to delete profile images
CREATE POLICY "Authenticated profile images delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

