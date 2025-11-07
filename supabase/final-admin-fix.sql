-- FINAL FIX: Allow Admin to Access All Tables
-- This removes complex policies and replaces with simple ones

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public vehicles are viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view approved vehicles" ON public.vehicles;

-- Simple policies for vehicles
CREATE POLICY "Public can view all vehicles"
ON public.vehicles FOR SELECT
USING (true);

CREATE POLICY "Owners can manage their vehicles"
ON public.vehicles FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for booking participants" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their vehicles" ON public.bookings;

-- Simple policies for bookings
CREATE POLICY "Users can view their bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
    auth.uid() = renter_id OR
    EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = bookings.vehicle_id AND vehicles.owner_id = auth.uid())
);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (
    auth.uid() = renter_id OR
    EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = bookings.vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for payment owners" ON public.payments;
DROP POLICY IF EXISTS "Users can view their payment records" ON public.payments;

CREATE POLICY "Users can view relevant payments"
ON public.payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE bookings.id = payments.booking_id 
        AND (
            bookings.renter_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = bookings.vehicle_id AND vehicles.owner_id = auth.uid())
        )
    )
);

CREATE POLICY "System can create payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Public can view reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for message participants" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;

CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    auth.uid() = sender_id OR
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE bookings.id = messages.booking_id 
        AND (
            bookings.renter_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = bookings.vehicle_id AND vehicles.owner_id = auth.uid())
        )
    )
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- MAINTENANCE_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Enable read for vehicle owners" ON public.maintenance_logs;

CREATE POLICY "Owners can manage maintenance logs"
ON public.maintenance_logs FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = maintenance_logs.vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'All policies updated! Refresh your browser.' as status;

