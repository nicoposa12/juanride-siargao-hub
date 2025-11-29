-- ============================================================================
-- Fix Commission Payment Methods
-- Updates existing commissions to use actual payment method from payments table
-- ============================================================================

-- Update commissions with actual payment methods from their related bookings
UPDATE commissions c
SET 
  payment_method = CASE 
    WHEN p.payment_method = 'gcash' THEN 'gcash'
    WHEN p.payment_method = 'maya' THEN 'paymaya'
    WHEN p.payment_method = 'paymaya' THEN 'paymaya'
    WHEN p.payment_method = 'qrph' THEN 'qrph'
    WHEN p.payment_method = 'grab_pay' THEN 'grabpay'
    WHEN p.payment_method = 'grabpay' THEN 'grabpay'
    WHEN p.payment_method = 'billease' THEN 'billease'
    WHEN p.payment_method = 'card' THEN 'gcash'
    WHEN p.payment_method = 'bank_transfer' THEN 'gcash'
    WHEN p.payment_method = 'cash' THEN 'cash'
    ELSE 'cash' -- fallback
  END,
  payment_type = CASE
    WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'qrph', 'grab_pay', 'grabpay', 'billease', 'card', 'bank_transfer') THEN 'cashless'
    ELSE 'cash'
  END
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
WHERE c.booking_id = b.id
AND p.payment_method IS NOT NULL
AND p.status = 'completed';

-- Add a comment
COMMENT ON TABLE commissions IS 'Tracks 10% commission payments. Payment method reflects how the renter actually paid (from payments table)';

-- Log how many records were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM commissions c
  INNER JOIN bookings b ON c.booking_id = b.id
  INNER JOIN payments p ON p.booking_id = b.id
  WHERE p.payment_method IS NOT NULL
  AND p.status = 'completed';
  
  RAISE NOTICE 'Updated % commission records with actual payment methods', updated_count;
END $$;
