  -- ============================================================================
  -- Add approval_status field to vehicles table
  -- This properly tracks the approval workflow: pending -> approved/rejected
  -- Fixes the status constraint to use 'inactive' instead of 'unavailable'
  -- ============================================================================

  -- Step 1: Drop the old status constraint (from migration 00008)
  ALTER TABLE public.vehicles 
  DROP CONSTRAINT IF EXISTS vehicles_status_check;

  -- Step 2: Update any 'unavailable' status to 'inactive' 
  -- (Migration 00008 changed this, we're reverting it)
  UPDATE public.vehicles
  SET status = 'inactive'
  WHERE status = 'unavailable';

  -- Step 3: Add corrected status constraint
  -- Using 'inactive' instead of 'unavailable' to match database schema
  ALTER TABLE public.vehicles 
  ADD CONSTRAINT vehicles_status_check 
  CHECK (status IN ('available', 'rented', 'maintenance', 'inactive'));

  -- Add the approval_status column without constraint first
  ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS approval_status TEXT 
  DEFAULT 'pending';

  -- Set existing vehicles' approval_status based on is_approved field
  UPDATE public.vehicles
  SET approval_status = CASE 
    WHEN is_approved = true THEN 'approved'
    WHEN is_approved = false AND admin_notes IS NOT NULL THEN 'rejected'
    ELSE 'pending'
  END;

  -- Add named constraint for approval_status
  ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

  -- Add index for faster filtering by approval status
  CREATE INDEX IF NOT EXISTS idx_vehicles_approval_status 
  ON public.vehicles(approval_status);

  -- Add rejected_at timestamp to track when a vehicle was rejected
  ALTER TABLE public.vehicles 
  ADD COLUMN rejected_at TIMESTAMPTZ;

  -- Update trigger to set rejected_at timestamp when approval_status changes to rejected
  CREATE OR REPLACE FUNCTION update_vehicle_rejected_at()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
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

  -- Comment on new columns
  COMMENT ON COLUMN public.vehicles.approval_status IS 'Tracks approval workflow: pending (awaiting review), approved (live), rejected (denied by admin)';
  COMMENT ON COLUMN public.vehicles.rejected_at IS 'Timestamp when vehicle was rejected by admin';
