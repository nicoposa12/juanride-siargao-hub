-- Sync existing auth.users to public.users table
-- This handles any users that were created before the trigger was added

INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'renter'::user_role) as role,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);

