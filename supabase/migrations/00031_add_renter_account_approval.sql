-- ============================================================================
-- Renter Account Approval System
-- Adds verification status for renter accounts that require ID approval
-- ============================================================================

-- Add account verification status to users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_verification_status TEXT NOT NULL DEFAULT 'approved' CHECK (account_verification_status IN (
        'pending_verification',  -- Renter waiting for ID approval
        'approved',              -- Account approved, can login
        'rejected',              -- Account rejected by admin
        'suspended'              -- Account temporarily suspended
    ));

-- Add rejection/suspension reason field
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_status_reason TEXT;

-- Add verified_at timestamp
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_verified_at TIMESTAMPTZ;

-- Add verifier reference
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.account_verification_status IS 'Account approval status - renters must be approved before login';
COMMENT ON COLUMN public.users.account_status_reason IS 'Reason for rejection or suspension';
COMMENT ON COLUMN public.users.account_verified_at IS 'Timestamp when account was approved';
COMMENT ON COLUMN public.users.verified_by IS 'Admin who approved/rejected the account';

-- Create index for faster filtering of pending accounts
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(account_verification_status);
CREATE INDEX IF NOT EXISTS idx_users_pending_renters ON public.users(role, account_verification_status) 
    WHERE role = 'renter' AND account_verification_status = 'pending_verification';

-- Update existing renter accounts to approved status (backward compatibility)
UPDATE public.users 
SET account_verification_status = 'approved',
    account_verified_at = created_at
WHERE role = 'renter' AND account_verification_status = 'approved';

-- Owner and admin accounts are auto-approved (they go through different verification)
UPDATE public.users 
SET account_verification_status = 'approved',
    account_verified_at = created_at
WHERE role IN ('owner', 'admin');

-- Function to auto-approve owners and admins
CREATE OR REPLACE FUNCTION public.auto_approve_non_renters()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-approve owners and admins
    IF NEW.role IN ('owner', 'admin') THEN
        NEW.account_verification_status = 'approved';
        NEW.account_verified_at = NOW();
    END IF;
    
    -- Renters start as pending if they haven't been explicitly approved
    IF NEW.role = 'renter' AND NEW.account_verification_status IS NULL THEN
        NEW.account_verification_status = 'pending_verification';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_approve_non_renters ON public.users;
CREATE TRIGGER trg_auto_approve_non_renters
    BEFORE INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_non_renters();

-- Add RLS policy to prevent pending users from accessing protected resources
-- This is handled at application level, but we can add a helper function

CREATE OR REPLACE FUNCTION public.is_account_approved(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND account_verification_status = 'approved'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_account_approved IS 'Helper function to check if a user account is approved and active';
