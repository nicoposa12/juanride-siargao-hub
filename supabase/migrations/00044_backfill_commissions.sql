-- Backfill commission records for existing confirmed bookings
-- This creates commission records for bookings confirmed before the commission system was implemented

DO $$
DECLARE
  booking_record RECORD;
  commission_amt DECIMAL(10, 2);
BEGIN
  -- Loop through all confirmed bookings that don't have a commission record
  FOR booking_record IN
    SELECT 
      b.id as booking_id,
      b.total_price,
      v.owner_id,
      b.created_at,
      b.updated_at
    FROM bookings b
    INNER JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.status IN ('confirmed', 'active', 'ongoing', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM commissions c WHERE c.booking_id = b.id
    )
  LOOP
    -- Calculate 10% commission
    commission_amt := booking_record.total_price * 0.10;
    
    -- Insert commission record
    INSERT INTO commissions (
      booking_id,
      owner_id,
      rental_amount,
      commission_amount,
      commission_percentage,
      payment_method,
      payment_type,
      status,
      created_at,
      updated_at
    ) VALUES (
      booking_record.booking_id,
      booking_record.owner_id,
      booking_record.total_price,
      commission_amt,
      10.00,
      'cash', -- Default to cash for historical bookings
      'cash',
      'pending', -- Set as pending so owner can pay
      booking_record.created_at, -- Use original booking created date
      booking_record.updated_at
    );
    
    RAISE NOTICE 'Created commission for booking % - Amount: %', booking_record.booking_id, commission_amt;
  END LOOP;
  
  RAISE NOTICE 'Commission backfill completed successfully';
END $$;

-- Show summary of created commissions
SELECT 
  'Backfill Summary' as info,
  COUNT(*) as total_commissions_created,
  SUM(commission_amount) as total_commission_amount,
  SUM(rental_amount) as total_rental_amount
FROM commissions
WHERE created_at >= NOW() - INTERVAL '1 minute';
