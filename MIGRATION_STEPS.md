# Vehicle Status Migration - Step by Step Guide

## ✅ Pre-Migration Checklist

All code changes are complete:
- ✅ Frontend: VehicleStatusSelector added to My Vehicles page
- ✅ Constants: Updated to 3-status system
- ✅ Types: database.types.ts updated
- ✅ Types: vehicle.types.ts updated
- ✅ Admin: Reject action uses 'unavailable'
- ✅ Migration: 00014_fix_vehicle_status_trigger.sql created

---

## 🚀 Step 1: Run the Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd c:\Users\Engr. John Rome\Documents\GitHub\juanride-siargao-hub

# Push migration to database
npx supabase db push

# This will apply migration: 00014_fix_vehicle_status_trigger.sql
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/00014_fix_vehicle_status_trigger.sql`
6. Paste into the editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Wait for "Success" message

---

## 🧪 Step 2: Verify Migration Success

After running the migration, check in Supabase SQL Editor:

```sql
-- 1. Check the constraint is correct
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'vehicles_status_check';

-- Expected result:
-- CHECK (status::text = ANY (ARRAY['available'::text, 'unavailable'::text, 'maintenance'::text]))

-- 2. Check for any invalid statuses (should return 0 rows)
SELECT id, status, make, model 
FROM vehicles 
WHERE status NOT IN ('available', 'unavailable', 'maintenance');

-- Expected: No rows returned

-- 3. Check status distribution
SELECT status, COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY count DESC;

-- Expected: Only see 'available', 'unavailable', 'maintenance'
```

---

## 🔄 Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl + C)
# Then restart
npm run dev
```

---

## ✅ Step 4: Test the Features

### Test 1: Status Selector on My Vehicles Page

1. Navigate to: `http://localhost:3000/owner/vehicles`
2. You should see status badges with a settings icon for each vehicle
3. Click any status badge
4. Dialog should open with status options:
   - ✅ Available (green, checkmark icon)
   - ✅ Unavailable (red, alert icon)
   - ✅ Maintenance (yellow, wrench icon)
5. Try changing status
6. Badge should update immediately

**Expected:** All status badges display correctly with proper colors

### Test 2: Owner Dashboard

1. Navigate to: `http://localhost:3000/owner/dashboard`
2. Check "Your Vehicles" section
3. Status selector should work the same way
4. All vehicles should show proper status badges

**Expected:** Same functionality as My Vehicles page

### Test 3: Automatic Status Updates

**Create a test booking:**

1. As a renter, book an available vehicle
2. As owner/admin, confirm the booking
3. Check the vehicle's status
   
**Expected:** Vehicle status automatically changes to "Unavailable"

**Complete the booking:**

1. As owner/admin, mark the booking as completed
2. Check the vehicle's status

**Expected:** Vehicle status automatically returns to "Available"

### Test 4: Maintenance Protection

1. Set a vehicle to "Maintenance" status
2. Complete a booking for that vehicle (if any exists)
3. Check vehicle status

**Expected:** Vehicle STAYS in "Maintenance" (doesn't auto-change to Available)

### Test 5: Vehicle Search

1. Go to: `http://localhost:3000/vehicles`
2. Only vehicles with status "available" should appear
3. Vehicles marked as "unavailable" or "maintenance" should NOT appear

**Expected:** Search only shows available vehicles

---

## 🐛 Troubleshooting

### If you see TypeScript errors:

```bash
# Restart TypeScript server in VS Code
# Press: Ctrl + Shift + P
# Type: "TypeScript: Restart TS Server"
# Select and press Enter
```

### If status badges still don't show:

1. Clear browser cache (Ctrl + Shift + R)
2. Check browser console for errors (F12)
3. Verify migration ran successfully (Step 2 queries)

### If migration fails:

```sql
-- Check if constraint already exists
SELECT conname FROM pg_constraint WHERE conname = 'vehicles_status_check';

-- If it exists with wrong definition, manually fix:
ALTER TABLE public.vehicles DROP CONSTRAINT vehicles_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'unavailable', 'maintenance'));
```

---

## 📊 Before vs After

### Before Migration:
- ❌ Vehicle status set to 'rented' by trigger
- ❌ UI doesn't recognize 'rented' status
- ❌ Status badges don't display
- ❌ Only "Under Maintenance" shows

### After Migration:
- ✅ Vehicle status set to 'unavailable' by trigger
- ✅ UI recognizes all 3 statuses
- ✅ All status badges display with colors
- ✅ Status selector works on My Vehicles page
- ✅ Automatic status changes work correctly

---

## 🎯 Success Criteria

Your migration is successful when:

1. ✅ All vehicles have status: 'available', 'unavailable', or 'maintenance'
2. ✅ No vehicles have status: 'rented' or 'inactive'
3. ✅ Status badges display on My Vehicles page
4. ✅ Status selector dialog opens and works
5. ✅ All three statuses show with correct colors
6. ✅ Booking confirmation → vehicle becomes unavailable
7. ✅ Booking completion → vehicle returns to available
8. ✅ No errors in browser console
9. ✅ No errors in database queries

---

## 📝 Next Steps After Migration

1. Monitor for a few days to ensure stability
2. Delete old unused migration files:
   - `supabase/FIX_VEHICLE_STATUS.sql` (duplicate)
   - Consider removing if not needed

3. Optional: Add status change audit log for tracking

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the verification queries in Step 2
2. Look for errors in browser console (F12)
3. Check Supabase logs in the dashboard
4. Review `docs/VEHICLE_STATUS_ANALYSIS.md` for details

---

## 🎉 You're Done!

Once all tests pass, your vehicle status system is fully migrated and working correctly!
