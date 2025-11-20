-- ============================================================================
-- MIGRATION: Add Vehicle Document Requirements
-- ============================================================================
-- Description: Add document upload fields for vehicle registration, insurance,
--              and proof of ownership. These documents are required before
--              admin can approve a vehicle listing.
-- Date: 2024-11-21
-- ============================================================================

-- Add document fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS registration_document_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS proof_of_ownership_url TEXT,
ADD COLUMN IF NOT EXISTS inspection_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_verified_by UUID REFERENCES public.users(id);

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.registration_document_url IS 'URL to vehicle registration document (OR/CR) - Required';
COMMENT ON COLUMN public.vehicles.insurance_document_url IS 'URL to valid vehicle insurance document - Required';
COMMENT ON COLUMN public.vehicles.proof_of_ownership_url IS 'URL to proof of ownership document (deed of sale/transfer) - Required';
COMMENT ON COLUMN public.vehicles.inspection_certificate_url IS 'URL to vehicle inspection certificate - Optional but recommended';
COMMENT ON COLUMN public.vehicles.documents_verified IS 'Whether admin has verified the uploaded documents';
COMMENT ON COLUMN public.vehicles.documents_verified_at IS 'Timestamp when documents were verified';
COMMENT ON COLUMN public.vehicles.documents_verified_by IS 'Admin user ID who verified the documents';

-- Create index for faster lookups of vehicles with verified documents
CREATE INDEX IF NOT EXISTS idx_vehicles_documents_verified 
ON public.vehicles(documents_verified) 
WHERE documents_verified = TRUE;

-- Create index for vehicles pending document verification
CREATE INDEX IF NOT EXISTS idx_vehicles_pending_docs 
ON public.vehicles(id) 
WHERE registration_document_url IS NOT NULL 
  AND insurance_document_url IS NOT NULL 
  AND proof_of_ownership_url IS NOT NULL
  AND documents_verified = FALSE;

-- ============================================================================
-- DOCUMENT VERIFICATION NOTES
-- ============================================================================
-- 
-- Document Requirements for Vehicle Approval:
-- 1. registration_document_url - REQUIRED (OR/CR)
-- 2. insurance_document_url - REQUIRED (Valid insurance)
-- 3. proof_of_ownership_url - REQUIRED (Deed of sale/transfer)
-- 4. inspection_certificate_url - OPTIONAL (Recommended for safety)
--
-- Approval Flow:
-- 1. Owner uploads vehicle with documents
-- 2. Admin reviews documents
-- 3. Admin marks documents_verified = TRUE
-- 4. Admin approves vehicle (is_approved = TRUE)
-- 5. Vehicle becomes visible to renters
--
-- ============================================================================

-- Add table comment
COMMENT ON TABLE public.vehicles IS 'Vehicle listings with required document uploads for registration, insurance, and proof of ownership. Documents must be verified by admin before approval.';
