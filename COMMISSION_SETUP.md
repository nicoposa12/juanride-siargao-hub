# Commission System Setup Guide

## ⚠️ Error: "Analysis failed - Failed to analyze bookings"

This error occurs because the **commissions table doesn't exist yet** in your database.

## 🔧 Quick Fix (3 Steps)

### Step 1: Apply the Database Migration

Choose **ONE** of these methods:

#### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to your project directory
cd c:\Users\basco\Documents\GitHub\juanride-siargao-hub

# Apply all pending migrations
supabase db push
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/00043_create_commissions_table.sql`
4. Paste into the SQL Editor
5. Click **Run**

#### Option C: Direct SQL Connection

```bash
# If you have direct database access
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/00043_create_commissions_table.sql
```

### Step 2: Verify Table Creation

Check if the table was created successfully:

```sql
-- Run this in Supabase SQL Editor or psql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'commissions';
```

**Expected Result:** Should return one row with `table_name = 'commissions'`

### Step 3: Use the Backfill Tool

1. Refresh the backfill page: `http://localhost:3000/admin/commissions/backfill`
2. Click **"Analyze Bookings"**
3. Should now work without errors
4. Click **"Create X Commissions"** to backfill

---

## 📋 What the Migration Does

The migration creates:

1. **`commissions` table** with these columns:
   - `id` - Unique commission ID
   - `booking_id` - Links to the rental booking
   - `owner_id` - Vehicle owner who owes commission
   - `rental_amount` - Total rental price
   - `commission_amount` - 10% commission amount
   - `payment_method` - How renter paid (qrph, gcash, cash, etc.)
   - `payment_type` - Cashless or Cash
   - `status` - pending, submitted, verified, paid
   - Bank transfer fields (for cashless payments)
   - Verification tracking fields
   - Timestamps

2. **Row-Level Security (RLS) Policies**:
   - Admins can view/manage all commissions
   - Owners can only see their own commissions
   - Owners can update their payment submissions

3. **Indexes** for better performance:
   - On booking_id, owner_id, status, payment_method, dates

4. **Triggers** for automatic timestamp updates

---

## 🐛 Troubleshooting

### Issue: "permission denied for relation commissions"

**Solution**: Your database user doesn't have permissions. Run as superuser or use Supabase CLI.

### Issue: "supabase command not found"

**Solution**: Install Supabase CLI first:

```bash
# Using npm
npm install -g supabase

# Or using scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Issue: "relation 'commissions' already exists"

**Good news!** The table already exists. The error is something else. Check:

1. Open browser console (F12)
2. Look for the actual error message
3. Check if there's a different issue (permissions, etc.)

### Issue: Migration file not found

**Solution**: Make sure the file exists at:
```
c:\Users\basco\Documents\GitHub\juanride-siargao-hub\supabase\migrations\00043_create_commissions_table.sql
```

---

## ✅ After Migration Success

Once the migration is applied successfully:

1. **Backfill Tool** will work properly
2. **Admin Commission Page** (`/admin/commissions`) will load
3. **Owner Commission Page** (`/owner/commissions`) will load
4. **Future bookings** will auto-create commission records

---

## 🚀 Testing After Setup

1. **Go to**: `/admin/commissions/backfill`
2. **Click**: "Analyze Bookings"
3. **Expected**: "Found X bookings without commission records"
4. **Click**: "Create X Commissions"
5. **Expected**: Success message with commission totals
6. **Verify**: Go to `/admin/commissions` - should show commissions

---

## 📞 Still Having Issues?

If you still see errors after applying the migration:

1. **Check browser console** (F12 → Console tab)
2. **Copy the full error message**
3. **Check Supabase logs** in your project dashboard
4. **Verify RLS policies** are enabled
5. **Confirm your user has admin role**

---

## 📝 Quick Reference

### Files Created:
- `supabase/migrations/00043_create_commissions_table.sql` - Creates commissions table
- `supabase/migrations/00044_backfill_commissions.sql` - SQL backfill script (optional)
- `src/lib/supabase/queries/commissions.ts` - Commission query functions
- `src/app/admin/commissions/page.tsx` - Admin commission management
- `src/app/admin/commissions/backfill/page.tsx` - Backfill tool
- `src/app/owner/commissions/page.tsx` - Owner commission payments

### Database Tables:
- `commissions` - Stores all commission records
- `bookings` - Links to commission via booking_id
- `vehicles` - Links to owner via owner_id
- `users` - Owner and admin information

---

## 🎯 Next Steps After Setup

1. ✅ Run migration
2. ✅ Backfill existing bookings
3. ✅ Notify owners about pending commissions
4. ✅ Set up collection schedule
5. ✅ Track payments regularly

Good luck! 🚀
