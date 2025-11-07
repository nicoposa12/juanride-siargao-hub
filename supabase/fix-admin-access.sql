-- Fix Admin Access to All Tables
-- This script ensures admin users can access all data

-- ============================================================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
CREATE POLICY "Admins have full access to users"
ON public.users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- VEHICLES TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to vehicles" ON public.vehicles;
CREATE POLICY "Admins have full access to vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- BOOKINGS TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
CREATE POLICY "Admins have full access to bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- PAYMENTS TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
CREATE POLICY "Admins have full access to payments"
ON public.payments
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- REVIEWS TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- MESSAGES TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to messages" ON public.messages;
CREATE POLICY "Admins have full access to messages"
ON public.messages
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- MAINTENANCE_LOGS TABLE - Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to maintenance_logs" ON public.maintenance_logs;
CREATE POLICY "Admins have full access to maintenance_logs"
ON public.maintenance_logs
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- VERIFY: Check if current user is admin
-- ============================================================================
SELECT 
    'Current User Info:' as info,
    id,
    email,
    role,
    is_admin() as has_admin_access
FROM public.users
WHERE id = auth.uid();

