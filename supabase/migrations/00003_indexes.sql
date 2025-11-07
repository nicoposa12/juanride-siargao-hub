-- JuanRide Database Indexes
-- Performance optimization for common queries

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- VEHICLES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_approved ON public.vehicles(is_approved);
CREATE INDEX IF NOT EXISTS idx_vehicles_price_per_day ON public.vehicles(price_per_day);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- Composite index for common vehicle searches
CREATE INDEX IF NOT EXISTS idx_vehicles_approved_status ON public.vehicles(is_approved, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_status ON public.vehicles(type, status);

-- ============================================================================
-- BOOKINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON public.bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_end_date ON public.bookings(end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Composite indexes for availability checks and booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON public.bookings(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_status ON public.bookings(renter_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status ON public.bookings(vehicle_id, status);

-- ============================================================================
-- PAYMENTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- ============================================================================
-- REVIEWS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON public.reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Composite index for vehicle reviews
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_rating ON public.reviews(vehicle_id, rating);

-- ============================================================================
-- MESSAGES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Composite indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_booking_created ON public.messages(booking_id, created_at DESC);

-- ============================================================================
-- MAINTENANCE_LOGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_service_date ON public.maintenance_logs(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON public.maintenance_logs(created_at DESC);

-- ============================================================================
-- FULL TEXT SEARCH INDEXES
-- ============================================================================

-- Vehicle search (description, make, model)
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON public.vehicles 
    USING GIN (to_tsvector('english', 
        COALESCE(description, '') || ' ' || 
        COALESCE(make, '') || ' ' || 
        COALESCE(model, '')
    ));

-- User search (full name, email)
CREATE INDEX IF NOT EXISTS idx_users_search ON public.users 
    USING GIN (to_tsvector('english', 
        COALESCE(full_name, '') || ' ' || 
        COALESCE(email, '')
    ));
