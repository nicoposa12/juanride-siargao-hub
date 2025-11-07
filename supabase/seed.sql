-- JuanRide Seed Data
-- Sample data for development and testing

-- Note: In production, you'll need actual auth.users first
-- This seed assumes you have test users created via Supabase Auth

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================
-- These would normally be created via Supabase Auth signup
-- For testing, insert directly (requires service role)

-- Sample Admin User (UUID: '00000000-0000-0000-0000-000000000001')
INSERT INTO public.users (id, email, full_name, phone_number, role, is_verified, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@juanride.com', 'Admin User', '+639171234567', 'admin', true, true)
ON CONFLICT (id) DO NOTHING;

-- Sample Owner Users
INSERT INTO public.users (id, email, full_name, phone_number, role, is_verified, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'maria@owner.com', 'Maria Santos', '+639181234567', 'owner', true, true),
    ('00000000-0000-0000-0000-000000000003', 'juan@owner.com', 'Juan Dela Cruz', '+639191234567', 'owner', true, true)
ON CONFLICT (id) DO NOTHING;

-- Sample Renter Users
INSERT INTO public.users (id, email, full_name, phone_number, role, is_verified, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000004', 'alex@tourist.com', 'Alex Johnson', '+1234567890', 'renter', true, true),
    ('00000000-0000-0000-0000-000000000005', 'sarah@tourist.com', 'Sarah Lee', '+1234567891', 'renter', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE VEHICLES
-- ============================================================================
INSERT INTO public.vehicles (
    id, owner_id, type, make, model, year, plate_number, description,
    price_per_day, price_per_week, price_per_month, status, location,
    image_urls, features, transmission, fuel_type, is_approved
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'scooter',
        'Honda',
        'Click 125',
        2023,
        'ABC1234',
        'Well-maintained Honda Click 125, perfect for exploring Siargao. Includes helmet and lock.',
        500.00,
        3000.00,
        10000.00,
        'available',
        'General Luna, Siargao',
        ARRAY['https://example.com/click125-1.jpg', 'https://example.com/click125-2.jpg'],
        '{"helmet": true, "lock": true, "phone_holder": false}',
        'automatic',
        'gasoline',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'motorcycle',
        'Yamaha',
        'Mio i 125',
        2022,
        'DEF5678',
        'Reliable Yamaha Mio for daily commuting. Fuel-efficient and easy to ride.',
        450.00,
        2800.00,
        9000.00,
        'available',
        'Cloud 9, Siargao',
        ARRAY['https://example.com/mio-1.jpg'],
        '{"helmet": true, "lock": true, "phone_holder": true}',
        'automatic',
        'gasoline',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        'car',
        'Toyota',
        'Wigo',
        2021,
        'GHI9012',
        'Spacious Toyota Wigo, perfect for families or groups. Air-conditioned comfort.',
        2500.00,
        15000.00,
        50000.00,
        'available',
        'General Luna, Siargao',
        ARRAY['https://example.com/wigo-1.jpg', 'https://example.com/wigo-2.jpg'],
        '{"air_conditioning": true, "seats": 5, "bluetooth": true}',
        'manual',
        'gasoline',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000003',
        'van',
        'Toyota',
        'Hiace',
        2020,
        'JKL3456',
        'Large van for group tours and island hopping. Seats up to 12 passengers.',
        4000.00,
        24000.00,
        80000.00,
        'available',
        'Dapa, Siargao',
        ARRAY['https://example.com/hiace-1.jpg'],
        '{"air_conditioning": true, "seats": 12, "luggage_space": true}',
        'manual',
        'diesel',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE BOOKINGS
-- ============================================================================
INSERT INTO public.bookings (
    id, renter_id, vehicle_id, owner_id, start_date, end_date,
    total_price, status, pickup_location, special_requests
) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        CURRENT_DATE + INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '6 days',
        1500.00,
        'confirmed',
        'General Luna Tourism Office',
        'Arriving at 2 PM'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '14 days',
        17500.00,
        'pending',
        'General Luna',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE PAYMENTS
-- ============================================================================
INSERT INTO public.payments (
    id, booking_id, amount, payment_method, status, transaction_id
) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        1500.00,
        'gcash',
        'paid',
        'GCASH123456789'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000002',
        17500.00,
        'card',
        'pending',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE REVIEWS
-- ============================================================================
INSERT INTO public.reviews (
    id, booking_id, reviewer_id, vehicle_id, owner_id,
    rating, comment, cleanliness_rating, condition_rating, value_rating, communication_rating
) VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        5,
        'Excellent scooter! Maria was very responsive and helpful. Highly recommend!',
        5,
        5,
        5,
        5
    )
ON CONFLICT (booking_id, reviewer_id) DO NOTHING;

-- ============================================================================
-- SAMPLE NOTIFICATIONS
-- ============================================================================
INSERT INTO public.notifications (
    user_id, type, title, message, link, is_read
) VALUES
    (
        '00000000-0000-0000-0000-000000000002',
        'booking',
        'New Booking Request',
        'Alex Johnson has requested to book your Honda Click 125',
        '/owner/bookings/20000000-0000-0000-0000-000000000001',
        false
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'booking',
        'Booking Confirmed',
        'Your booking for Honda Click 125 has been confirmed!',
        '/dashboard/bookings/20000000-0000-0000-0000-000000000001',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE FAVORITES
-- ============================================================================
INSERT INTO public.favorites (user_id, vehicle_id) VALUES
    ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003'),
    ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- ============================================================================
-- SAMPLE MAINTENANCE LOGS
-- ============================================================================
INSERT INTO public.maintenance_logs (
    vehicle_id, service_type, service_date, description, cost, service_provider, next_service_date
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Oil Change',
        CURRENT_DATE - INTERVAL '15 days',
        'Regular oil change and filter replacement',
        350.00,
        'Siargao Moto Shop',
        CURRENT_DATE + INTERVAL '75 days'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Tire Replacement',
        CURRENT_DATE - INTERVAL '30 days',
        'Replaced front tires',
        3500.00,
        'General Luna Auto',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE BLOCKED DATES
-- ============================================================================
INSERT INTO public.blocked_dates (vehicle_id, start_date, end_date, reason) VALUES
    (
        '10000000-0000-0000-0000-000000000002',
        CURRENT_DATE + INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '22 days',
        'Personal use - family trip'
    )
ON CONFLICT (id) DO NOTHING;

