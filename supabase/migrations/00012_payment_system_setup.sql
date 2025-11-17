-- ============================================================================
-- PAYMENT SYSTEM SETUP
-- Ensures all tables and functions needed for payment processing are in place
-- ============================================================================

-- Ensure payments table has all necessary columns (in case of partial migration)
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'transaction_id') THEN
        ALTER TABLE public.payments ADD COLUMN transaction_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_gateway_response') THEN
        ALTER TABLE public.payments ADD COLUMN payment_gateway_response JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'paid_at') THEN
        ALTER TABLE public.payments ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'platform_fee') THEN
        ALTER TABLE public.payments ADD COLUMN platform_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'owner_payout') THEN
        ALTER TABLE public.payments ADD COLUMN owner_payout DECIMAL(10, 2);
    END IF;
END $$;

-- Update payment method constraint to include new methods
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check 
    CHECK (payment_method IN ('gcash', 'maya', 'card', 'bank_transfer', 'paymaya', 'grabpay'));

-- Update payment status constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'));

-- Create index on transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Create index on paid_at for reporting
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at) WHERE paid_at IS NOT NULL;

-- ============================================================================
-- FUNCTION: Update booking status when payment is completed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_booking_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When payment status changes to 'paid', update booking to 'confirmed'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.bookings 
        SET status = 'confirmed',
            updated_at = NOW()
        WHERE id = NEW.booking_id;
        
        -- Set paid_at timestamp if not already set
        IF NEW.paid_at IS NULL THEN
            NEW.paid_at := NOW();
        END IF;
    END IF;

    -- When payment status changes to 'failed', optionally update booking
    IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
        -- Keep booking as 'pending' to allow retry, or cancel after multiple failures
        -- This can be customized based on business logic
        NULL; -- Placeholder for future logic
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS trigger_update_booking_on_payment ON public.payments;
CREATE TRIGGER trigger_update_booking_on_payment
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_booking_on_payment();

-- ============================================================================
-- FUNCTION: Calculate platform fee and owner payout
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_payment_fees()
RETURNS TRIGGER AS $$
DECLARE
    platform_fee_rate DECIMAL := 0.05; -- 5% platform fee
BEGIN
    -- Calculate platform fee (5% of amount)
    NEW.platform_fee := ROUND(NEW.amount * platform_fee_rate, 2);
    
    -- Calculate owner payout (amount - platform fee)
    NEW.owner_payout := NEW.amount - NEW.platform_fee;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate fees on insert
DROP TRIGGER IF EXISTS trigger_calculate_payment_fees ON public.payments;
CREATE TRIGGER trigger_calculate_payment_fees
    BEFORE INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_payment_fees();

-- ============================================================================
-- VIEW: Payment summary for reporting
-- ============================================================================
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
    p.id,
    p.booking_id,
    p.amount,
    p.payment_method,
    p.status,
    p.transaction_id,
    p.paid_at,
    p.platform_fee,
    p.owner_payout,
    p.created_at,
    b.renter_id,
    b.vehicle_id,
    b.start_date,
    b.end_date,
    v.owner_id,
    CONCAT(v.make, ' ', v.model) as vehicle_name,
    renter.email as renter_email,
    renter.full_name as renter_name,
    owner.email as owner_email,
    owner.full_name as owner_name
FROM public.payments p
JOIN public.bookings b ON b.id = p.booking_id
JOIN public.vehicles v ON v.id = b.vehicle_id
LEFT JOIN public.users renter ON renter.id = b.renter_id
LEFT JOIN public.users owner ON owner.id = v.owner_id;

-- ============================================================================
-- RLS POLICIES for payments table
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments for their bookings" ON public.payments;
DROP POLICY IF EXISTS "System can update payment status" ON public.payments;
DROP POLICY IF EXISTS "Owners can view payments for their vehicles" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- Users can view payments for their own bookings
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (
    booking_id IN (
        SELECT id FROM public.bookings WHERE renter_id = auth.uid()
    )
);

-- Vehicle owners can view payments for bookings of their vehicles
CREATE POLICY "Owners can view payments for their vehicles"
ON public.payments FOR SELECT
USING (
    booking_id IN (
        SELECT b.id FROM public.bookings b
        JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE v.owner_id = auth.uid()
    )
);

-- Users can create payment records for their own bookings
CREATE POLICY "Users can insert payments for their bookings"
ON public.payments FOR INSERT
WITH CHECK (
    booking_id IN (
        SELECT id FROM public.bookings WHERE renter_id = auth.uid()
    )
);

-- System/authenticated users can update payment status
CREATE POLICY "System can update payment status"
ON public.payments FOR UPDATE
USING (
    -- Allow renter to update their payment
    booking_id IN (
        SELECT id FROM public.bookings WHERE renter_id = auth.uid()
    )
    OR
    -- Allow owner to view/update payment for their vehicle
    booking_id IN (
        SELECT b.id FROM public.bookings b
        JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE v.owner_id = auth.uid()
    )
);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update all payments
CREATE POLICY "Admins can update all payments"
ON public.payments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to payment_summary view
GRANT SELECT ON public.payment_summary TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SAMPLE QUERIES FOR VERIFICATION
-- ============================================================================

-- To verify setup, run these queries:
-- 
-- 1. Check all payment statuses:
-- SELECT status, COUNT(*) FROM public.payments GROUP BY status;
--
-- 2. View payment summary:
-- SELECT * FROM public.payment_summary WHERE paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 10;
--
-- 3. Check platform revenue:
-- SELECT 
--     DATE_TRUNC('day', paid_at) as date,
--     SUM(platform_fee) as daily_revenue,
--     SUM(owner_payout) as owner_payout,
--     COUNT(*) as num_payments
-- FROM public.payments
-- WHERE status = 'paid'
-- GROUP BY DATE_TRUNC('day', paid_at)
-- ORDER BY date DESC;

COMMENT ON TABLE public.payments IS 'Stores payment records for bookings with PayMongo integration';
COMMENT ON VIEW public.payment_summary IS 'Comprehensive view of payments with related booking and user information';
COMMENT ON FUNCTION public.update_booking_on_payment() IS 'Automatically updates booking status when payment is completed';
COMMENT ON FUNCTION public.calculate_payment_fees() IS 'Calculates platform fee (5%) and owner payout for each payment';
