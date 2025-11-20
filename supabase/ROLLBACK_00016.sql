-- ============================================================================
-- Rollback script for migration 00016
-- Run this first to clean up the partial migration
-- ============================================================================

-- Step 1: Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_vehicle_rejected_at ON public.vehicles;
DROP FUNCTION IF EXISTS update_vehicle_rejected_at();

-- Step 2: Drop constraints
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_approval_status_check;

-- Step 3: Drop index
DROP INDEX IF EXISTS idx_vehicles_approval_status;

-- Step 4: Drop columns
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS approval_status;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS rejected_at;

-- Step 5: Restore the old constraint (from migration 00008)
-- This ensures we're back to the state before our migration
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'unavailable', 'maintenance'));

SELECT 'Rollback complete. Run migration 00016 again.' AS status;
