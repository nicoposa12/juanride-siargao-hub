-- Check user role in database
-- Run this in your Supabase SQL editor to verify the user exists and their role

SELECT 
    id,
    email,
    full_name,
    role,
    is_verified,
    is_active,
    created_at,
    updated_at
FROM public.users
WHERE email = 'carlisteinhorejas@gmail.com';

-- If the user doesn't exist or has wrong role, run:
-- INSERT INTO public.users (id, email, full_name, role, is_verified, is_active)
-- VALUES (
--     '32b20dc3-7b2e-42e8-ab2d-475dc24a040b',  -- Replace with actual user ID from auth.users
--     'carlisteinhorejas@gmail.com',
--     'Your Full Name',
--     'owner',  -- or 'admin' depending on what you want
--     true,
--     true
-- )
-- ON CONFLICT (id) DO UPDATE SET
--     role = EXCLUDED.role,
--     is_verified = EXCLUDED.is_verified,
--     updated_at = NOW();
