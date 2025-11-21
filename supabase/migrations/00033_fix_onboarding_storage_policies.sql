-- ============================================================================
-- Fix Storage Policies for Onboarding
-- Allows users to upload documents during onboarding before their role is set
-- ============================================================================

-- 1. Fix policies for business-documents bucket
-- Drop existing policies to ensure we start fresh
DROP POLICY IF EXISTS "Owners upload business documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners read their business documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete their business documents" ON storage.objects;

-- Create permissive policies that don't check for 'owner' role (since it might be pending)
CREATE POLICY "Owners upload business documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

CREATE POLICY "Owners read their business documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

CREATE POLICY "Owners delete their business documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

-- 2. Fix policies for id-documents bucket (Renters)
-- Drop existing policies
DROP POLICY IF EXISTS "Renters upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Renters read their ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Renters delete their ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users upload their own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users view their own ID documents" ON storage.objects;

-- Create permissive policies
CREATE POLICY "Users upload their own ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

CREATE POLICY "Users view their own ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

CREATE POLICY "Users delete their own ID documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

-- Ensure Admin policies are still in place
DROP POLICY IF EXISTS "Admins manage business documents storage" ON storage.objects;
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

DROP POLICY IF EXISTS "Admins manage ID documents" ON storage.objects;
CREATE POLICY "Admins manage ID documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'id-documents'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
