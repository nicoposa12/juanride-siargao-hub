-- Clean up duplicate payment records
-- Keep only the oldest payment record for each booking

WITH ranked_payments AS (
  SELECT 
    id,
    booking_id,
    ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY created_at ASC) as rn
  FROM payments
)
DELETE FROM payments
WHERE id IN (
  SELECT id FROM ranked_payments WHERE rn > 1
);

-- Verify no duplicates remain
SELECT 
  booking_id, 
  COUNT(*) as payment_count
FROM payments
GROUP BY booking_id
HAVING COUNT(*) > 1;
