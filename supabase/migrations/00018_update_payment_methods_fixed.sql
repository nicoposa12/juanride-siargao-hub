-- ============================================================================
-- Update payment methods and status constraints (SAFE VERSION)
-- Adds support for: qrph, paymaya, billease, grab_pay
-- Adds 'processing' status for better payment tracking
-- ============================================================================

-- Drop ALL old constraints to start fresh
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add updated constraint with all supported payment methods
ALTER TABLE public.payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN (
  'gcash',      -- GCash e-wallet
  'maya',       -- Maya (formerly PayMaya) e-wallet
  'paymaya',    -- PayMaya (alternative name)
  'card',       -- Credit/Debit card
  'bank_transfer', -- Bank transfer
  'qrph',       -- QR PH (PayMongo QR)
  'grab_pay',   -- GrabPay e-wallet
  'billease'    -- BillEase buy-now-pay-later
));

-- Add updated constraint with 'processing' status
ALTER TABLE public.payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded'));

-- Update any existing 'paymaya' records to 'maya' for consistency
UPDATE public.payments
SET payment_method = 'maya'
WHERE payment_method = 'paymaya';

-- Add comments explaining the columns
COMMENT ON COLUMN public.payments.payment_method IS 
'Payment method used: gcash, maya/paymaya, card, bank_transfer, qrph, grab_pay, billease';

COMMENT ON COLUMN public.payments.status IS 
'Payment status: pending (created), processing (in progress), paid (completed), failed (error), refunded (money returned)';
