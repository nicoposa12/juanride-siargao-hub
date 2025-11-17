-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Booking Policies
  partial_payment_percentage INTEGER DEFAULT 30 CHECK (partial_payment_percentage >= 0 AND partial_payment_percentage <= 100),
  cancellation_window_hours INTEGER DEFAULT 24 CHECK (cancellation_window_hours >= 0),
  refund_percentage INTEGER DEFAULT 80 CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  late_return_fee_per_hour INTEGER DEFAULT 100 CHECK (late_return_fee_per_hour >= 0),
  
  -- Payment Gateway Settings
  gcash_enabled BOOLEAN DEFAULT TRUE,
  credit_card_enabled BOOLEAN DEFAULT TRUE,
  bank_transfer_enabled BOOLEAN DEFAULT TRUE,
  payment_api_key TEXT,
  
  -- Terms & Conditions
  terms_of_service TEXT,
  privacy_policy TEXT,
  
  -- System Features
  gps_tracking_enabled BOOLEAN DEFAULT TRUE,
  maintenance_alerts_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_notifications_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add comment
COMMENT ON TABLE public.system_settings IS 'System-wide settings and configurations for JuanRide platform';

-- Create index for faster lookups (though there should only be one row)
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings(updated_at DESC);

-- Insert default settings
INSERT INTO public.system_settings (
  partial_payment_percentage,
  cancellation_window_hours,
  refund_percentage,
  late_return_fee_per_hour,
  gcash_enabled,
  credit_card_enabled,
  bank_transfer_enabled,
  gps_tracking_enabled,
  maintenance_alerts_enabled,
  email_notifications_enabled,
  sms_notifications_enabled,
  terms_of_service,
  privacy_policy
) VALUES (
  30,
  24,
  80,
  100,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  'By using JuanRide, you agree to comply with all rental policies...',
  'JuanRide respects your privacy and is committed to protecting your personal data...'
) ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can read settings
CREATE POLICY "Admins can read system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy: Only admins can update settings
CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy: Only admins can insert settings
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
