# Suspended Owner Vehicle Hiding Implementation

## 📋 Overview

Implemented a complete suspension enforcement system that **automatically hides all vehicles** from suspended owners across the platform and **prevents new bookings** from being created for those vehicles.

---

## 🎯 What Was Fixed

### **Problem:**
- Suspended owners (like Justin Gange) were still receiving new bookings
- Their vehicles were still visible in the renter's browse vehicles page
- Renters could still create bookings for suspended owners' vehicles

### **Solution:**
1. ✅ **Hide vehicles from suspended owners** in all vehicle listing queries
2. ✅ **Prevent booking creation** for vehicles owned by suspended owners
3. ✅ **Show suspension warning** on owner dashboard and commissions page

---

## 🔧 Technical Implementation

### 1. **Vehicle Queries - Filter Suspended Owners**

**File:** `src/lib/supabase/queries/vehicles.ts`

#### **Updated Functions:**

##### **`searchVehicles()`** - Main vehicle search for renters
```typescript
// Added is_suspended to owner selection
owner:users!owner_id (
  id,
  full_name,
  profile_image_url,
  is_suspended  // ← ADDED
)

// Filter out vehicles from suspended owners
const activeVehicles = (vehicles || []).filter(v => {
  const owner = Array.isArray(v.owner) ? v.owner[0] : v.owner
  return !owner?.is_suspended
})
```

##### **`getFeaturedVehicles()`** - Featured vehicles on homepage
```typescript
// Fetch extra vehicles in case some are filtered out
.limit(limit * 2)

// Filter out suspended owners
const activeVehicles = (vehicles || []).filter(v => {
  const owner = Array.isArray(v.owner) ? v.owner[0] : v.owner
  return !owner?.is_suspended
})

// Return only up to the requested limit
return activeVehicles.slice(0, limit)
```

##### **`getSimilarVehicles()`** - Similar vehicles on detail page
```typescript
// Same filtering logic as getFeaturedVehicles
.limit(limit * 2)
// Filter suspended owners
// Return limited results
```

##### **`getVehicleById()`** - Single vehicle detail
```typescript
// Added is_suspended field
owner:users!owner_id (
  id,
  full_name,
  profile_image_url,
  phone_number,
  is_suspended  // ← ADDED
)
```

---

### 2. **Booking Creation - Prevent Suspended Owner Bookings**

**File:** `src/lib/supabase/queries/bookings.ts`

#### **Updated Function: `createBooking()`**

```typescript
export async function createBooking(
  renterId: string,
  bookingData: CreateBookingData
): Promise<{ booking: Booking | null; error: any }> {
  const supabase = createClient()

  // ✅ CHECK 1: Get vehicle and owner suspension status
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select(`
      id,
      owner:users!owner_id (
        id,
        is_suspended
      )
    `)
    .eq('id', bookingData.vehicle_id)
    .single()

  if (vehicleError) {
    return { booking: null, error: vehicleError }
  }

  // ✅ CHECK 2: Prevent booking if owner is suspended
  const owner = Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner
  if (owner?.is_suspended) {
    return { 
      booking: null, 
      error: { 
        message: 'This vehicle is currently unavailable. The owner account is suspended.',
        code: 'OWNER_SUSPENDED'
      } 
    }
  }

  // ✅ Proceed with booking creation
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({...})
    .select()
    .single()

  return { booking, error }
}
```

---

## 🔄 Complete Flow

### **When Admin Suspends an Owner:**

1. **Admin Action:**
   - Admin clicks **"Suspend Owner"** on commission
   - Enters suspension reason
   - Confirms suspension

2. **Database Update:**
   ```sql
   UPDATE users 
   SET 
     is_suspended = TRUE,
     suspension_reason = 'Repeated unpaid commissions',
     suspended_at = NOW(),
     suspended_by = <admin_id>
   WHERE id = <owner_id>
   ```

3. **Immediate Effects:**
   - ✅ All vehicles from this owner are **hidden** from renter browse page
   - ✅ Featured vehicles exclude this owner's vehicles
   - ✅ Similar vehicles exclude this owner's vehicles
   - ✅ Renters **cannot create new bookings** for this owner's vehicles

4. **Owner Dashboard:**
   - ✅ Red suspension banner appears
   - ✅ Shows suspension reason and date
   - ✅ Cannot accept new bookings (enforced at booking creation)

---

## 🧪 Testing Scenarios

### **Test 1: Hide Vehicles from Suspended Owner**

**Steps:**
1. Login as **Admin**
2. Go to **Admin Commissions**
3. Click **3-dot menu** on Justin Gange's commission
4. Select **"Suspend Owner"**
5. Enter reason: "Repeated unpaid commissions"
6. Click **"Suspend Owner"**

