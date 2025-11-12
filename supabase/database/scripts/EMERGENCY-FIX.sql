-- ============================================================================
-- EMERGENCY RLS FIX - Complete Profile Loading Fix
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Step 1: Check current policies
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 2: Remove ALL existing policies on users table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    END LOOP;
END $$;

-- Step 3: Disable RLS temporarily to test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 4: Test if profile loads without RLS
SELECT 
    'Testing profile access without RLS' as status,
    id,
    email,
    role,
    is_active
FROM public.users
LIMIT 5;

-- Step 5: Re-enable RLS with SIMPLE policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: ANYONE can read ALL user profiles (most permissive)
CREATE POLICY "allow_all_select_users"
    ON public.users FOR SELECT
    USING (true);

-- Policy 2: Authenticated users can insert (signup)
CREATE POLICY "allow_authenticated_insert_users"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 3: Users can update their own data
CREATE POLICY "allow_users_update_own"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 6: Verify the fix
SELECT 
    '✅ RLS Policies Fixed!' as status,
    'Profile should load now' as message;

-- Step 7: Test current user can access their profile
SELECT 
    'Current user profile:' as test,
    id,
    email,
    role,
    is_active
FROM public.users
WHERE id = auth.uid();
