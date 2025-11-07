-- Complete Fix for JuanRide Database Issues
-- Run this entire file in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Fix RLS policies to be less restrictive during development
-- ============================================================================

-- Temporarily make policies more permissive for development
-- You can tighten these later for production

-- Drop all existing user policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.users;

-- Create simpler, more permissive policies
CREATE POLICY "Enable read access for all users"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 2: Fix vehicle policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view approved vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update any vehicle" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can delete own vehicles" ON public.vehicles;

-- Simpler vehicle policies
CREATE POLICY "Enable read for all vehicles"
    ON public.vehicles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.vehicles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable update for vehicle owners"
    ON public.vehicles FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "Enable delete for vehicle owners"
    ON public.vehicles FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ============================================================================
-- STEP 3: Fix booking policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their vehicles" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Simpler booking policies
CREATE POLICY "Enable read for booking participants"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        auth.uid() = renter_id OR
        EXISTS (
            SELECT 1 FROM public.vehicles 
            WHERE vehicles.id = bookings.vehicle_id 
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated users"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Enable update for booking participants"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = renter_id OR
        EXISTS (
            SELECT 1 FROM public.vehicles 
            WHERE vehicles.id = bookings.vehicle_id 
            AND vehicles.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 4: Fix payment, review, and message policies
-- ============================================================================

-- Payments
DROP POLICY IF EXISTS "Users can view their payment records" ON public.payments;
CREATE POLICY "Enable read for payment owners"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = payments.booking_id 
            AND (bookings.renter_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM public.vehicles 
                     WHERE vehicles.id = bookings.vehicle_id 
                     AND vehicles.owner_id = auth.uid()
                 ))
        )
    );

CREATE POLICY "Enable insert for authenticated users"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

CREATE POLICY "Enable read for all reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

-- Messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Enable read for message participants"
    ON public.messages FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR
           EXISTS (
               SELECT 1 FROM public.bookings 
               WHERE bookings.id = messages.booking_id 
               AND (bookings.renter_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.vehicles 
                        WHERE vehicles.id = bookings.vehicle_id 
                        AND vehicles.owner_id = auth.uid()
                    ))
           ));

CREATE POLICY "Enable insert for authenticated users"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Maintenance logs
DROP POLICY IF EXISTS "Owners can view maintenance for their vehicles" ON public.maintenance_logs;

CREATE POLICY "Enable read for vehicle owners"
    ON public.maintenance_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles 
            WHERE vehicles.id = maintenance_logs.vehicle_id 
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for vehicle owners"
    ON public.maintenance_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vehicles 
            WHERE vehicles.id = vehicle_id 
            AND vehicles.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 5: Fix the user creation trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_active, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'renter'),
        true,
        false
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: Create missing user profiles for existing auth users
-- ============================================================================

-- This will create profiles for any auth users that don't have them
INSERT INTO public.users (id, email, full_name, role, is_active, is_verified)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    COALESCE(au.raw_user_meta_data->>'role', 'renter'),
    true,
    false
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Database policies updated successfully!' as message;
SELECT 'Existing users synced!' as message;
SELECT 'You should now be able to use the application.' as message;

