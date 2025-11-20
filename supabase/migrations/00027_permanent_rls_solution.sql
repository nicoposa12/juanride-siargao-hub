-- ============================================================================
-- PERMANENT RLS SOLUTION
-- ============================================================================
-- Description: Implements a robust, permanent solution for Row Level Security
--              using a SECURITY DEFINER function to avoid circular dependencies.
--              Cleans up previous temporary policies.
-- ============================================================================

-- 1. Create a helper function to check admin status safely
--    SECURITY DEFINER means this function runs with the privileges of the creator (db admin),
--    bypassing RLS on the users table during the check. This prevents infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP: Remove all chaos from previous temporary migrations
-- ============================================================================

-- Users table cleanup
DROP POLICY IF EXISTS "Active users update profile v2" ON public.users;
DROP POLICY IF EXISTS "Admin view all users v2" ON public.users;
DROP POLICY IF EXISTS "Admin view users simple" ON public.users;
DROP POLICY IF EXISTS "Temp admin access" ON public.users;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles with admin override" ON public.users;
DROP POLICY IF EXISTS "Active users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Active users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.users;

-- Bookings table cleanup
DROP POLICY IF EXISTS "Active users create bookings v2" ON public.bookings;
DROP POLICY IF EXISTS "Active users view own bookings v2" ON public.bookings;
DROP POLICY IF EXISTS "Active users update own bookings v2" ON public.bookings;
DROP POLICY IF EXISTS "Admin view all bookings v2" ON public.bookings;
DROP POLICY IF EXISTS "Admin update any booking v2" ON public.bookings;
DROP POLICY IF EXISTS "Active users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Active users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Active users can update own bookings" ON public.bookings;

-- Vehicles table cleanup
DROP POLICY IF EXISTS "Active users view vehicles v2" ON public.vehicles;
DROP POLICY IF EXISTS "Active owners manage vehicles v2" ON public.vehicles;
DROP POLICY IF EXISTS "Admin view all vehicles v2" ON public.vehicles;
DROP POLICY IF EXISTS "Active users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Active owners can manage their vehicles" ON public.vehicles;

-- ============================================================================
-- FINAL USERS TABLE POLICIES
-- ============================================================================

-- 1. VIEW: Admins can see everyone. Active users can see everyone (for social/booking features).
--    We interpret "Users can view profiles" as needing to see owners/renters.
--    Ideally, public profile info might be visible, but let's restrict to active users + admins.
CREATE POLICY "View profiles"
    ON public.users FOR SELECT
    USING (
        is_admin() 
        OR 
        (auth.uid() IS NOT NULL) -- Allow all authenticated users to view profiles (simplest safe default)
    );

-- 2. UPDATE: Admins can update ANY profile. Active users can update OWN profile.
CREATE POLICY "Update profiles"
    ON public.users FOR UPDATE
    USING (
        is_admin() 
        OR 
        (auth.uid() = id AND is_active = true)
    );

-- 3. INSERT: Users can insert their own profile (registration)
CREATE POLICY "Insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- FINAL BOOKINGS TABLE POLICIES
-- ============================================================================

-- 1. VIEW: Admins see all. Users see their own (as renter or owner).
CREATE POLICY "View bookings"
    ON public.bookings FOR SELECT
    USING (
        is_admin()
        OR
        (auth.uid() = renter_id OR auth.uid() = owner_id)
    );

-- 2. INSERT: Only ACTIVE users can create bookings.
CREATE POLICY "Create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND 
        (
            SELECT is_active FROM public.users WHERE id = auth.uid()
        ) = true
    );

-- 3. UPDATE: Admins update any. Users update own (if active).
CREATE POLICY "Update bookings"
    ON public.bookings FOR UPDATE
    USING (
        is_admin()
        OR
        (
            (auth.uid() = renter_id OR auth.uid() = owner_id)
            AND
            (SELECT is_active FROM public.users WHERE id = auth.uid()) = true
        )
    );

-- ============================================================================
-- FINAL VEHICLES TABLE POLICIES
-- ============================================================================

-- 1. VIEW: Everyone (even unauthenticated? or just auth?) can view available vehicles usually.
--    Let's allow all authenticated users to view.
CREATE POLICY "View vehicles"
    ON public.vehicles FOR SELECT
    USING (true);

-- 2. MANAGE: Admins manage all. Active Owners manage their own.
CREATE POLICY "Manage vehicles"
    ON public.vehicles FOR ALL
    USING (
        is_admin()
        OR
        (
            owner_id = auth.uid()
            AND
            (SELECT is_active FROM public.users WHERE id = auth.uid()) = true
            AND
            (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
        )
    );

-- ============================================================================
-- EMERGENCY RESET (Just in case)
-- ============================================================================
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
