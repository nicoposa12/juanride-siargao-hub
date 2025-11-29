-- ============================================================================
-- Add 'pending_resubmission' status to business_documents and id_documents
-- ============================================================================

-- Update business_documents table CHECK constraint
ALTER TABLE public.business_documents 
DROP CONSTRAINT IF EXISTS business_documents_status_check;

ALTER TABLE public.business_documents 
ADD CONSTRAINT business_documents_status_check 
CHECK (status IN (
    'pending_review',
    'pending_resubmission',  -- NEW: For resubmitted documents
    'approved',
    'rejected',
    'expired'
));

-- Update id_documents table CHECK constraint (for renters)
ALTER TABLE public.id_documents 
DROP CONSTRAINT IF EXISTS id_documents_status_check;

ALTER TABLE public.id_documents 
ADD CONSTRAINT id_documents_status_check 
CHECK (status IN (
    'pending_review',
    'pending_resubmission',  -- NEW: For resubmitted documents
    'approved',
    'rejected',
    'expired'
));

COMMENT ON CONSTRAINT business_documents_status_check ON public.business_documents 
IS 'Allowed status values including pending_resubmission for tracking resubmitted documents';

COMMENT ON CONSTRAINT id_documents_status_check ON public.id_documents 
IS 'Allowed status values including pending_resubmission for tracking resubmitted documents';
