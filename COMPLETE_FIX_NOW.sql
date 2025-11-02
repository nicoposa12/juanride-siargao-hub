-- COMPLETE FIX: Run this ENTIRE script in Supabase SQL Editor
-- This will fix ALL authentication and signup issues

-- ============================================
-- STEP 1: Sync all existing auth users
-- ============================================
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'owner'::user_role) as role,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Fix RLS policies for INSERT
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can create their own profile during signup" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON users;

-- Create proper INSERT policy
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: Verify everything worked
-- ============================================

-- Show all users that were synced
SELECT 
  'Synced Users' as check_type,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Show current RLS policies
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;

