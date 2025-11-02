# 🚀 JuanRide Quick Start

Get up and running in 10 minutes!

## ✅ Quick Setup Checklist

### 1️⃣ Create Supabase Project (2 minutes)
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: `juanride-dev`
- [ ] Region: Singapore (Southeast Asia)
- [ ] Create strong password (save it!)
- [ ] Wait for project creation

### 2️⃣ Run Database Migrations (2 minutes)
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy entire `supabase/migrations/00001_initial_schema.sql`
- [ ] Paste and Run in SQL Editor ✅
- [ ] Copy entire `supabase/migrations/00002_rls_policies.sql`
- [ ] Paste and Run in SQL Editor ✅
- [ ] Verify: Table Editor should show 9 tables

### 3️⃣ Create Storage Buckets (2 minutes)
- [ ] Go to Storage → Create new bucket
- [ ] Create `vehicle-images` (Public: ✅)
- [ ] Create `profile-images` (Public: ✅)
- [ ] Create `review-images` (Public: ✅)

### 4️⃣ Configure Environment Variables (1 minute)
- [ ] Go to Settings → API in Supabase
- [ ] Copy Project URL
- [ ] Copy anon public key
- [ ] Copy service_role key
- [ ] Update `.env.local` with your credentials

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5️⃣ Enable Authentication (1 minute)
- [ ] Go to Authentication → Providers
- [ ] Enable "Email" provider
- [ ] Enable "Confirm email" (optional)
- [ ] Save

### 6️⃣ Start the App (1 minute)
```bash
npm run dev
```
- [ ] Open http://localhost:3000
- [ ] Click "Get Started" → Sign up
- [ ] Create an owner account
- [ ] Add some vehicles!

## 🎯 You're All Set!

Your JuanRide platform is now running locally with:
- ✅ Full database with 9 tables
- ✅ Row Level Security enabled
- ✅ Image upload ready
- ✅ Authentication working
- ✅ All features functional

## 🧪 Quick Test

1. **Sign up** as an owner → Add a vehicle listing
2. **Sign up** as a renter (different email) → Search and book
3. **Test chat** → Message between renter and owner
4. **Leave a review** → After completing a booking

## 📚 Detailed Guides

- **Full database setup**: See `DATABASE_SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Features**: See `docs/features.md`

## 🆘 Common Issues

**"Can't connect to database"**
→ Check `.env.local` has correct Supabase credentials

**"No vehicles showing"**
→ Create a vehicle listing as an owner, or run sample data SQL from `DATABASE_SETUP.md`

**"Images not uploading"**
→ Make sure storage buckets are created and set to public

**Need more help?** Check `DATABASE_SETUP.md` for detailed troubleshooting.

---

**Happy coding!** 🎉

