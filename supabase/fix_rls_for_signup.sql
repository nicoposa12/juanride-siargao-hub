-- Fix RLS policies to allow profile creation during signup

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own profile during signup" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Create a more permissive INSERT policy
-- This allows users to insert their own profile when they match the auth.uid()
CREATE POLICY "Allow users to create their own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also ensure the table has RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

