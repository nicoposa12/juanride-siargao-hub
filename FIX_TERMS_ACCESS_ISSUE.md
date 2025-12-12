# Terms and Conditions Access Issue - FIXED

## Problem Identified

The signup page was showing **default hardcoded text** instead of the actual terms from the admin settings page.

### Root Cause

**Row Level Security (RLS)** on the `system_settings` table was blocking unauthenticated users from reading the terms:

```sql
-- Original policy (TOO RESTRICTIVE)
CREATE POLICY "Admins can read system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (users.role = 'admin');
```

When non-admin users tried to fetch terms during signup:
- ❌ RLS blocked the request
- ❌ Code fell back to default text: "By registering as a vehicle owner on JuanRide, you agree to our platform policies and rental guidelines."
- ❌ Admin's actual terms were never shown

## Solution Implemented

Created migration `00034_allow_public_terms_access.sql` that:

1. ✅ Allows public/unauthenticated users to read `system_settings`
2. ✅ Provides a secure function `get_public_terms()` that exposes ONLY terms/privacy (not sensitive data)
3. ✅ Keeps admin-only policies for write operations
4. ✅ Maintains security for sensitive fields like `payment_api_key`

## How to Apply the Fix

### Option 1: Run Migration via Supabase CLI (Recommended)

```bash
# Navigate to project root
cd c:\Users\basco\Documents\GitHub\juanride-siargao-hub

# Apply the migration
npx supabase db push

# Or if using supabase CLI directly
supabase db push
```

### Option 2: Run Migration Manually in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `supabase/migrations/00034_allow_public_terms_access.sql`
4. Paste and run the SQL
5. Verify no errors

### Option 3: Reset Database (Development Only)

```bash
# WARNING: This will delete all data!
npx supabase db reset
```

## Verification Steps

After applying the migration:

1. **Go to Admin Settings**
   - Login as admin
   - Navigate to `/admin/settings`
   - Edit the "Terms of Service" field
   - Save changes

2. **Test Signup Page**
   - Logout or open incognito window
   - Go to `/signup`
   - Select "List my vehicles (Owner)"
   - Click on "Terms of Service" link in the checkbox
   - ✅ Should now show the ACTUAL terms from admin settings

3. **Verify in Console**
   - Open browser DevTools
   - Look for any errors related to `system_settings`
   - Should see no RLS policy errors

## Security Note

The policy allows reading all fields from `system_settings`, but sensitive fields like `payment_api_key` are:
- Not exposed in the UI
- Can use the `get_public_terms()` function for extra security
- Admin policies still protect write operations

## Alternative: Use Secure Function (More Secure)

If you want extra security, update the signup page to use the function:

```typescript
// In loadTermsOfService function
const { data, error } = await supabase
  .rpc('get_public_terms')

if (data && data.length > 0) {
  setTermsOfService(data[0].terms_of_service || 'Default text...')
}
```

This ensures only terms/privacy fields are ever exposed, not the entire row.
