-- JuanRide Seed Data - Vehicles Only
-- Run this AFTER you've created test users through signup

-- ============================================================================
-- IMPORTANT: Before running this, create test users via signup:
-- 1. Sign up as an owner: owner@test.com
-- 2. Sign up as a renter: renter@test.com
-- 3. Get their UUIDs from the users table
-- 4. Replace the UUIDs below with actual user IDs
-- ============================================================================

-- Example: Get user IDs (run this first to get actual UUIDs)
-- SELECT id, email, role FROM public.users;

-- ============================================================================
-- SAMPLE VEHICLES
-- Replace 'YOUR-OWNER-UUID-HERE' with actual owner user ID
-- ============================================================================

-- Uncomment and replace the owner_id with actual UUID from your signup:

/*
INSERT INTO public.vehicles (
    owner_id, type, make, model, year, plate_number, description,
    price_per_day, price_per_week, price_per_month, status, location,
    image_urls, features, is_approved
) VALUES
    (
        'YOUR-OWNER-UUID-HERE', -- Replace with actual owner UUID
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
        'General Luna',
        ARRAY['https://via.placeholder.com/800x600?text=Honda+Click+125'],
        '{"helmet_included": true, "phone_holder": true, "storage_box": true, "gps_enabled": false}'::jsonb,
        true
    ),
    (
        'YOUR-OWNER-UUID-HERE', -- Replace with actual owner UUID
        'motorcycle',
        'Yamaha',
        'NMAX 155',
        2023,
        'XYZ5678',
        'Comfortable Yamaha NMAX 155, great for longer trips around the island.',
        800.00,
        5000.00,
        18000.00,
        'available',
        'Cloud 9',
        ARRAY['https://via.placeholder.com/800x600?text=Yamaha+NMAX'],
        '{"helmet_included": true, "phone_holder": true, "usb_charging": true}'::jsonb,
        true
    ),
    (
        'YOUR-OWNER-UUID-HERE', -- Replace with actual owner UUID
        'car',
        'Toyota',
        'Vios',
        2022,
        'DEF9012',
        'Clean Toyota Vios, air-conditioned, perfect for families or groups.',
        2500.00,
        15000.00,
        50000.00,
        'available',
        'General Luna',
        ARRAY['https://via.placeholder.com/800x600?text=Toyota+Vios'],
        '{"bluetooth": true, "usb_charging": true}'::jsonb,
        true
    );
*/

-- ============================================================================
-- INSTRUCTIONS TO USE THIS FILE:
-- ============================================================================
-- 1. Create test users via signup (http://localhost:3000/signup)
--    - Create an owner account
--    - Create a renter account
-- 
-- 2. Get the user IDs by running this query:
--    SELECT id, email, role FROM public.users;
--
-- 3. Copy the owner's UUID
--
-- 4. Uncomment the INSERT statement above
--
-- 5. Replace all 'YOUR-OWNER-UUID-HERE' with the actual UUID
--
-- 6. Run this SQL file
-- ============================================================================

