-- Ensure the private bucket for identity documents exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Renters can upload and manage the files they own inside the id-documents bucket
DROP POLICY IF EXISTS "Renter upload ID documents" ON storage.objects;
CREATE POLICY "Renter upload ID documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Renter read ID documents" ON storage.objects;
CREATE POLICY "Renter read ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Renter delete ID documents" ON storage.objects;
CREATE POLICY "Renter delete ID documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'id-documents'
  AND auth.uid() = owner
);

-- Owners can read ID documents tied to their bookings
DROP POLICY IF EXISTS "Owners view booking ID documents" ON storage.objects;
CREATE POLICY "Owners view booking ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents'
  AND EXISTS (
    SELECT 1
    FROM public.id_documents d
    JOIN public.bookings b ON b.identity_document_id = d.id
    JOIN public.vehicles v ON v.id = b.vehicle_id
    WHERE d.file_path = storage.objects.name
      AND v.owner_id = auth.uid()
  )
);

-- Admins get full access to the bucket
DROP POLICY IF EXISTS "Admins manage ID documents" ON storage.objects;
CREATE POLICY "Admins manage ID documents"
ON storage.objects
FOR ALL
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

-- Allow owners to view all pending_review documents (proactive approval)
DROP POLICY IF EXISTS "Owners view all pending documents" ON public.id_documents;
CREATE POLICY "Owners view all pending documents"
ON public.id_documents
FOR SELECT
USING (
  status = 'pending_review'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'owner'
  )
);

-- Allow owners to update (approve/reject) documents they are reviewing
DROP POLICY IF EXISTS "Owners update reviewed documents" ON public.id_documents;
CREATE POLICY "Owners update reviewed documents"
ON public.id_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'owner'
  )
);

-- Allow owners to read storage objects for all pending review documents
DROP POLICY IF EXISTS "Owners view all pending document files" ON storage.objects;
CREATE POLICY "Owners view all pending document files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents'
  AND EXISTS (
    SELECT 1
    FROM public.id_documents d
    WHERE d.file_path = storage.objects.name
      AND d.status = 'pending_review'
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'owner'
      )
  )
);
