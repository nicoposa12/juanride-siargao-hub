# SinoTrack Integration - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration

Copy and paste this SQL into your **Supabase SQL Editor**:

```sql
-- Add SinoTrack GPS tracking fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS sinotrack_device_id TEXT,
ADD COLUMN IF NOT EXISTS sinotrack_account TEXT,
ADD COLUMN IF NOT EXISTS sinotrack_password TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.sinotrack_device_id IS 'SinoTrack GPS device identifier (TEID/IMEI) - optional';
COMMENT ON COLUMN public.vehicles.sinotrack_account IS 'SinoTrack account username for GPS tracking - optional';
COMMENT ON COLUMN public.vehicles.sinotrack_password IS 'SinoTrack account password for GPS tracking - optional';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_sinotrack_enabled 
ON public.vehicles(id) 
WHERE sinotrack_device_id IS NOT NULL 
  AND sinotrack_account IS NOT NULL 
  AND sinotrack_password IS NOT NULL;

-- Add constraint to ensure all three fields are filled or all empty
ALTER TABLE public.vehicles
ADD CONSTRAINT check_sinotrack_fields_consistency 
CHECK (
  (sinotrack_device_id IS NULL AND sinotrack_account IS NULL AND sinotrack_password IS NULL) OR
  (sinotrack_device_id IS NOT NULL AND sinotrack_account IS NOT NULL AND sinotrack_password IS NOT NULL)
);
```

### Step 2: Update Environment Variables

Update your `.env.local` file:

```bash
# Required: Global SinoTrack server URL
SINOTRACK_SERVER=https://246.sinotrack.com

# Optional: Test credentials (only for /sinotrack-test page)
SINOTRACK_TEST_ACCOUNT=9171065898
SINOTRACK_TEST_PASSWORD=123456
SINOTRACK_TEST_DEVICE_ID=9171065898
```

**Important**: Rename old variables:
- ❌ `SINOTRACK_ACCOUNT` → ✅ `SINOTRACK_TEST_ACCOUNT`
- ❌ `SINOTRACK_PASSWORD` → ✅ `SINOTRACK_TEST_PASSWORD`
- ❌ `SINOTRACK_DEVICE_ID` → ✅ `SINOTRACK_TEST_DEVICE_ID`

### Step 3: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

## ✅ Verify Installation

### 1. Test the Test Page
Visit: `http://localhost:3000/sinotrack-test`
- Should load without errors
- Should show GPS coordinates

### 2. Test Vehicle Form
1. Go to: `/owner/vehicles/new`
2. Scroll to "GPS Tracking (Optional)"
3. Enter test credentials
4. Click "Test Connection"
5. Should show "Credentials are valid"

### 3. Test Tracking (Optional)
1. Create a test booking
2. Visit: `/dashboard/bookings/[bookingId]`
3. Should see live GPS tracking (if vehicle has credentials)

## 📖 Usage Guide

### For Vehicle Owners

**Add GPS Tracking to Your Vehicle:**

1. Go to "Add Vehicle" or "Edit Vehicle"
2. Scroll to "GPS Tracking (Optional)" section
3. Enter your SinoTrack credentials:
   - Device ID (TEID/IMEI)
   - Account (username)
   - Password
4. Click "Test Connection" to verify
5. Save your vehicle

**Note**: All three fields must be filled, or all left empty.

### For Renters

**View Live Vehicle Tracking:**

1. Go to "My Bookings"
2. Click on an active booking
3. If the vehicle has GPS tracking, you'll see:
   - Live map with current location
   - Speed and signal strength
   - "Open in Google Maps" button
4. Location updates automatically every 30 seconds

## 🔒 Security Features

- ✅ Only vehicle owners can set GPS credentials
- ✅ Only active renters can view tracking
- ✅ Tracking only available during rental period
- ✅ Credentials never exposed to renters
- ✅ Database constraints ensure data consistency

## 📁 New Files Created

### API Routes
- `/api/sinotrack/validate` - Validate credentials
- `/api/sinotrack/track/[vehicleId]` - Get live tracking data

### Components
- `SinoTrackCredentials.tsx` - Credential input form
- `VehicleTracker.tsx` - Live tracking display

### Pages
- `/dashboard/bookings/[bookingId]` - Booking details with tracking

### Database
- `00016_add_sinotrack_fields.sql` - Migration file

## 🐛 Troubleshooting

### "SinoTrack server is not configured"
**Solution**: Add `SINOTRACK_SERVER` to your `.env.local`

### "Invalid credentials"
**Solution**: 
- Double-check account and password
- Verify device ID exists on the account
- Test on `/sinotrack-test` page first

### "GPS tracking is not available"
**Solution**: 
- Vehicle owner needs to add GPS credentials
- All three fields must be filled

### "You do not have an active rental"
**Solution**: 
- Booking must be in 'confirmed' or 'active' status
- Current date must be within rental period

## 📚 Documentation

For detailed documentation, see:
- `docs/SINOTRACK_INTEGRATION.md` - Complete technical documentation
- `SINOTRACK_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `ENV_VARIABLES_UPDATE.md` - Environment variable guide

## 🎯 What's Next?

Optional enhancements you can add:
- [ ] Interactive map (Google Maps, Leaflet, Mapbox)
- [ ] Historical tracking data
- [ ] Geofencing alerts
- [ ] Password encryption
- [ ] Rate limiting
- [ ] Mobile app integration

## 💡 Tips

1. **Test First**: Always use the `/sinotrack-test` page to verify credentials before adding them to a vehicle
2. **Auto-Refresh**: The tracking map updates every 30 seconds automatically
3. **Google Maps**: Click "Open in Google Maps" for turn-by-turn navigation
4. **Signal Strength**: GSM and GPS signals are shown on a scale of 0-31

## 🤝 Need Help?

1. Check the troubleshooting section above
2. Review the detailed documentation
3. Check server logs for `[sinotrack]` messages
4. Verify environment variables are set correctly

---

**You're all set!** 🎉

The SinoTrack GPS tracking integration is now ready to use. Vehicle owners can add their GPS credentials, and renters can track their rented vehicles in real-time.

