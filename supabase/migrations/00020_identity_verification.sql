-- ============================================================================
-- Identity Verification Infrastructure
-- Adds reusable renter ID documents and booking linkage
-- ============================================================================

-- 1) Create table for renter identity documents
CREATE TABLE IF NOT EXISTS public.id_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'drivers_license',
        'passport',
        'umid',
        'sss',
        'philhealth',
        'postal',
        'voters',
        'national_id',
        'prc',
        'school_id'
    )),
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review',
        'approved',
        'rejected',
        'expired'
    )),
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    preview_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    owner_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.id_documents IS 'Reusable identity documents uploaded by renters for verification.';
COMMENT ON COLUMN public.id_documents.document_type IS 'Type of government ID uploaded by the renter.';
COMMENT ON COLUMN public.id_documents.status IS 'Review status: pending_review, approved, rejected, or expired.';
COMMENT ON COLUMN public.id_documents.file_path IS 'Supabase Storage object path for secure access control.';

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_id_documents_renter_id ON public.id_documents(renter_id);
CREATE INDEX IF NOT EXISTS idx_id_documents_status ON public.id_documents(status);
CREATE INDEX IF NOT EXISTS idx_id_documents_type ON public.id_documents(document_type);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_id_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_id_documents_updated_at ON public.id_documents;
CREATE TRIGGER trg_update_id_documents_updated_at
    BEFORE UPDATE ON public.id_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_id_documents_updated_at();

-- 2) Link bookings to verified IDs
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS identity_document_id UUID REFERENCES public.id_documents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS identity_requirement_status TEXT NOT NULL DEFAULT 'not_required' CHECK (identity_requirement_status IN (
        'not_required',
        'pending',
        'approved',
        'rejected'
    ));

COMMENT ON COLUMN public.bookings.identity_document_id IS 'ID document used to satisfy owner verification requirements for this booking.';
COMMENT ON COLUMN public.bookings.identity_requirement_status IS 'Current state of the identity verification requirement for the booking.';

CREATE INDEX IF NOT EXISTS idx_bookings_identity_requirement_status ON public.bookings(identity_requirement_status);

-- 3) Row Level Security policies
ALTER TABLE public.id_documents ENABLE ROW LEVEL SECURITY;

-- Renters can manage their own documents
DROP POLICY IF EXISTS "Renters manage their ID documents" ON public.id_documents;
CREATE POLICY "Renters manage their ID documents"
ON public.id_documents
FOR ALL
USING (renter_id = auth.uid())
WITH CHECK (renter_id = auth.uid());

-- Vehicle owners can view documents linked to their bookings
DROP POLICY IF EXISTS "Owners can view booking ID documents" ON public.id_documents;
CREATE POLICY "Owners can view booking ID documents"
ON public.id_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE b.identity_document_id = public.id_documents.id
          AND v.owner_id = auth.uid()
    )
);

-- Admins have full access
DROP POLICY IF EXISTS "Admins can access ID documents" ON public.id_documents;
CREATE POLICY "Admins can access ID documents"
ON public.id_documents
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

-- Note: Create a private Supabase Storage bucket named 'id-documents' and
-- configure storage policies so that renters can upload their own files
-- while owners/admins can read files linked to their bookings.
