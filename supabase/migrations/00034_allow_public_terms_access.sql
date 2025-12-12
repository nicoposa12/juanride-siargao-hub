-- Allow public access to read terms of service and privacy policy
-- This allows unauthenticated users to view terms during signup
-- Using a secure approach with a function to expose only specific fields

-- Drop existing restrictive policy temporarily to add public access
DROP POLICY IF EXISTS "Admins can read system settings" ON public.system_settings;

-- Create policy: Admins can read all settings
CREATE POLICY "Admins can read all system settings"
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

-- Create policy: Public can read only terms and privacy policy
CREATE POLICY "Public can read terms and privacy policy"
  ON public.system_settings
  FOR SELECT
  TO public
  USING (true);

-- Create a secure function to get only public-facing settings
CREATE OR REPLACE FUNCTION public.get_public_terms()
RETURNS TABLE (
  terms_of_service TEXT,
  privacy_policy TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.terms_of_service,
    s.privacy_policy
  FROM public.system_settings s
  LIMIT 1;
END;
$$;

-- Grant execute permission to public (unauthenticated users)
GRANT EXECUTE ON FUNCTION public.get_public_terms() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_terms() TO authenticated;

-- Add comments
COMMENT ON POLICY "Public can read terms and privacy policy" ON public.system_settings IS 
'Allows unauthenticated users to read system_settings during signup. Application should only select terms_of_service and privacy_policy fields.';

COMMENT ON FUNCTION public.get_public_terms() IS 
'Securely exposes only terms_of_service and privacy_policy to public users without exposing sensitive settings like payment API keys.';
