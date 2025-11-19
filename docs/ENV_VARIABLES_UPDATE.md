# Environment Variables Update Guide

## ⚠️ Action Required: Update Your Environment Variables

The SinoTrack integration requires updating your environment variables. The test credentials have been renamed to clearly indicate they are for testing purposes only.

## What Changed

### Old Variable Names (❌ Remove These)
```bash
SINOTRACK_ACCOUNT=9171065898
SINOTRACK_PASSWORD=123456
SINOTRACK_DEVICE_ID=9171065898
```

### New Variable Names (✅ Add These)
```bash
SINOTRACK_TEST_ACCOUNT=9171065898
SINOTRACK_TEST_PASSWORD=123456
SINOTRACK_TEST_DEVICE_ID=9171065898
```

## Complete SinoTrack Configuration

Your `.env.local` file should have these SinoTrack variables:

```bash
# ============================================================================
# SINOTRACK GPS TRACKING CONFIGURATION
# ============================================================================

# Global SinoTrack server URL (required for all tracking features)
SINOTRACK_SERVER=https://246.sinotrack.com

# Test credentials for /sinotrack-test page only (optional)
# These are used for testing the SinoTrack integration
SINOTRACK_TEST_ACCOUNT=9171065898
SINOTRACK_TEST_PASSWORD=123456
SINOTRACK_TEST_DEVICE_ID=9171065898

# Note: Per-vehicle SinoTrack credentials are stored in the database
# and do not require environment variables.
```

## Why This Change?

1. **Clarity**: The new names make it clear these are test credentials
2. **Security**: Separates test credentials from production vehicle credentials
3. **Flexibility**: Per-vehicle credentials are now stored in the database, not environment variables

## Where to Update

### Development Environment
Update your local `.env.local` file with the new variable names.

### Production Environment
Update your environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other platforms: Consult their documentation

## Verification

After updating, verify the changes work:

1. **Test Page**: Visit `/sinotrack-test`
   - Should load without errors
   - Should fetch GPS data successfully

2. **Check Logs**: Look for any errors mentioning SinoTrack environment variables

3. **Vehicle Form**: Try adding a vehicle with GPS credentials
   - "Test Connection" button should work

## What Doesn't Need Environment Variables

The following are now stored **per-vehicle in the database**:
- Individual vehicle Device IDs
- Individual vehicle SinoTrack accounts
- Individual vehicle SinoTrack passwords

Only the global `SINOTRACK_SERVER` URL and optional test credentials need to be in environment variables.

## Troubleshooting

### Error: "SinoTrack test environment variables are not fully configured"
- You're missing one or more of the `SINOTRACK_TEST_*` variables
- These are only needed if you use the `/sinotrack-test` page
- For production, you can omit these test variables

### Error: "SinoTrack server is not configured"
- The `SINOTRACK_SERVER` variable is missing or empty
- This is required for all SinoTrack features
- Set it to: `https://246.sinotrack.com`

### Test page not working
- Verify all three test variables are set
- Check the variable names match exactly (case-sensitive)
- Restart your development server after changing `.env.local`

## Summary

**Required for all environments:**
```bash
SINOTRACK_SERVER=https://246.sinotrack.com
```

**Optional (only for testing page):**
```bash
SINOTRACK_TEST_ACCOUNT=your_test_account
SINOTRACK_TEST_PASSWORD=your_test_password
SINOTRACK_TEST_DEVICE_ID=your_test_device_id
```

**Not needed (stored in database):**
- Per-vehicle credentials are managed through the vehicle form UI
- Vehicle owners enter their own SinoTrack credentials
- No environment variables needed for production vehicle tracking

