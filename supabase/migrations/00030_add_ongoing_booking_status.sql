-- Add 'ongoing' status to bookings table
-- This status indicates a booking that is currently in progress/active rental

-- Update the check constraint to include 'ongoing' status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'paid', 'confirmed', 'active', 'ongoing', 'completed', 'cancelled'));
