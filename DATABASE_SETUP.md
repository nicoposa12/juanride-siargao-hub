# JuanRide Database Setup Guide

Follow these steps to set up your Supabase database for JuanRide.

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Enter the following details:
   - **Name**: `juanride-dev` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose **Southeast Asia (Singapore)** (closest to Philippines)
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to be created

## Step 2: Run Database Migrations

### Migration 1: Create Tables (Schema)

1. In your Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase/migrations/00001_initial_schema.sql` in your code editor
4. **Copy the entire contents** of that file
5. **Paste** it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

**This creates:**
- ✅ 9 tables (users, vehicles, bookings, payments, reviews, maintenance_logs, messages, favorites, notifications)
- ✅ All necessary indexes for performance
- ✅ Database triggers for automatic timestamp updates
- ✅ Enum types for status fields

### Migration 2: Set Up Security (Row Level Security)

1. In the SQL Editor, click **"New Query"** again
2. Open the file `supabase/migrations/00002_rls_policies.sql` in your code editor
3. **Copy the entire contents** of that file
4. **Paste** it into the Supabase SQL Editor
5. Click **"Run"**
6. You should see "Success. No rows returned"

**This creates:**
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Role-based access control (renter, owner, admin)
- ✅ Data privacy and security rules

### Migration 3: Set Up Auth Trigger (IMPORTANT!)

1. In the SQL Editor, click **"New Query"** again
2. Open the file `supabase/migrations/00003_auth_trigger.sql` in your code editor
3. **Copy the entire contents** of that file
4. **Paste** it into the Supabase SQL Editor
5. Click **"Run"**
6. You should see "Success. No rows returned"

**This creates:**
- ✅ Automatic user profile creation when someone signs up
- ✅ Database trigger that syncs auth.users → users table
- ✅ Insert policy for user profiles

### Migration 4: Sync Existing Users (If you already signed up)

If you already created an account before running migration 3:

1. In the SQL Editor, click **"New Query"** again
2. Open the file `supabase/migrations/00004_sync_existing_users.sql` in your code editor
3. **Copy the entire contents** of that file
4. **Paste** it into the Supabase SQL Editor
5. Click **"Run"**
6. You should see "Success. X rows affected" (where X is the number of users synced)

**This creates:**
- ✅ Syncs any existing auth users to the users table
- ✅ Fixes users that were created before the trigger

### Verify User Sync (Important!)

After running migrations 3 and 4, verify that all users are properly synced:

1. In SQL Editor, click **"New Query"**
2. Open the file `supabase/check_user_sync.sql`
3. Copy and paste the contents
4. Click **"Run"**

**Expected result:**
- Should show all your users with "✅ Synced" status
- If any show "❌ MISSING PROFILE", run migration 00004 again

### Verify Tables Created

1. Click **"Table Editor"** in the left sidebar
2. You should see all 9 tables:
   - `users`
   - `vehicles`
   - `bookings`
   - `payments`
   - `reviews`
   - `maintenance_logs`
   - `messages`
   - `favorites`
   - `notifications`

## Step 3: Set Up Storage Buckets

### Create Storage Buckets for Images

1. Click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**

#### Bucket 1: Vehicle Images
- **Name**: `vehicle-images`
- **Public bucket**: ✅ Check this (images need to be publicly accessible)
- Click **"Create bucket"**

#### Bucket 2: Profile Images
- **Name**: `profile-images`
- **Public bucket**: ✅ Check this
- Click **"Create bucket"**

#### Bucket 3: Review Images
- **Name**: `review-images`
- **Public bucket**: ✅ Check this
- Click **"Create bucket"**

### Configure Storage Policies

For each bucket, we need to add policies:

#### Vehicle Images Policies

1. Click on the `vehicle-images` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Select **"Custom"**

**Policy 1: Public Read Access**
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
true
```
- Click **"Review"** then **"Save policy"**

**Policy 2: Authenticated Upload**
- Click **"New Policy"** again
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
auth.role() = 'authenticated'
```
- Click **"Review"** then **"Save policy"**

**Policy 3: Owner Update**
- Click **"New Policy"** again
- **Policy name**: `Owners can update their images`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
```sql
auth.role() = 'authenticated'
```
- Click **"Review"** then **"Save policy"**

**Repeat the same 3 policies for `profile-images` and `review-images` buckets.**

## Step 4: Get Your API Credentials

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. Copy these values (you'll need them for `.env.local`):

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep this secret!)
```

## Step 5: Configure Environment Variables

