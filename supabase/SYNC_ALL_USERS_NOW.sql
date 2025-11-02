-- SYNC ALL AUTH USERS TO PUBLIC.USERS
-- Run this in Supabase SQL Editor RIGHT NOW

-- First, show what we're about to sync
SELECT 'Users in auth.users (will be synced):' as info;
SELECT id, email, raw_user_meta_data, created_at FROM auth.users;

-- Sync ALL users from auth.users to public.users
INSERT INTO public.users (id, email, full_name, role, is_active, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    -- Fallback: use email username as full_name
    SPLIT_PART(au.email, '@', 1)
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    'renter'::user_role  -- Default to renter if not specified
  ) as role,
  true as is_active,
  au.created_at
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(users.full_name, ''), EXCLUDED.full_name),
  role = COALESCE(users.role, EXCLUDED.role),
  updated_at = NOW();

-- Verify sync worked
SELECT 'Users now in public.users (after sync):' as info;
SELECT id, email, full_name, role, is_active, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- Count verification
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users) 
    THEN '✅ ALL USERS SYNCED!'
    ELSE '❌ SYNC INCOMPLETE - Check errors above'
  END as sync_status;

