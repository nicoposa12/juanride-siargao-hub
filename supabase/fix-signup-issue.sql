-- Fix Signup Issue - Allow trigger to create user profiles
-- Run this in Supabase SQL Editor

-- ============================================================================
-- FIX 1: Update the user profile creation policy
-- ============================================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a new policy that allows both user self-insert AND service role insert
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (
        auth.uid() = id 
        OR 
        auth.role() = 'service_role'
    );

-- ============================================================================
-- FIX 2: Ensure the trigger function bypasses RLS properly
-- ============================================================================

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This makes it run with the privileges of the function owner
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_active, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'renter'),
        true,
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the auth signup
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX 3: Grant necessary permissions
-- ============================================================================

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on users table
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;

