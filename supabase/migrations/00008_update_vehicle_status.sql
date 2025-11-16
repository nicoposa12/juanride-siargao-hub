-- Update vehicle status enum to match requirements
-- Available, Unavailable, Under Maintenance
-- Also handle existing 'rented' status by updating them

-- First, update existing 'rented' and 'inactive' statuses
UPDATE public.vehicles 
SET status = 'unavailable' 
WHERE status IN ('rented', 'inactive');

-- Update the CHECK constraint to allow new status values
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add new constraint with updated status options
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'unavailable', 'maintenance'));

-- Add comment explaining the status options
COMMENT ON COLUMN public.vehicles.status IS 'Vehicle availability status: available (can be booked), unavailable (not available for booking), maintenance (under maintenance/repair)';
