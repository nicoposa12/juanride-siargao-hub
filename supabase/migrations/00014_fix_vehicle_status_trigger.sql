-- ============================================================================
-- FIX VEHICLE STATUS TRIGGER TO USE CORRECT STATUS VALUES
-- ============================================================================
-- This migration fixes the vehicle status update trigger to use 'unavailable'
-- instead of 'rented' to match the updated status constraint

-- Drop the old CHECK constraint (if not already done)
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Update any existing 'rented' or 'inactive' statuses to 'unavailable'
UPDATE public.vehicles 
SET status = 'unavailable' 
WHERE status IN ('rented', 'inactive');

-- Add new constraint with correct status values
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'unavailable', 'maintenance'));

-- Update the trigger function to use 'unavailable' instead of 'rented'
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

-- Add comment explaining the status options
COMMENT ON COLUMN public.vehicles.status IS 'Vehicle availability status: available (can be booked), unavailable (currently booked or owner disabled), maintenance (under maintenance/repair)';

-- Verify the constraint was applied correctly
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'vehicles_status_check';
