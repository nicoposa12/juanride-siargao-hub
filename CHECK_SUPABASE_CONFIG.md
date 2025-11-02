# Check Supabase Configuration

## The Problem

Login is **hanging** at the `signInWithPassword` call. This means Supabase API is not responding, usually caused by:

1. ❌ Invalid/missing Supabase credentials in `.env.local`
2. ❌ Wrong Supabase URL
3. ❌ Network/connectivity issues
4. ❌ Supabase project is paused/deleted

---

## Step 1: Check .env.local File

Open `.env.local` in your project root and verify:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check These:

✅ **File exists?** Must be in project root: `C:\Users\basco\Desktop\CAPSTONE PROJECT\juanride-siargao-hub\.env.local`

✅ **URL is correct?** Should start with `https://` and end with `.supabase.co`

✅ **Keys are long?** The anon key should be a very long JWT token (100+ characters)

✅ **No quotes?** Values should NOT be in quotes:
```env
# ❌ WRONG
NEXT_PUBLIC_SUPABASE_URL="https://..."

# ✅ CORRECT
NEXT_PUBLIC_SUPABASE_URL=https://...
```

---

## Step 2: Get Fresh Credentials from Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **nicoposa12's Project**
3. Click **Settings** (gear icon) in left sidebar
4. Click **API**
5. Find these values:

### Project URL:
```
https://ezhjnprvzntwzukbtcfl.supabase.co
```

### Project API Keys:
- **anon / public** key (for client-side)
- **service_role** key (for server-side)

---

## Step 3: Update .env.local

Create or update `.env.local` with the fresh values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ezhjnprvzntwzukbtcfl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-here>
```

**IMPORTANT:** After updating `.env.local`:
1. **Stop the dev server** (Ctrl+C in terminal)
2. **Start it again**: `npm run dev`
3. **Hard refresh browser**: Ctrl+Shift+R

---

## Step 4: Test Again

1. Go to http://localhost:3000/login
2. **F12** → **Console** tab
3. **Clear console**
4. Try to login

**Expected console output:**
```
🔐 Starting login...
📧 Signing in with email: nicoposa8@gmail.com
🔑 useAuth.signIn: Calling Supabase auth.signInWithPassword...
🔑 useAuth.signIn: Response received { hasUser: true, hasError: false }
✅ Sign in successful, user ID: abc-123
📥 Fetching profile from database...
✅ Profile loaded: nicoposa8@gmail.com - Role: owner
🚀 Redirecting to: /owner/dashboard
```

**If it times out (after 10 seconds):**
```
🔑 useAuth.signIn: Caught error: Login timeout - check your internet connection
❌ Sign in error: Login timeout - check your internet connection
```

---

## Common Issues

### Issue 1: "Login timeout"
**Cause:** Supabase API not reachable
**Fix:** 
- Check internet connection
- Verify Supabase URL is correct
- Check if Supabase project is paused (reactivate it in dashboard)

### Issue 2: "Invalid API key"
**Cause:** Wrong anon key in `.env.local`
**Fix:**
- Copy fresh anon key from Supabase Dashboard → Settings → API
- Update `.env.local`
- Restart dev server

### Issue 3: "Project not found"
**Cause:** Wrong project URL
**Fix:**
- Verify the URL matches your Supabase project
- Should be: `https://ezhjnprvzntwzukbtcfl.supabase.co`

### Issue 4: Still hangs forever
**Cause:** `.env.local` not loaded or dev server not restarted
**Fix:**
1. Verify `.env.local` is in the project root (not in `src/`)
2. **STOP** dev server (Ctrl+C)
3. **START** dev server: `npm run dev`
4. **Hard refresh** browser: Ctrl+Shift+R

---

## Quick Verification

Run this in browser console (F12) on the login page:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has anon key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

Should show:
```
Supabase URL: https://ezhjnprvzntwzukbtcfl.supabase.co
Has anon key: true
```

If it shows `undefined`, the `.env.local` is not being loaded!

---

## Next Steps

1. ✅ Check `.env.local` exists and has correct values
2. ✅ Restart dev server
3. ✅ Hard refresh browser
4. ✅ Try login again with console open
5. ✅ Screenshot console output and send to me

The console will now show either:
- A timeout error (after 10 seconds)
- Success messages
- A specific error from Supabase

**Let me know what you see!** 🔍

