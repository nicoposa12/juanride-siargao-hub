-- ============================================================================
-- FIX PAYMENT METHODS CONSTRAINT
-- Add missing payment methods: grab_pay, billease, qrph
-- Update constraint to match frontend payment method values
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

-- Add new constraint with all supported payment methods
-- Using underscore format (grab_pay) to match PayMongo API and frontend
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check 
    CHECK (payment_method IN (
        'gcash',        -- GCash e-wallet
        'paymaya',      -- Maya (PayMaya) e-wallet  
        'grab_pay',     -- GrabPay wallet (underscore format)
        'billease',     -- BillEase buy now pay later
        'qrph',         -- QR PH (any bank QR payment)
        'card',         -- Credit/Debit card
        'bank_transfer', -- Direct bank transfer (legacy/future)
        'maya'          -- Alternative spelling for compatibility
    ));

-- Add comment for documentation
COMMENT ON CONSTRAINT payments_payment_method_check ON public.payments IS 
    'Validates payment method values. Uses underscore format (grab_pay) to match PayMongo API standards.';

-- Verify the constraint
DO $$
BEGIN
    RAISE NOTICE 'Payment methods constraint updated successfully';
    RAISE NOTICE 'Supported methods: gcash, paymaya, grab_pay, billease, qrph, card, bank_transfer, maya';
END $$;