**Expected Results:**
- ✅ Toast shows "Owner Suspended: Justin Gange"
- ✅ Justin's vehicles **disappear** from renter browse page
- ✅ Justin's vehicles **not shown** in featured vehicles
- ✅ Red suspension banner shows on Justin's dashboard

**Verification:**
```
1. Logout
2. Go to homepage (renter view)
3. Browse vehicles → Justin's vehicles NOT visible ✅
4. Search for "Honda" → Justin's vehicles NOT in results ✅
5. Login as Justin Gange
6. See red suspension banner on dashboard ✅
```

---

### **Test 2: Prevent Booking for Suspended Owner's Vehicle**

**Steps:**
1. Ensure Justin Gange is suspended
2. Try to access a **direct link** to Justin's vehicle (if you have the URL)
3. Try to create a booking for this vehicle

**Expected Results:**
- ✅ Vehicle detail page may load (if accessed directly via URL)
- ✅ **"Book Now"** button should fail with error
- ✅ Error message: "This vehicle is currently unavailable. The owner account is suspended."
- ✅ Booking is **NOT created** in database

**Verification:**
```sql
-- Check that no new bookings were created
SELECT * FROM bookings 
WHERE vehicle_id IN (
  SELECT id FROM vehicles WHERE owner_id = '<justin_gange_id>'
)
ORDER BY created_at DESC
LIMIT 5;

-- Should not show any new bookings created after suspension
```

---

### **Test 3: Featured Vehicles Don't Show Suspended**

**Steps:**
1. Suspend Justin Gange
2. Go to homepage as **guest** or **renter**
3. Check "Featured Vehicles" section

**Expected Results:**
- ✅ Justin's vehicles are **not shown**
- ✅ Only vehicles from active (non-suspended) owners appear

---

### **Test 4: Search Results Don't Show Suspended**

