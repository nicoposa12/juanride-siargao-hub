-- JuanRide Row Level Security (RLS) Policies
-- Secure data access based on user roles and ownership

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Anyone can view user profiles (for displaying owner info, etc.)
CREATE POLICY "Users can view all profiles"
    ON public.users FOR SELECT
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- VEHICLES TABLE POLICIES
-- ============================================================================

-- Anyone can view approved and available vehicles
CREATE POLICY "Anyone can view approved vehicles"
    ON public.vehicles FOR SELECT
    USING (is_approved = true OR owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only authenticated owners can insert vehicles
CREATE POLICY "Owners can insert vehicles"
    ON public.vehicles FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Owners can update their own vehicles
CREATE POLICY "Owners can update own vehicles"
    ON public.vehicles FOR UPDATE
    USING (auth.uid() = owner_id);

-- Admins can update any vehicle
CREATE POLICY "Admins can update any vehicle"
    ON public.vehicles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Owners can delete their own vehicles (if no active bookings)
CREATE POLICY "Owners can delete own vehicles"
    ON public.vehicles FOR DELETE
    USING (
        auth.uid() = owner_id AND
        NOT EXISTS (
            SELECT 1 FROM public.bookings
            WHERE vehicle_id = vehicles.id AND status IN ('confirmed', 'active')
        )
    );

-- ============================================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================================

-- Users can view their own bookings (as renter or owner)
CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        auth.uid() = renter_id OR
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated renters can create bookings
CREATE POLICY "Renters can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() = renter_id AND
        auth.uid() IS NOT NULL
    );

-- Renters can update their own pending bookings
CREATE POLICY "Renters can update own pending bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = renter_id AND status = 'pending');

-- Owners can update bookings for their vehicles
CREATE POLICY "Owners can update bookings for their vehicles"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = owner_id);

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
    ON public.bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Users can view payments for their bookings
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id
            AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert payments (via service role)
CREATE POLICY "Service role can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (true);

-- Admins can update payments
CREATE POLICY "Admins can update payments"
    ON public.payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
    ON public.reviews FOR SELECT
    USING (is_approved = true OR reviewer_id = auth.uid() OR owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Renters can insert reviews for completed bookings
CREATE POLICY "Renters can insert reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id AND
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.renter_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

-- Reviewers can update their own reviews within 48 hours
CREATE POLICY "Reviewers can update own recent reviews"
    ON public.reviews FOR UPDATE
    USING (
        auth.uid() = reviewer_id AND
        created_at > NOW() - INTERVAL '48 hours'
    );

-- Owners can add responses to reviews
CREATE POLICY "Owners can respond to reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Admins can moderate reviews
CREATE POLICY "Admins can moderate reviews"
    ON public.reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = sender_id OR
        auth.uid() = receiver_id OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can send messages for their bookings
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = messages.booking_id
            AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
        )
    );

-- Users can mark their received messages as read
CREATE POLICY "Users can update received messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- ============================================================================
-- MAINTENANCE_LOGS TABLE POLICIES
-- ============================================================================

-- Owners can view maintenance logs for their vehicles
CREATE POLICY "Owners can view own vehicle maintenance"
    ON public.maintenance_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Owners can manage maintenance logs for their vehicles
CREATE POLICY "Owners can manage own vehicle maintenance"
    ON public.maintenance_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- BLOCKED_DATES TABLE POLICIES
-- ============================================================================

-- Anyone can view blocked dates for vehicles
CREATE POLICY "Anyone can view blocked dates"
    ON public.blocked_dates FOR SELECT
    USING (true);

-- Owners can manage blocked dates for their vehicles
CREATE POLICY "Owners can manage blocked dates"
    ON public.blocked_dates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = blocked_dates.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- FAVORITES TABLE POLICIES
-- ============================================================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- DISPUTES TABLE POLICIES
-- ============================================================================

-- Users can view disputes they're involved in
CREATE POLICY "Users can view relevant disputes"
    ON public.disputes FOR SELECT
    USING (
        auth.uid() = reported_by OR
        auth.uid() = reported_against OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create disputes for their bookings
CREATE POLICY "Users can create disputes"
    ON public.disputes FOR INSERT
    WITH CHECK (
        auth.uid() = reported_by AND
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = disputes.booking_id
            AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
        )
    );

-- Admins can update and resolve disputes
CREATE POLICY "Admins can manage disputes"
    ON public.disputes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for messages (chat functionality)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for bookings (for owner dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

