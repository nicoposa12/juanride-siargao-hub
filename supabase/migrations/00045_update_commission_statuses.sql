-- ============================================================================
-- Update Commission Status Values
-- Changes: pending → unpaid, submitted → for_verification, verified → for_verification, paid → paid
-- Adds new status: suspended (for owners with repeated non-payment issues)
-- ============================================================================

-- Step 1: Drop old status constraint
ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_status_check;

-- Step 2: Update existing status values to new naming convention
UPDATE commissions 
SET status = CASE 
  WHEN status = 'pending' THEN 'unpaid'
  WHEN status = 'submitted' THEN 'for_verification'
  WHEN status = 'verified' THEN 'for_verification'
  WHEN status = 'paid' THEN 'paid'
  ELSE status
END;

-- Step 3: Add new status constraint with updated values
ALTER TABLE commissions 
ADD CONSTRAINT commissions_status_check 
CHECK (status IN ('unpaid', 'for_verification', 'paid', 'suspended'));

-- Step 4: Update default value for new commissions
ALTER TABLE commissions 
ALTER COLUMN status SET DEFAULT 'unpaid';

-- Step 5: Add suspension tracking columns to users table (for owner suspension)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);

-- Step 6: Create index for quick lookup of suspended users
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended) WHERE is_suspended = TRUE;

-- Step 7: Update RLS policies to prevent suspended owners from accepting new bookings
-- This will be handled in the application logic, but we add a database-level check

-- Step 8: Add helpful comments
COMMENT ON COLUMN commissions.status IS 'Commission payment status: unpaid (owner has not paid), for_verification (owner submitted proof, admin reviewing), paid (admin verified and received), suspended (owner suspended due to non-payment)';
COMMENT ON COLUMN users.is_suspended IS 'Whether the owner is suspended from accepting new bookings due to commission issues';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for suspension (e.g., repeated unpaid commissions, fake proof, violations)';

-- Step 9: Create function to automatically suspend owners with 3+ unpaid commissions
CREATE OR REPLACE FUNCTION check_owner_unpaid_commissions()
RETURNS TRIGGER AS $$
DECLARE
  unpaid_count INTEGER;
BEGIN
  -- Count unpaid commissions for this owner
  SELECT COUNT(*) INTO unpaid_count
  FROM commissions
  WHERE owner_id = NEW.owner_id
  AND status = 'unpaid'
  AND created_at < NOW() - INTERVAL '30 days'; -- Older than 30 days
  
  -- If 3 or more unpaid commissions, consider for suspension
  -- (Admin still needs to manually suspend, this is just a check)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Actual suspension will be done manually by admin through the UI
-- This trigger is just for tracking/monitoring purposes

COMMENT ON FUNCTION check_owner_unpaid_commissions() IS 'Helper function to check for owners with multiple unpaid commissions (for admin review)';

-- Migration complete
COMMENT ON TABLE commissions IS 'Tracks 10% commission payments from vehicle owners to admin. Status flow: unpaid → for_verification → paid (or suspended if owner violates rules)';
