-- Add 'paid' status to bookings table 
-- This separates payment completion from owner manual confirmation

-- The current schema uses TEXT with CHECK constraint, not an enum
-- Update the check constraint to include 'paid' status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'paid', 'confirmed', 'active', 'completed', 'cancelled'));

-- Update any existing 'confirmed' bookings that were auto-confirmed by payment to 'paid'
-- This will require manual owner confirmation to move to 'confirmed'
UPDATE bookings 
SET status = 'paid', updated_at = NOW()
WHERE status = 'confirmed' 
  AND created_at > NOW() - INTERVAL '7 days' -- Only recent bookings to avoid disrupting old ones
  AND EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.booking_id = bookings.id 
      AND p.status = 'paid'
  );
