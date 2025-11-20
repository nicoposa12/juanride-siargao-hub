-- ============================================================================
-- Owner Business Document Verification System
-- Adds required business documents for owner account approval
-- ============================================================================

-- Create table for owner business documents
CREATE TABLE IF NOT EXISTS public.business_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'business_permit',      -- Business Permit / Mayor's Permit
        'dti_registration',     -- DTI Registration
        'sec_registration',     -- SEC Registration
        'bir_registration'      -- BIR Registration (COR or Certificate of Registration)
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
    
    -- Document details
    registration_number TEXT,       -- Business registration number
    business_name TEXT,              -- Registered business name
    issue_date DATE,                 -- Date document was issued
    expiry_date DATE,                -- Expiration date (if applicable)
    
    -- Review tracking
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.business_documents IS 'Business documents uploaded by owners for verification.';
COMMENT ON COLUMN public.business_documents.document_type IS 'Type of business document: business_permit, dti_registration, sec_registration, bir_registration';
COMMENT ON COLUMN public.business_documents.status IS 'Review status: pending_review, approved, rejected, or expired.';
COMMENT ON COLUMN public.business_documents.business_name IS 'Registered business name from the document';
COMMENT ON COLUMN public.business_documents.registration_number IS 'Official registration number';

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_documents_owner_id ON public.business_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_status ON public.business_documents(status);
CREATE INDEX IF NOT EXISTS idx_business_documents_type ON public.business_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_business_documents_expiry ON public.business_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_business_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_business_documents_updated_at ON public.business_documents;
CREATE TRIGGER trg_update_business_documents_updated_at
    BEFORE UPDATE ON public.business_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_business_documents_updated_at();

-- Row Level Security policies
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own business documents
DROP POLICY IF EXISTS "Owners manage their business documents" ON public.business_documents;
CREATE POLICY "Owners manage their business documents"
ON public.business_documents
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Admins have full access to all business documents
DROP POLICY IF EXISTS "Admins access all business documents" ON public.business_documents;
CREATE POLICY "Admins access all business documents"
ON public.business_documents
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

-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-documents', 'business-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business documents bucket
DROP POLICY IF EXISTS "Owners upload business documents" ON storage.objects;
CREATE POLICY "Owners upload business documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Owners read their business documents" ON storage.objects;
CREATE POLICY "Owners read their business documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Owners delete their business documents" ON storage.objects;
CREATE POLICY "Owners delete their business documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-documents'
  AND auth.uid() = owner
);

-- Admins get full access to business documents bucket
DROP POLICY IF EXISTS "Admins manage business documents storage" ON storage.objects;
CREATE POLICY "Admins manage business documents storage"
ON storage.objects
FOR ALL
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

-- Update the auto-approval trigger to NOT auto-approve owners anymore
CREATE OR REPLACE FUNCTION public.auto_approve_non_renters()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-approve admins now (both renters and owners need verification)
    IF NEW.role = 'admin' THEN
        NEW.account_verification_status = 'approved';
        NEW.account_verified_at = NOW();
    END IF;
    
    -- Renters and owners start as pending if they haven't been explicitly approved
    IF NEW.role IN ('renter', 'owner') AND NEW.account_verification_status IS NULL THEN
        NEW.account_verification_status = 'pending_verification';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if owner has all required documents uploaded
CREATE OR REPLACE FUNCTION public.has_all_required_business_documents(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_business_permit BOOLEAN;
    has_dti_or_sec BOOLEAN;
    has_bir BOOLEAN;
BEGIN
    -- Check for Business Permit
    SELECT EXISTS (
        SELECT 1 FROM public.business_documents
        WHERE owner_id = user_id
        AND document_type = 'business_permit'
    ) INTO has_business_permit;
    
    -- Check for DTI OR SEC registration
    SELECT EXISTS (
        SELECT 1 FROM public.business_documents
        WHERE owner_id = user_id
        AND document_type IN ('dti_registration', 'sec_registration')
    ) INTO has_dti_or_sec;
    
    -- Check for BIR registration
    SELECT EXISTS (
        SELECT 1 FROM public.business_documents
        WHERE owner_id = user_id
        AND document_type = 'bir_registration'
    ) INTO has_bir;
    
    RETURN has_business_permit AND has_dti_or_sec AND has_bir;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.has_all_required_business_documents IS 'Check if owner has uploaded all required business documents (Business Permit, DTI/SEC, BIR)';

-- Add business verification fields to users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS business_name TEXT,
    ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('sole_proprietorship', 'partnership', 'corporation', 'cooperative'));

COMMENT ON COLUMN public.users.business_name IS 'Registered business name for owner accounts';
COMMENT ON COLUMN public.users.business_type IS 'Type of business entity';

-- Update existing owners to pending verification status
UPDATE public.users 
SET account_verification_status = 'pending_verification'
WHERE role = 'owner' 
AND account_verification_status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM public.business_documents bd
    WHERE bd.owner_id = users.id
    AND bd.status = 'approved'
);

-- Note: Existing owners with no business documents will need to upload them
-- Admin should manually approve legacy owners or require them to submit documents
