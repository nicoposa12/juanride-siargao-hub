-- ============================================================================
-- FIX VEHICLE STATUS CONSTRAINT AND TRIGGER
-- Run this complete script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop the old CHECK constraint FIRST (before updating data)
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Step 2: Update any existing 'rented' or 'inactive' statuses to 'unavailable'
UPDATE public.vehicles 
SET status = 'unavailable' 
WHERE status IN ('rented', 'inactive');

-- Step 3: Add new constraint with correct status values
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'unavailable', 'maintenance'));

-- Step 4: Update the trigger function to use 'unavailable' instead of 'rented'
CREATE OR REPLACE FUNCTION public.update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is confirmed or active, mark vehicle as unavailable
    IF NEW.status IN ('confirmed', 'active') THEN
        UPDATE public.vehicles
        SET status = 'unavailable'
        WHERE id = NEW.vehicle_id;
    
    -- If booking is completed or cancelled, check if vehicle should be available
    ELSIF NEW.status IN ('completed', 'cancelled') THEN
        -- Only set to available if no other active bookings exist
        IF NOT EXISTS (
            SELECT 1 FROM public.bookings
            WHERE vehicle_id = NEW.vehicle_id
                AND status IN ('confirmed', 'active')
                AND id != NEW.id
        ) THEN
            UPDATE public.vehicles
            SET status = 'available'
            WHERE id = NEW.vehicle_id
                AND status != 'maintenance';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add comment explaining the status options
COMMENT ON COLUMN public.vehicles.status IS 'Vehicle availability status: available (can be booked), unavailable (not available for booking), maintenance (under maintenance/repair)';

-- Step 6: Verify the constraint was applied correctly
-- This query should return the new constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'vehicles_status_check';
