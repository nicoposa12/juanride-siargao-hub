-- Fix RLS policies to allow profile reading during login
-- The 406 errors suggest SELECT is being blocked

-- Check current SELECT policies
SELECT 'Current SELECT Policies:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Drop and recreate SELECT policies with proper permissions
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Public can view basic user info for owners" ON users;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow public to view owner profiles (for listings)
CREATE POLICY "Public can view basic user info for owners"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (role = 'owner' AND is_verified = true);

-- Verify policies were created
SELECT 'New SELECT Policies:' as info;
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';

