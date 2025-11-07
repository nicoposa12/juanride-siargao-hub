-- Verify admin account
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

-- If the role is NOT 'admin', run this:
-- UPDATE public.users
-- SET role = 'admin', is_verified = true, is_active = true
-- WHERE email = 'webdev15353@gmail.com';

