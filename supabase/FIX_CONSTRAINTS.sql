-- ============================================================================
-- Emergency fix for vehicle constraints
-- Run this FIRST to diagnose and fix constraint issues
-- ============================================================================

-- Step 1: Check current constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE '%vehicle%status%';

-- Step 2: Update any 'unavailable' status to 'inactive'
UPDATE public.vehicles
SET status = 'inactive'
WHERE status NOT IN ('available', 'rented', 'maintenance', 'inactive');

-- Step 3: Drop ALL status-related constraints
DO $$ 
BEGIN
    -- Drop the check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicles_status_check'
    ) THEN
        ALTER TABLE public.vehicles DROP CONSTRAINT vehicles_status_check;
        RAISE NOTICE 'Dropped vehicles_status_check';
    END IF;

    -- Check for any other status constraints
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%status%' 
        AND conrelid = 'public.vehicles'::regclass
    ) THEN
        RAISE NOTICE 'Other status constraints found';
    END IF;
END $$;

-- Step 4: Add the correct status constraint
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'rented', 'maintenance', 'inactive'));

-- Verify it worked
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'vehicles_status_check';

-- Step 5: Test by setting a vehicle to inactive (should succeed)
-- This is a dry run - replace <vehicle_id> with an actual ID
-- UPDATE public.vehicles 
-- SET status = 'inactive'
-- WHERE id = '<vehicle_id>';
