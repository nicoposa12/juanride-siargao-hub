-- Create Admin Account Script
-- This script updates a user account to have admin privileges

-- Update the user to admin role
UPDATE public.users
SET 
    role = 'admin',
    is_verified = true,
    is_active = true,
    updated_at = NOW()
WHERE email = 'webdev15353@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    full_name,
    role,
    is_verified,
    is_active,
    created_at
FROM public.users
WHERE email = 'webdev15353@gmail.com';

