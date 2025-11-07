-- ============================================================================
-- COMPREHENSIVE MESSAGING SYSTEM FIX
-- Systems Thinking Approach: Fix all interconnected policy conflicts
-- ============================================================================

-- STEP 1: Clean slate - Remove all conflicting message policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read for message participants" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;

-- STEP 2: Create simplified, robust message policies
-- Policy 1: Users can view messages they're involved in (sender or part of booking)
CREATE POLICY "Users can view conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    -- User is sender
    auth.uid() = sender_id 
    OR
    -- User is receiver 
    auth.uid() = receiver_id
    OR
    -- User is part of the booking (renter or vehicle owner)
    EXISTS (
        SELECT 1 FROM public.bookings b
        LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE b.id = messages.booking_id 
        AND (
            b.renter_id = auth.uid() OR 
            v.owner_id = auth.uid()
        )
    )
);

-- Policy 2: Users can send messages for their bookings
CREATE POLICY "Users can send messages in their bookings"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    -- User is the sender
    auth.uid() = sender_id
    AND
    -- User is part of this booking
    EXISTS (
        SELECT 1 FROM public.bookings b
        LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE b.id = messages.booking_id 
        AND (
            b.renter_id = auth.uid() OR 
            v.owner_id = auth.uid()
        )
    )
);

-- Policy 3: Users can mark their received messages as read
CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- STEP 3: Ensure vehicle policies support message queries
DROP POLICY IF EXISTS "Public can view approved vehicles" ON public.vehicles;
CREATE POLICY "Public can view approved vehicles"
ON public.vehicles FOR SELECT
USING (status = 'approved' OR owner_id = auth.uid());

-- STEP 4: Ensure booking policies support message queries  
DROP POLICY IF EXISTS "Users can view their bookings" ON public.bookings;
CREATE POLICY "Users can view their bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
    renter_id = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM public.vehicles 
        WHERE vehicles.id = bookings.vehicle_id 
        AND vehicles.owner_id = auth.uid()
    )
);

-- STEP 5: Ensure user profiles are accessible for message display
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
ON public.users FOR SELECT
USING (true);

-- STEP 6: Grant necessary permissions
GRANT SELECT ON public.messages TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
GRANT UPDATE ON public.messages TO authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.vehicles TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- STEP 7: Refresh permissions
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Messaging system RLS policies fixed! All 406 errors should be resolved.' as status;
