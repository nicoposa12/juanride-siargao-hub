-- ============================================================================
-- Migration: Vehicle Assets Storage Bucket and Policies
-- Created: 2025-11-21
-- Description: Sets up storage bucket for vehicle documents (registration, 
--              insurance certificates, etc.) with appropriate access policies
-- ============================================================================

-- Create the vehicle-assets storage bucket
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
-- RLS Policies for storage.objects table
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to upload vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete vehicle documents" ON storage.objects;

-- Policy 1: INSERT - Allow authenticated users to upload vehicle documents
CREATE POLICY "Allow authenticated users to upload vehicle documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
);

-- Policy 2: SELECT - Allow public read access to vehicle documents
CREATE POLICY "Allow public read access to vehicle documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-assets');

-- Policy 3: UPDATE - Allow authenticated users to update vehicle documents
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

-- Policy 4: DELETE - Allow authenticated users to delete vehicle documents
CREATE POLICY "Allow authenticated users to delete vehicle documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-assets'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Uncomment to verify the migration

-- SELECT 
--   id,
--   name,
--   public,
--   file_size_limit,
--   allowed_mime_types
-- FROM storage.buckets 
-- WHERE id = 'vehicle-assets';

-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies 
-- WHERE tablename = 'objects' 
--   AND policyname LIKE '%vehicle%'
-- ORDER BY policyname;
