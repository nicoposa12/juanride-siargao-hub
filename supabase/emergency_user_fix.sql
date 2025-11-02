-- Emergency fix: Manually sync the specific user that's trying to login
-- Run this in Supabase SQL Editor

-- First, let's see what we have in auth.users
SELECT 'Auth Users' as table_name, id, email, raw_user_meta_data FROM auth.users;

-- Then, let's see what we have in public.users
SELECT 'Public Users' as table_name, id, email, full_name, role FROM public.users;

-- Now sync any missing users
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN au.email = 'canedokimoy@gmail.com' THEN 'Caned Okimoy'
      WHEN au.email = 'nicoposa8@gmail.com' THEN 'Nico Mar Oposa'
      ELSE 'User'
    END
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    CASE
      WHEN au.email = 'nicoposa8@gmail.com' THEN 'owner'::user_role
      ELSE 'renter'::user_role
    END
  ) as role,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Verify the fix
SELECT 'VERIFICATION - All users should now be synced:' as status;
SELECT id, email, full_name, role, created_at FROM public.users ORDER BY created_at DESC;