1. In your project root, create or update `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Replace** the placeholder values with your actual Supabase credentials
3. **Save** the file

## Step 6: Enable Realtime (Optional)

For real-time chat and notifications:

1. Click **"Database"** in the left sidebar
2. Click **"Replication"**
3. Find the following tables and enable replication:
   - `messages` - Turn on
   - `notifications` - Turn on
4. Click **"Save"**

## Step 7: Configure Authentication

1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"**
3. Enable **Email** provider:
   - Toggle on **"Enable Email provider"**
   - Toggle on **"Confirm email"** (recommended)
   - Click **"Save"**

### Optional: Enable Google OAuth

1. In the same Providers section, find **Google**
2. Toggle on **"Google enabled"**
3. You'll need to:
   - Get OAuth credentials from Google Cloud Console
   - Add Client ID and Client Secret
   - Add this redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 8: Add Test Data (Optional)

To test the app immediately, you can add some sample vehicles.

### First, Create a Test Owner Account

1. Go to http://localhost:3000/signup
2. Create an account with role "owner"
3. Check your email and confirm (if email confirmation is enabled)

### Get Your User ID

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Find your test user and copy their UUID (user ID)

### Add Sample Vehicles

1. Go to **SQL Editor** → **New Query**
2. Paste this SQL (replace `'your-user-id-here'` with your actual user ID):

```sql
-- Insert sample vehicles
INSERT INTO vehicles (
  owner_id, 
  type, 
  make, 
  model, 
  year, 
  plate_number,
  description, 
  price_per_day,
  price_per_week,
  location, 
  status,
  is_approved,
  image_urls
) VALUES 
(
  'your-user-id-here',
  'scooter',
  'Honda',
  'Click 150i',
  2023,
  'ABC-1234',
  'Well-maintained scooter perfect for island cruising. Great fuel economy and comfortable for daily rides around Siargao.',
  500.00,
  3000.00,
  'General Luna, Siargao',
  'available',
  true,
  ARRAY['https://images.unsplash.com/photo-1558981806-ec527fa84c39']
),
(
  'your-user-id-here',
  'motorcycle',
  'Yamaha',
  'NMAX 155',
  2022,
  'XYZ-5678',
  'Premium automatic scooter with under-seat storage. Perfect for couples or solo travelers with luggage.',
  700.00,
  4200.00,
  'General Luna, Siargao',
  'available',
  true,
  ARRAY['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
),
(
  'your-user-id-here',
  'motorcycle',
  'Honda',
  'XRM 125',
  2021,
  'DEF-9012',
  'Reliable and fuel-efficient motorcycle. Great for exploring Siargao''s roads and reaching remote surf spots.',
  600.00,
  3600.00,
  'Cloud 9, Siargao',
  'available',
  true,
  ARRAY['https://images.unsplash.com/photo-1609630875171-b1321377ee65']
),
(
  'your-user-id-here',
  'car',
  'Toyota',
  'Wigo',
  2022,
  'GHI-3456',
  'Compact car perfect for groups or families. Air-conditioned and comfortable for island tours.',
  2500.00,
  15000.00,
  'General Luna, Siargao',
  'available',
  true,
  ARRAY['https://images.unsplash.com/photo-1552519507-da3b142c6e3d']
);
```

3. Click **"Run"**
4. You should see "Success. 4 rows affected"

## Step 9: Verify Setup

### Check Tables
1. Go to **Table Editor**
2. Click on `vehicles` table
3. You should see the sample vehicles you just inserted

### Check Storage
1. Go to **Storage**
2. Verify all 3 buckets exist:
   - vehicle-images ✅
   - profile-images ✅
   - review-images ✅

### Check Authentication
1. Go to **Authentication** → **Users**
2. You should see your test account

## Step 10: Test the Application

1. Make sure your dev server is running:
```bash
npm run dev
```

2. Open http://localhost:3000

3. **Test the following:**
   - ✅ Click "Book Now" → should show vehicles
   - ✅ Click on a vehicle → should show details
   - ✅ Click "Get Started" → should show signup page
   - ✅ Sign up as a renter
   - ✅ Browse vehicles
   - ✅ Try creating a booking

## Troubleshooting

### Can't connect to database
- Verify your `.env.local` has correct credentials
- Check that your Supabase project is active (not paused)
- Restart your dev server after updating `.env.local`

### Tables not showing
- Make sure both migration files ran successfully
- Check for error messages in SQL Editor
- Try running migrations one at a time

### Images not uploading
- Verify storage buckets exist
- Check that buckets are set to "public"
- Verify storage policies are configured
- Check browser console for specific errors

### Authentication not working
- Verify email provider is enabled
- Check redirect URLs in Supabase Auth settings
- Make sure Site URL is set correctly

## Next Steps

Once your database is set up:

1. ✅ Create test accounts (renter, owner, admin)
2. ✅ Add some vehicle listings
3. ✅ Test the booking flow
4. ✅ Try the chat feature
5. ✅ Test the review system

---

**Need help?** Check the main `DEPLOYMENT.md` file for production setup or `README.md` for development guidelines.

