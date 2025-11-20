-- ============================================================================
-- SAFE MIGRATION TO FIX ACTIVE USER POLICIES
-- ============================================================================
-- Description: Safely add/update RLS policies to enforce active user status
--              This migration is designed to be non-destructive and idempotent
-- 
-- Strategy: Use different policy names to avoid conflicts with existing policies
-- ============================================================================

-- ============================================================================
-- SAFE USER POLICIES UPDATE
-- ============================================================================

-- Use a new policy name to avoid conflicts
DROP POLICY IF EXISTS "Active users update profile v2" ON public.users;
CREATE POLICY "Active users update profile v2"
    ON public.users FOR UPDATE
    USING (auth.uid() = id AND is_active = true);

-- Ensure admins can see all users for management (use new name)
DROP POLICY IF EXISTS "Admin view all users v2" ON public.users;
CREATE POLICY "Admin view all users v2"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SAFE BOOKING POLICIES UPDATE
-- ============================================================================

-- Use new policy names to avoid conflicts
DROP POLICY IF EXISTS "Active users create bookings v2" ON public.bookings;
CREATE POLICY "Active users create bookings v2"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Active users view own bookings v2" ON public.bookings;
CREATE POLICY "Active users view own bookings v2"
    ON public.bookings FOR SELECT
    USING (
        (renter_id = auth.uid() OR owner_id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Active users update own bookings v2" ON public.bookings;
CREATE POLICY "Active users update own bookings v2"
    ON public.bookings FOR UPDATE
    USING (
        (renter_id = auth.uid() OR owner_id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Admin overrides for bookings
DROP POLICY IF EXISTS "Admin view all bookings v2" ON public.bookings;
CREATE POLICY "Admin view all bookings v2"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admin update any booking v2" ON public.bookings;
CREATE POLICY "Admin update any booking v2"
    ON public.bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SAFE VEHICLE POLICIES UPDATE
-- ============================================================================

-- Use new policy names to avoid conflicts
DROP POLICY IF EXISTS "Active users view vehicles v2" ON public.vehicles;
CREATE POLICY "Active users view vehicles v2"
    ON public.vehicles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Active owners manage vehicles v2" ON public.vehicles;
CREATE POLICY "Active owners manage vehicles v2"
    ON public.vehicles FOR ALL
    USING (
        owner_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true AND role = 'owner'
        )
    );

-- Admin override for vehicles
DROP POLICY IF EXISTS "Admin view all vehicles v2" ON public.vehicles;
CREATE POLICY "Admin view all vehicles v2"
    ON public.vehicles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- OPTIONAL: CLEAN UP OLD CONFLICTING POLICIES
-- ============================================================================
-- These are the policies that might have been created by the previous migration
-- We'll try to remove them if they exist, but won't fail if they don't

-- Note: We only clean up if the new policies are successfully created
DO $$
BEGIN
    -- Check if our new policies exist before cleaning up old ones
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Active users update profile v2' AND tablename = 'users') THEN
        -- Safe to remove old conflicting policies
        DROP POLICY IF EXISTS "Active users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Active users can view profiles" ON public.users;
        DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
        
        -- Remove old booking policies if they exist
        DROP POLICY IF EXISTS "Active users can create bookings" ON public.bookings;
        DROP POLICY IF EXISTS "Active users can view own bookings" ON public.bookings;
        DROP POLICY IF EXISTS "Active users can update own bookings" ON public.bookings;
        DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
        DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
        
        -- Remove old vehicle policies if they exist
        DROP POLICY IF EXISTS "Active users can view vehicles" ON public.vehicles;
        DROP POLICY IF EXISTS "Active owners can manage their vehicles" ON public.vehicles;
        DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;
        
        RAISE NOTICE 'Successfully cleaned up old policies and created new active user enforcement policies';
    END IF;
END
$$;

-- ============================================================================
-- VERIFY POLICY CREATION
-- ============================================================================

-- Query to verify the policies were created successfully
-- (commented out for production, uncomment for testing)
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_check
FROM pg_policies 
WHERE tablename IN ('users', 'bookings', 'vehicles') 
  AND policyname LIKE '%v2%'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- MIGRATION COMPLETED SAFELY
-- ============================================================================
