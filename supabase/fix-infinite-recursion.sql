-- Fix: Infinite Recursion in RLS Policies
-- This script removes the problematic recursive policy and replaces it with working ones

-- ============================================================================
-- STEP 1: Remove ALL existing policies on users table
-- ============================================================================
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Allow public read access to user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all user profiles" ON public.users;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- Policy 1: Anyone can read user profiles (for displaying names, etc.)
CREATE POLICY "Anyone can view user profiles"
ON public.users FOR SELECT
USING (true);

-- Policy 2: Users can insert their own profile (for signup)
CREATE POLICY "Users can create their own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
    'Your user profile:' as info,
    id,
    email,
    role,
    is_active,
    is_verified
FROM public.users
WHERE id = auth.uid();

SELECT 'All policies fixed! You should be able to login now.' as status;