**Steps:**
1. Suspend Justin Gange
2. Go to browse vehicles page
3. Search for "Honda Nmax" (Justin's vehicle)
4. Apply filters (price, type, etc.)

**Expected Results:**
- ✅ Justin's Honda Nmax **does not appear** in results
- ✅ Other Honda Nmax from active owners still show
- ✅ Total vehicle count excludes suspended owners' vehicles

---

### **Test 5: Unsuspend Owner - Vehicles Reappear**

**Steps:**
1. Login as **Admin**
2. Go to database or user management
3. Set `is_suspended = FALSE` for Justin Gange
4. Refresh renter browse page

**Expected Results:**
- ✅ Justin's vehicles **reappear** in browse page
- ✅ Justin's vehicles appear in featured vehicles
- ✅ Renters can create bookings again
- ✅ Suspension banner **disappears** from Justin's dashboard

**SQL:**
```sql
UPDATE users 
SET 
  is_suspended = FALSE,
  suspension_reason = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE id = '<justin_gange_id>';
```

---

## 📊 What Queries Were Updated

| Query Function | File | What Changed |
|---|---|---|
| `searchVehicles()` | vehicles.ts | Added `is_suspended` filter, excluded suspended owners |
| `getFeaturedVehicles()` | vehicles.ts | Added `is_suspended` filter, fetch 2x and filter |
| `getSimilarVehicles()` | vehicles.ts | Added `is_suspended` filter, fetch 2x and filter |
| `getVehicleById()` | vehicles.ts | Added `is_suspended` field to owner selection |
| `createBooking()` | bookings.ts | Added pre-check to prevent bookings for suspended owners |

---

## 🔍 Database Fields Used

### **`users` Table:**

```sql
is_suspended BOOLEAN DEFAULT FALSE
suspension_reason TEXT
suspended_at TIMESTAMPTZ
suspended_by UUID REFERENCES users(id)
```

### **How It Works:**

1. **Vehicle queries** join with `users` table via `owner_id`
2. **Filter out** vehicles where `owner.is_suspended = TRUE`
3. **Booking creation** checks `owner.is_suspended` before inserting

---

## ⚠️ Important Notes

### **1. Direct Vehicle Access**

If a renter has a **direct URL** to a vehicle detail page (e.g., `/vehicles/abc123`), they can still **view** the vehicle details, but:
- ✅ They **cannot create a booking** (blocked at API level)
- ✅ Error message shows when trying to book
- ✅ Vehicle is hidden from all listing pages

**Recommendation:** Add suspension check to vehicle detail page to show a banner:
```tsx
{vehicle.owner?.is_suspended && (
  <Alert variant="destructive">
    This vehicle is currently unavailable.
  </Alert>
)}
```

### **2. Existing Bookings**

Suspended owners can still:
- ✅ View their existing bookings
- ✅ Complete ongoing rentals
- ✅ View commission history

**What they CANNOT do:**
- ❌ Receive new booking requests
- ❌ Accept new bookings
- ❌ Have their vehicles shown to renters

### **3. Performance Consideration**

We fetch **2x the limit** for featured/similar vehicles, then filter client-side:
```typescript
.limit(limit * 2) // Fetch extra
// Filter suspended
return activeVehicles.slice(0, limit) // Return limited
```

**Why?** If we only fetch `limit`, and half are suspended, we'd show fewer results than expected.

**Alternative:** Use Supabase filtering (if RLS allows):
```typescript
.filter('owner.is_suspended', 'eq', false)
```

### **4. Admin Cannot Be Suspended**

The current implementation doesn't prevent admins from being suspended. Add this check if needed:
```typescript
if (user.role === 'admin') {
  return { error: 'Cannot suspend admin users' }
}
```

---

## 🚀 Next Steps (Recommended)

### **1. Vehicle Detail Page Suspension Banner**

Add suspension warning to vehicle detail page:

```tsx
// src/app/vehicles/[id]/page.tsx
{vehicle?.owner?.is_suspended && (
  <Alert variant="destructive" className="mb-6">
    <Ban className="h-5 w-5" />
    <AlertTitle>Vehicle Unavailable</AlertTitle>
    <AlertDescription>
      This vehicle is currently unavailable for booking. 
      Please browse other available vehicles.
    </AlertDescription>
  </Alert>
)}

{/* Disable booking button */}
<Button 
  disabled={vehicle?.owner?.is_suspended}
  onClick={handleBooking}
>
  {vehicle?.owner?.is_suspended ? 'Unavailable' : 'Book Now'}
</Button>
```

### **2. Admin Unsuspension UI**

Create admin interface to unsuspend users:

```tsx
// Admin User Management Page
<Button 
  onClick={() => unsuspendUser(userId)}
  variant="outline"
>
  Unsuspend User
</Button>

// Function
async function unsuspendUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null
    })
    .eq('id', userId)
}
```

### **3. Email Notifications**

Send emails when owners are suspended/unsuspended:

```typescript
// When suspending
await sendEmail({
  to: owner.email,
  subject: 'Account Suspended - JuanRide',
  body: `Your account has been suspended. Reason: ${reason}`
})

// When unsuspending
await sendEmail({
  to: owner.email,
  subject: 'Account Restored - JuanRide',
  body: 'Your account has been restored. You can now accept bookings.'
})
```

### **4. Audit Log**

Track suspension/unsuspension events:

```sql
CREATE TABLE suspension_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT, -- 'suspended' or 'unsuspended'
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Implementation Checklist

- [x] Filter suspended owners from `searchVehicles()`
- [x] Filter suspended owners from `getFeaturedVehicles()`
- [x] Filter suspended owners from `getSimilarVehicles()`
- [x] Add `is_suspended` to `getVehicleById()`
- [x] Prevent booking creation for suspended owners
- [x] Show suspension banner on owner dashboard
- [x] Show suspension banner on owner commissions page
- [x] Update total count to exclude suspended vehicles
- [x] Test vehicle hiding in browse page
- [x] Test booking prevention
- [ ] Add suspension banner to vehicle detail page (optional)
- [ ] Create admin unsuspension UI (optional)
- [ ] Add email notifications (optional)
- [ ] Create audit log (optional)

---

## 📞 How to Use

### **Suspend an Owner:**
```
1. Login as Admin
2. Go to Admin Commissions
3. Click 3-dot menu on commission
4. Select "Suspend Owner"
5. Enter reason
6. Click "Suspend Owner"
```

### **Unsuspend an Owner (via Database):**
```sql
UPDATE users 
SET 
  is_suspended = FALSE,
  suspension_reason = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE email = 'justin01@gmail.com';
```

### **Check Suspended Owners:**
```sql
SELECT 
  id,
  full_name,
  email,
  is_suspended,
  suspension_reason,
  suspended_at
FROM users 
WHERE is_suspended = TRUE;
```

### **Count Hidden Vehicles:**
```sql
SELECT 
  u.full_name AS owner_name,
  COUNT(v.id) AS vehicle_count
FROM vehicles v
JOIN users u ON v.owner_id = u.id
WHERE u.is_suspended = TRUE
GROUP BY u.full_name;
```

---

**Status:** Suspended owner vehicle hiding fully implemented ✅  
**Effect:** Suspended owners cannot receive new bookings and their vehicles are hidden from renters ✅

Great work! The suspension system now fully enforces account restrictions. 🎉
