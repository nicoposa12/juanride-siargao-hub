-- Diagnostic query to check if auth.users are synced to public.users
-- Run this in Supabase Dashboard → SQL Editor to see sync status

-- Check all users and their sync status
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as auth_full_name,
  au.raw_user_meta_data->>'role' as auth_role,
  au.created_at as auth_created_at,
  pu.id IS NOT NULL as has_profile,
  pu.full_name as profile_full_name,
  pu.role as profile_role,
  pu.created_at as profile_created_at,
  CASE 
    WHEN pu.id IS NULL THEN '❌ MISSING PROFILE - Need to run migration 00004'
    ELSE '✅ Synced'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- Count summary
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(pu.id) as synced_users,
  COUNT(*) - COUNT(pu.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;

