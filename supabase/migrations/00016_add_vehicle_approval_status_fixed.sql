-- ============================================================================
-- Add approval_status field to vehicles table (SAFE VERSION)
-- This properly tracks the approval workflow: pending -> approved/rejected
-- Fixes the status constraint to use 'inactive' instead of 'unavailable'
-- ============================================================================

-- Step 1: Drop ALL old constraints to start fresh
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_approval_status_check;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_vehicle_rejected_at ON public.vehicles;
DROP FUNCTION IF EXISTS update_vehicle_rejected_at();

-- Step 2: Update any 'unavailable' status to 'inactive' 
UPDATE public.vehicles
SET status = 'inactive'
WHERE status = 'unavailable';

-- Step 3: Add corrected status constraint with 'rented'
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'rented', 'maintenance', 'inactive'));

-- Step 4: Add the approval_status column if it doesn't exist
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS approval_status TEXT 
DEFAULT 'pending';

-- Step 5: Set existing vehicles' approval_status based on is_approved field
UPDATE public.vehicles
SET approval_status = CASE 
  WHEN is_approved = true THEN 'approved'
  WHEN is_approved = false AND admin_notes IS NOT NULL THEN 'rejected'
  ELSE 'pending'
END
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Step 6: Add named constraint for approval_status
ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_approval_status_check
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Step 7: Add index for faster filtering by approval status
DROP INDEX IF EXISTS idx_vehicles_approval_status;
CREATE INDEX idx_vehicles_approval_status 
ON public.vehicles(approval_status);

-- Step 8: Add rejected_at timestamp to track when a vehicle was rejected
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Step 9: Create trigger to set rejected_at timestamp when approval_status changes to rejected
CREATE OR REPLACE FUNCTION update_vehicle_rejected_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'rejected' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'rejected') THEN
    NEW.rejected_at = NOW();
  ELSIF NEW.approval_status != 'rejected' THEN
    NEW.rejected_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_rejected_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_rejected_at();

-- Step 10: Add comments on new columns
COMMENT ON COLUMN public.vehicles.approval_status IS 'Tracks approval workflow: pending (awaiting review), approved (live), rejected (denied by admin)';
COMMENT ON COLUMN public.vehicles.rejected_at IS 'Timestamp when vehicle was rejected by admin';
