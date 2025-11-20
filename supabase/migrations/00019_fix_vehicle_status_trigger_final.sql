-- Fix vehicle status update trigger to use 'rented' instead of 'unavailable'
-- This aligns with the fixed check constraint from migration 00016 which allows:
-- 'available', 'rented', 'maintenance', 'inactive'

CREATE OR REPLACE FUNCTION public.update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is confirmed or active, mark vehicle as rented
    IF NEW.status IN ('confirmed', 'active') THEN
        UPDATE public.vehicles
        SET status = 'rented'
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
                AND status != 'maintenance'
                AND status != 'inactive';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the change
COMMENT ON FUNCTION public.update_vehicle_status() IS 'Updates vehicle status based on booking status changes. Sets to rented when booked (confirmed/active), and back to available when booking ends (completed/cancelled) if no other active bookings exist.';
