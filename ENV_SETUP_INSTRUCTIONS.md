# 🔧 Environment Setup Instructions

## The Problem

You're getting a **"Login timeout"** error because your Supabase configuration is missing!

The app needs a `.env.local` file with your Supabase credentials to connect to the database.

---

## ✅ Solution: Create `.env.local` File

### Step 1: Create the File

In the root of your project (`C:\Users\basco\Desktop\CAPSTONE PROJECT\juanride-siargao-hub`), create a new file named exactly:

```
.env.local
```

**Important:** 
- The file name starts with a dot (`.`)
- No file extension after `.local`
- Must be in the project root, NOT in the `src` folder

### Step 2: Get Your Supabase Credentials

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (⚙️ gear icon) in the left sidebar
4. Click **API**
5. You'll see these values:

   - **Project URL**: Copy the URL (should start with `https://` and end with `.supabase.co`)
   - **Project API keys**:
     - **anon / public** key: Copy this long token (starts with `eyJ...`)
     - **service_role** key: Copy this long token (starts with `eyJ...`)

### Step 3: Paste Into `.env.local`

Copy and paste this template into your new `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ezhjnprvzntwzukbtcfl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace:**
- `paste-your-anon-key-here` with your actual anon key from Supabase
- `paste-your-service-role-key-here` with your actual service_role key from Supabase

**Important:**
- ❌ Do NOT use quotes around the values
- ❌ Do NOT add spaces before or after the `=`
- ✅ Keep the URL as shown (from your docs: `https://ezhjnprvzntwzukbtcfl.supabase.co`)

### Step 4: Restart Everything

After creating `.env.local`:

1. **Stop the dev server** (press `Ctrl+C` in the terminal)
2. **Start it again**: 
   ```bash
   npm run dev
   ```
3. **Hard refresh your browser**: Press `Ctrl+Shift+R` (or `Ctrl+F5`)

### Step 5: Try Login Again

1. Go to http://localhost:3000/login
2. Open browser console (`F12` → Console tab)
3. Clear the console
4. Try to login

**You should now see:**
```
🔑 useAuth.signIn: Calling Supabase auth.signInWithPassword...
🔗 Supabase URL: https://ezhjnprvzntwzukbtcfl.supabase.co
✅ Sign in successful
```

---

## ❓ Troubleshooting

### Issue: Still getting timeout error

**Check:**
1. ✅ Is `.env.local` in the project root? (Not in `src/` folder)
2. ✅ Did you restart the dev server after creating the file?
3. ✅ Did you hard refresh the browser?
4. ✅ Are the keys copied correctly (very long strings starting with `eyJ`)?

### Issue: "Supabase configuration missing" error

This means the `.env.local` file is not being loaded. Make sure:
- File name is exactly `.env.local` (not `.env.local.txt`)
- File is in the project root
- Dev server was restarted

### Issue: "Invalid API key" error

- Your anon key is incorrect
- Go back to Supabase Dashboard → Settings → API
- Copy the fresh anon key
- Update `.env.local`
- Restart dev server

### Issue: Still times out after 30 seconds

This means:
- Your Supabase project might be paused (check the dashboard)
- The project URL is wrong
- Your Supabase project was deleted

---

## 🎯 Quick Verification

After creating `.env.local` and restarting, run this in the browser console on the login page:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has anon key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

**Expected output:**
```
Supabase URL: https://ezhjnprvzntwzukbtcfl.supabase.co
Has anon key: true
```

**If you see `undefined`:**
- The `.env.local` file is not loaded
- Check file name and location
- Restart dev server

---

## 📝 Summary

**The error happens because:**
- ❌ No `.env.local` file exists
- ❌ Supabase client has no URL or API key
- ❌ Authentication call hangs forever
- ❌ Timeout triggers after 30 seconds

**The fix:**
- ✅ Create `.env.local` in project root
- ✅ Add Supabase URL and API keys
- ✅ Restart dev server
- ✅ Hard refresh browser
- ✅ Try login again

---

**Need help finding your Supabase credentials? Check the `CHECK_SUPABASE_CONFIG.md` file for more details!**

