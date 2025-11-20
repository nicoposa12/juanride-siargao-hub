-- ============================================================================
-- FIX ADMIN USER STATUS UPDATES
-- ============================================================================
-- Problem: RLS policies are blocking admin from updating user status
-- Solution: Add proper admin override policies for user updates
-- ============================================================================

-- Remove the problematic active users update policy
DROP POLICY IF EXISTS "Active users update profile v2" ON public.users;

-- Create a proper policy that allows:
-- 1. Active users to update their own profile
-- 2. Admins to update any user profile (including status changes)
CREATE POLICY "Users and admins can update profiles"
    ON public.users FOR UPDATE
    USING (
        -- User updating their own profile (and they're active)
        (auth.uid() = id AND is_active = true)
        OR
        -- Admin can update any profile (including deactivation)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
        OR
        -- Fallback: Check if user has admin role in database
        -- (Use a direct auth check to avoid circular dependency)
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role = 'admin' AND is_active = true
            LIMIT 1  -- Limit to avoid performance issues
        )
    );

-- Ensure we have a simple, working SELECT policy
DROP POLICY IF EXISTS "Temp admin access" ON public.users;
DROP POLICY IF EXISTS "Admin view users simple" ON public.users;

-- Create a comprehensive SELECT policy
CREATE POLICY "Users can view profiles with admin override"
    ON public.users FOR SELECT
    USING (
        -- Allow all authenticated users to view profiles (original behavior)
        auth.uid() IS NOT NULL
    );

-- ============================================================================
-- CLEANUP OTHER PROBLEMATIC POLICIES
-- ============================================================================

-- Remove any other conflicting policies from previous migrations
DROP POLICY IF EXISTS "Active users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Active users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin view all users v2" ON public.users;

-- ============================================================================
-- VERIFY CURRENT POLICIES
-- ============================================================================

-- Check current policies (commented for production)
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as check_clause
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
*/

-- ============================================================================
-- EMERGENCY FALLBACK
-- ============================================================================

-- If the above policies still don't work, we can temporarily disable RLS
-- UNCOMMENT ONLY IF ABSOLUTELY NECESSARY:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after fixing:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
