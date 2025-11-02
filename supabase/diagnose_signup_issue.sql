-- Complete diagnostic query for signup issues
-- Run this in Supabase SQL Editor and send me the results

-- 1. Check if enum types exist
SELECT 'Enum Types' as check_type, typname as name, 'EXISTS' as status
FROM pg_type
WHERE typname IN ('user_role', 'vehicle_type', 'booking_status')
ORDER BY typname;

-- 2. Check if users table exists and its structure
SELECT 'Users Table Structure' as check_type, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check if trigger exists
SELECT 'Trigger Status' as check_type,
       trigger_name,
       event_manipulation,
       event_object_table,
       action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check if trigger function exists
SELECT 'Function Status' as check_type,
       routine_name,
       routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 5. Check RLS status on users table
SELECT 'RLS Status' as check_type,
       schemaname,
       tablename,
       CASE rowsecurity
         WHEN true THEN 'ENABLED'
         ELSE 'DISABLED'
       END as rls_status
FROM pg_tables
WHERE tablename = 'users';

-- 6. Check all policies on users table
SELECT 'Policies on Users' as check_type,
       policyname,
       cmd as command,
       permissive,
       roles
FROM pg_policies
WHERE tablename = 'users';

-- 7. Test manual insert (will fail but show the error)
DO $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    gen_random_uuid(),
    'diagnostic_test@example.com',
    'Diagnostic Test',
    'renter'::user_role
  );
  
  -- Clean up immediately
  DELETE FROM public.users WHERE email = 'diagnostic_test@example.com';
  
  RAISE NOTICE '✅ Manual insert test PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Manual insert test FAILED: %', SQLERRM;
END $$;

