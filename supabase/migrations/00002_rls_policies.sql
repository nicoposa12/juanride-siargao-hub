-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public can view basic user info for owners"
    ON users FOR SELECT
    USING (role = 'owner' AND is_verified = true);

-- Vehicles policies
CREATE POLICY "Anyone can view approved vehicles"
    ON vehicles FOR SELECT
    USING (is_approved = true AND status != 'inactive');

CREATE POLICY "Owners can view their own vehicles"
    ON vehicles FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own vehicles"
    ON vehicles FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own vehicles"
    ON vehicles FOR DELETE
    USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all vehicles"
    ON vehicles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings (renter)"
    ON bookings FOR SELECT
    USING (auth.uid() = renter_id);

CREATE POLICY "Owners can view bookings for their vehicles"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = bookings.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Renters can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Renters can update their own pending/confirmed bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = renter_id AND status IN ('pending', 'confirmed'));

CREATE POLICY "Owners can update bookings for their vehicles"
    ON bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = bookings.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all bookings"
    ON bookings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Payments policies
CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = payments.booking_id
            AND bookings.renter_id = auth.uid()
        )
    );

CREATE POLICY "Owners can view payments for their vehicles"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            JOIN vehicles ON bookings.vehicle_id = vehicles.id
            WHERE bookings.id = payments.booking_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "System can create payments"
    ON payments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can manage all payments"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews"
    ON reviews FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Users can view their own reviews"
    ON reviews FOR SELECT
    USING (auth.uid() = reviewer_id);

CREATE POLICY "Owners can view reviews for their vehicles"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = reviews.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Renters can create reviews for completed bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.renter_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews within 48 hours"
    ON reviews FOR UPDATE
    USING (
        auth.uid() = reviewer_id
        AND created_at > NOW() - INTERVAL '48 hours'
    );

CREATE POLICY "Owners can respond to reviews on their vehicles"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = reviews.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        owner_response IS NOT NULL
        OR owner_response_at IS NOT NULL
    );

CREATE POLICY "Admins can manage all reviews"
    ON reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Maintenance logs policies
CREATE POLICY "Owners can view maintenance for their vehicles"
    ON maintenance_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can create maintenance logs"
    ON maintenance_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their vehicle maintenance logs"
    ON maintenance_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete their vehicle maintenance logs"
    ON maintenance_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = maintenance_logs.vehicle_id
            AND vehicles.owner_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages for their bookings"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = messages.booking_id
            AND (bookings.renter_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM vehicles
                    WHERE vehicles.id = bookings.vehicle_id
                    AND vehicles.owner_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can send messages for their bookings"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = messages.booking_id
            AND (bookings.renter_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM vehicles
                    WHERE vehicles.id = bookings.vehicle_id
                    AND vehicles.owner_id = auth.uid()
                ))
        )
    );

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

