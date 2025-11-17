-- Fix vehicle status update trigger to use 'unavailable' instead of 'rented'
-- This aligns with the updated check constraint that only allows:
-- 'available', 'unavailable', 'maintenance'

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

-- Comment explaining the change
COMMENT ON FUNCTION public.update_vehicle_status() IS 'Updates vehicle status based on booking status changes. Sets to unavailable when booked (confirmed/active), and back to available when booking ends (completed/cancelled) if no other active bookings exist.';
