-- ============================================================================
-- Fix: Create business-documents storage bucket
-- Run this manually if the bucket doesn't exist
-- ============================================================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents', 
  'business-documents', 
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at 
FROM storage.buckets 
WHERE name = 'business-documents';

-- Clean up existing policies (if any)
DROP POLICY IF EXISTS "Owners upload business documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners read their business documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete their business documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage business documents storage" ON storage.objects;

-- Storage policies for business documents bucket
-- Owners can upload their own business documents
CREATE POLICY "Owners upload business documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- Owners can view their own documents
CREATE POLICY "Owners read their business documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

-- Owners can delete their own documents
CREATE POLICY "Owners delete their business documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

-- Admins get full access to business documents bucket
CREATE POLICY "Admins manage business documents storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'business-documents'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%business documents%';
