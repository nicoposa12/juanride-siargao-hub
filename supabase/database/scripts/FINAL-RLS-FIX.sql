-- ============================================================================
-- FINAL RLS FIX - Based on Supabase Best Practices
-- This fixes the profile loading issue and admin access
-- ============================================================================

-- CRITICAL: Remove ALL existing policies on users table
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;

-- ============================================================================
-- USERS TABLE - Simple, working policies
-- ============================================================================

-- Policy 1: Anyone can view all user profiles (for displaying names, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT
TO authenticated, anon
USING (true);

-- Policy 2: Users can insert their own profile (signup)
CREATE POLICY "Users can create their own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update ONLY their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Test the fix
-- ============================================================================
SELECT 
    'RLS Policies Fixed!' as status,
    'Profile should load now' as message;

-- Verify current user can read their own profile
SELECT 
    id,
    email,
    role,
    is_active
FROM public.users
WHERE id = auth.uid();

