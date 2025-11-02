-- ================================================================
-- COMPLETE LOGIN FIX - Run this ENTIRE script in Supabase SQL Editor
-- This fixes: user sync, RLS policies, and all login issues
-- ================================================================

-- STEP 1: Show current state
SELECT '========== CURRENT STATE ==========' as step;

SELECT 'Auth Users (from Supabase Auth):' as info, id, email, raw_user_meta_data 
FROM auth.users 
ORDER BY created_at DESC;

SELECT 'Public Users (from our database):' as info, id, email, full_name, role 
FROM public.users 
ORDER BY created_at DESC;

-- STEP 2: Sync all auth users to public.users
SELECT '========== SYNCING USERS ==========' as step;

INSERT INTO public.users (id, email, full_name, role, created_at, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    CASE 
      WHEN au.email LIKE '%nicoposa%' THEN 'Nico Mar Oposa'
      WHEN au.email LIKE '%caned%' THEN 'Caned Okimoy'
      WHEN au.email LIKE '%borjaclan%' THEN 'Carl'
      ELSE SPLIT_PART(au.email, '@', 1)
    END
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    CASE
      WHEN au.email LIKE '%nicoposa%' THEN 'owner'::user_role
      ELSE 'renter'::user_role
    END
  ) as role,
  au.created_at,
  true as is_active
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(users.full_name, ''), EXCLUDED.full_name),
  updated_at = NOW();

-- STEP 3: Fix RLS policies for SELECT (reading profiles)
SELECT '========== FIXING RLS POLICIES ==========' as step;

-- Drop old SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Public can view basic user info for owners" ON users;

-- Create proper SELECT policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can view owner profiles"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (role = 'owner');

-- STEP 4: Fix INSERT policy (for signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile during signup" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- STEP 5: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify everything
SELECT '========== VERIFICATION ==========' as step;

SELECT 'Synced Users (should match auth.users):' as info, 
       id, email, full_name, role, is_active, created_at 
FROM public.users 
ORDER BY created_at DESC;

SELECT 'RLS Policies:' as info,
       policyname,
       cmd as command,
       roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

SELECT '========== SUCCESS! ==========' as step;
SELECT 'All users synced and RLS policies fixed. Try logging in now!' as message;

