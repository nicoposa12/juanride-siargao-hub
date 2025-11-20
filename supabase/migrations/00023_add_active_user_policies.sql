-- ============================================================================
-- ADD RLS POLICIES TO ENFORCE ACTIVE USER STATUS
-- ============================================================================
-- Description: Add security policies that ensure only active users can 
--             perform data operations, enhancing the deactivation feature
-- 
-- Security Impact: 
-- - Deactivated users cannot create new bookings
-- - Deactivated users cannot update their profiles beyond basic auth operations
-- - Deactivated users cannot create or modify vehicles
-- ============================================================================

-- ============================================================================
-- UPDATE EXISTING USER POLICIES TO ENFORCE ACTIVE STATUS
-- ============================================================================

-- Drop existing user policies and recreate with active status checks
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Users can only update their own profile if their account is active
CREATE POLICY "Active users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id AND is_active = true);

-- Active users can view all profiles (for displaying owner info, etc.)
CREATE POLICY "Active users can view profiles"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Ensure admins can view ALL users (including inactive ones) for user management
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can still update any profile (needed for admin management)
-- This policy already exists and should remain unchanged

-- ============================================================================
-- BOOKING POLICIES - ENFORCE ACTIVE STATUS
-- ============================================================================

-- Drop existing booking policies and recreate with active status checks
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Only active users can create bookings
CREATE POLICY "Active users can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Active users can view bookings where they are renter or owner
CREATE POLICY "Active users can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        (renter_id = auth.uid() OR owner_id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Active users can update their own bookings (as renter or owner)
CREATE POLICY "Active users can update own bookings"
    ON public.bookings FOR UPDATE
    USING (
        (renter_id = auth.uid() OR owner_id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- ============================================================================
-- VEHICLE POLICIES - ENFORCE ACTIVE STATUS
-- ============================================================================

-- Drop existing vehicle policies and recreate with active status checks
DROP POLICY IF EXISTS "Vehicle owners can manage their vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view all vehicles" ON public.vehicles;

-- Only active users can view vehicles
CREATE POLICY "Active users can view vehicles"
    ON public.vehicles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Only active owners can manage their vehicles
CREATE POLICY "Active owners can manage their vehicles"
    ON public.vehicles FOR ALL
    USING (
        owner_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true AND role = 'owner'
        )
    );

-- ============================================================================
-- FAVORITES POLICIES - ENFORCE ACTIVE STATUS
-- ============================================================================

-- Drop existing favorites policies if they exist
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.favorites;

-- Only active users can manage favorites
CREATE POLICY "Active users can manage favorites"
    ON public.favorites FOR ALL
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- ============================================================================
-- REVIEWS POLICIES - ENFORCE ACTIVE STATUS  
-- ============================================================================

-- Drop existing review policies if they exist
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

-- Only active users can create reviews
CREATE POLICY "Active users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Active users can view all reviews
CREATE POLICY "Active users can view reviews"
    ON public.reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Active users can update their own reviews
CREATE POLICY "Active users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- ============================================================================
-- ADMIN OVERRIDE POLICIES
-- ============================================================================

-- Admins can still view and manage all data regardless of active status
-- This ensures admin functionality remains intact

-- Admin can view all users (already exists)
-- Admin can update any user profile (already exists)  
-- Admin can view all bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update any booking
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
CREATE POLICY "Admins can update any booking"
    ON public.bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can view all vehicles
DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;
CREATE POLICY "Admins can view all vehicles"
    ON public.vehicles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test queries (commented out for production):
-- SELECT policy_name, table_name FROM information_schema.row_security_policies 
-- WHERE table_schema = 'public' AND policy_name LIKE '%active%';

-- SELECT COUNT(*) FROM public.users WHERE is_active = false;

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================================================
-- This migration adds RLS policies to enforce active user status across all operations
-- Deactivated users will be blocked from creating bookings, updating profiles, etc.
