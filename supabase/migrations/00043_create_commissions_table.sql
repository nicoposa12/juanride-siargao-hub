-- Create commissions table for tracking rental commission payments
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rental_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qrph', 'gcash', 'paymaya', 'grabpay', 'billease', 'cash')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cashless', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'paid')),
  
  -- For cashless payments
  bank_transfer_reference TEXT,
  bank_name TEXT,
  transfer_date TIMESTAMPTZ,
  payment_proof_url TEXT,
  
  -- Verification tracking
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_commission_amount CHECK (commission_amount >= 0),
  CONSTRAINT valid_rental_amount CHECK (rental_amount >= 0),
  CONSTRAINT valid_percentage CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX idx_commissions_booking_id ON commissions(booking_id);
CREATE INDEX idx_commissions_owner_id ON commissions(owner_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_payment_method ON commissions(payment_method);
CREATE INDEX idx_commissions_payment_type ON commissions(payment_type);
CREATE INDEX idx_commissions_created_at ON commissions(created_at);
CREATE INDEX idx_commissions_transfer_date ON commissions(transfer_date);

-- Add RLS policies
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Admin can view all commissions
CREATE POLICY "Admins can view all commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Owners can view their own commissions
CREATE POLICY "Owners can view their own commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Owners can update their commission submissions
CREATE POLICY "Owners can update their own commissions"
  ON commissions
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admin can update commission verification
CREATE POLICY "Admins can update commission verification"
  ON commissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can create commissions (triggered by booking confirmation)
CREATE POLICY "System can create commissions"
  ON commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_commissions_updated_at();

-- Add helpful comments
COMMENT ON TABLE commissions IS 'Tracks 10% commission payments from vehicle owners to admin for confirmed rentals';
COMMENT ON COLUMN commissions.payment_type IS 'Either cashless (QRPh, GCash, PayMaya, GrabPay, BillEase) or cash';
COMMENT ON COLUMN commissions.status IS 'pending: awaiting payment, submitted: owner submitted proof, verified: admin verified, paid: commission received';
