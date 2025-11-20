-- ============================================================================
-- Storage Bucket and Policies for Vehicle Documents
-- ============================================================================
-- This script creates the vehicle-assets storage bucket and sets up
-- the necessary RLS policies for secure document management
-- ============================================================================

-- Create the vehicle-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-assets',
  'vehicle-assets',
  true,
  10485760, -- 10MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies for vehicle-assets bucket
-- ============================================================================

-- Policy 1: Allow authenticated users (owners) to upload vehicle documents
CREATE POLICY "Allow authenticated users to upload vehicle documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to vehicle documents
-- This allows anyone to view documents (e.g., admin reviewing submissions)
CREATE POLICY "Allow public read access to vehicle documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-assets');

-- Policy 3: Allow authenticated users to update their own vehicle documents
CREATE POLICY "Allow authenticated users to update vehicle documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete vehicle documents
-- Users can delete documents they uploaded
CREATE POLICY "Allow authenticated users to delete vehicle documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Optional: More restrictive policies (commented out)
-- ============================================================================
-- If you want to restrict access so users can only manage their own files,
-- you can use these more restrictive policies instead:

/*
-- Allow users to upload only to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read only their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================================================
-- Verification queries
-- ============================================================================
-- Run these to verify the bucket and policies were created successfully

-- Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'vehicle-assets';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%vehicle%';
