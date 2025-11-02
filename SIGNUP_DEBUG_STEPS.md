# Debug Signup Error - Step by Step

## The Problem
Getting "500 Internal Server Error" when signing up means the database trigger is failing and rolling back the entire transaction.

## Step 1: Verify Trigger Exists

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:** Should return 1 row showing the trigger  
**If empty:** The trigger didn't get created - need to run migration 00003 again

---

## Step 2: Check Supabase Logs for Actual Error

1. In Supabase Dashboard, click **Logs** in the left sidebar
2. Click **Postgres Logs**  
3. Look for recent errors (last few minutes)
4. Screenshot any error messages you see

Common errors:
- `type "user_role" does not exist` - Enum type wasn't created
- `permission denied for table users` - RLS blocking the insert
- `duplicate key value violates unique constraint` - User already exists

---

## Step 3: Test Trigger Manually

Run this in SQL Editor to test if the trigger function works:

```sql
-- Test the trigger function directly
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Manually call the trigger function with test data
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    test_id,
    'test@example.com',
    'Test User',
    'renter'::user_role
  );
  
  -- Clean up
  DELETE FROM public.users WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: Manual insert worked!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;
```

**Expected:** Should show "SUCCESS: Manual insert worked!"  
**If error:** Shows what's actually failing

---

## Step 4: Run Improved Trigger (If needed)

If the trigger is failing, run this improved version:

1. Copy ALL contents of `supabase/migrations/00003_auth_trigger_v2.sql`
2. Paste in SQL Editor
3. Run it

This version has:
- Better error handling
- Proper permissions
- More permissive RLS policy for inserts

---

## Step 5: Try Signup Again

1. Go to http://localhost:3001/signup
2. Fill in details
3. Try to create account

**Check browser console (F12):**
- Look for any new error messages
- Check Network tab for the actual response from Supabase

---

## Quick Fix (Nuclear Option)

If nothing works, temporarily disable RLS on users table:

```sql
-- TEMPORARY - Just for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Try signup again. If it works, the problem is RLS policies.

Then re-enable RLS:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

And add this simple INSERT policy:
```sql
CREATE POLICY "Allow inserts during signup"
  ON users
  FOR INSERT
  WITH CHECK (true);
```

---

## What To Do Next

1. Run Step 1 to check if trigger exists
2. Run Step 2 to see actual error in Supabase logs
3. Send me the error message you find
4. I'll give you the exact fix based on the error

**Most likely causes:**
1. ✅ Trigger doesn't exist (migration 00003 didn't run properly)
2. ✅ Enum type `user_role` doesn't exist (migration 00001 didn't run)
3. ✅ RLS is blocking the insert
4. ✅ Permissions issue with the trigger function

Let me know what you find in the logs!

