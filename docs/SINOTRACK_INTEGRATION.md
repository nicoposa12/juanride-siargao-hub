# SinoTrack GPS Tracking Integration

This document describes the SinoTrack GPS tracking integration for the JuanRide Siargao Hub platform.

## Overview

The platform supports optional GPS tracking for vehicles using the SinoTrack API. Vehicle owners can configure their SinoTrack credentials, and renters with active bookings can view real-time vehicle location.

## Architecture

### Database Schema

Three optional fields have been added to the `vehicles` table:

```sql
ALTER TABLE public.vehicles
ADD COLUMN sinotrack_device_id TEXT,
ADD COLUMN sinotrack_account TEXT,
ADD COLUMN sinotrack_password TEXT;
```

**Constraint**: All three fields must be either filled or empty (enforced by database constraint).

### Environment Variables

#### Required Global Variables

```bash
# SinoTrack server URL (shared across all vehicles)
SINOTRACK_SERVER=https://246.sinotrack.com
```

#### Test Page Variables (Optional)

These are only needed for the `/sinotrack-test` testing page:

```bash
# Test credentials for development/testing
SINOTRACK_TEST_ACCOUNT=your_test_account
SINOTRACK_TEST_PASSWORD=your_test_password
SINOTRACK_TEST_DEVICE_ID=your_test_device_id
```

**Important**: The old environment variables have been renamed:
- `SINOTRACK_ACCOUNT` → `SINOTRACK_TEST_ACCOUNT`
- `SINOTRACK_PASSWORD` → `SINOTRACK_TEST_PASSWORD`
- `SINOTRACK_DEVICE_ID` → `SINOTRACK_TEST_DEVICE_ID`

### API Endpoints

#### 1. Validate Credentials

**Endpoint**: `POST /api/sinotrack/validate`

**Purpose**: Validates SinoTrack credentials when vehicle owners enter them.

**Request Body**:
```json
{
  "account": "string",
  "password": "string",
  "deviceId": "string (optional)"
}
```

**Response**:
```json
{
  "valid": true,
  "message": "Credentials are valid",
  "deviceCount": 2,
  "devices": [
    {
      "deviceId": "9171065898",
      "lastSeen": "2024-11-19T10:30:00Z"
    }
  ]
}
```

#### 2. Track Vehicle

**Endpoint**: `GET /api/sinotrack/track/[vehicleId]`

**Purpose**: Fetches real-time GPS data for a vehicle.

**Authorization**:
- User must be authenticated
- User must have an active booking for the vehicle
- Vehicle must have SinoTrack credentials configured

**Response**:
```json
{
  "position": {
    "latitude": 9.8167,
    "longitude": 126.0333,
    "recordedAt": "2024-11-19T10:30:00Z",
    "speedKph": 45.5,
    "gsmSignal": 28,
    "gpsSignal": 30
  },
  "vehicle": {
    "id": "uuid",
    "make": "Honda",
    "model": "Click 150",
    "plateNumber": "ABC123"
  },
  "booking": {
    "id": "uuid",
    "status": "active",
    "startDate": "2024-11-19",
    "endDate": "2024-11-21"
  }
}
```

#### 3. Test Page Endpoint

**Endpoint**: `GET /api/get-coordinates?deviceId=xxx`

**Purpose**: Testing endpoint using test credentials from environment variables.

**Note**: This endpoint uses `SINOTRACK_TEST_*` environment variables.

## Features

### For Vehicle Owners

1. **Add GPS Tracking Credentials**
   - Navigate to vehicle form (add or edit vehicle)
   - Scroll to "GPS Tracking (Optional)" section
   - Enter Device ID, Account, and Password
   - Click "Test Connection" to validate credentials
   - Save vehicle

2. **Credential Validation**
   - Real-time validation when entering credentials
   - Shows number of devices found on the account
   - Provides clear error messages for invalid credentials

3. **Security**
   - Credentials are stored securely in the database
   - Only the vehicle owner can view/edit credentials
   - Credentials are never exposed to renters

### For Renters

1. **View Live Tracking**
   - Navigate to active booking details page
   - If vehicle has GPS tracking enabled, a live map is displayed
   - Shows current location, speed, and signal strength
   - Auto-refreshes every 30 seconds

2. **Access Control**
   - Only renters with active bookings can view tracking
   - Tracking is only available during the rental period
   - After rental ends, tracking access is revoked

## Components

### Owner Components

#### `SinoTrackCredentials.tsx`
- Form component for entering GPS credentials
- Includes validation button
- Shows success/error feedback
- Used in vehicle add/edit forms

### Renter Components

#### `VehicleTracker.tsx`
- Displays live GPS tracking data
- Auto-refreshes position data
- Shows map with current location
- Displays speed, signal strength, and last update time
- "Open in Google Maps" button for navigation

## Database Migration

Run the following SQL migration in Supabase SQL Editor:

```sql
-- Migration: 00016_add_sinotrack_fields.sql
-- See: supabase/migrations/00016_add_sinotrack_fields.sql
```

This migration:
- Adds three optional columns to vehicles table
- Creates index for vehicles with tracking enabled
- Adds constraint to ensure data consistency
- Includes documentation comments

## TypeScript Types

The database types have been updated to include SinoTrack fields:

```typescript
interface Vehicle {
  // ... existing fields
  sinotrack_device_id: string | null;
  sinotrack_account: string | null;
  sinotrack_password: string | null;
}
```

## Testing

### Test Page

Visit `/sinotrack-test` to test the SinoTrack integration:
1. Uses test credentials from environment variables
2. Allows entering custom device ID
3. Shows raw API response
4. Useful for debugging connection issues

### Manual Testing Checklist

**Owner Flow**:
- [ ] Add vehicle with GPS credentials
- [ ] Validate credentials work
- [ ] Edit vehicle and update credentials
- [ ] Clear credentials (all fields empty)
- [ ] Try saving with incomplete credentials (should fail)

**Renter Flow**:
- [ ] Book vehicle with GPS tracking
- [ ] View booking details during rental period
- [ ] See live tracking map
- [ ] Verify auto-refresh works
- [ ] Try accessing after rental ends (should fail)

**Security**:
- [ ] Non-renters cannot access tracking endpoint
- [ ] Tracking not available outside rental period
- [ ] Credentials not exposed in API responses

## Troubleshooting

### Common Issues

**"GPS tracking is not available for this vehicle"**
- Vehicle owner hasn't configured SinoTrack credentials
- All three fields must be filled

**"You do not have an active rental for this vehicle"**
- Booking is not in 'confirmed' or 'active' status
- Current date is outside rental period
- User is not the renter of this booking

**"Invalid credentials"**
- SinoTrack account or password is incorrect
- Device ID doesn't exist on the account
- SinoTrack server is down

**"No GPS data available"**
- Device is offline or not sending data
- Device ID is incorrect
- Network connectivity issues with the GPS device

### Debug Mode

To debug SinoTrack API calls:
1. Check server logs for `[sinotrack]` prefix
2. Use `/sinotrack-test` page to test credentials
3. Verify `SINOTRACK_SERVER` environment variable is set

## Security Considerations

1. **Credential Storage**
   - Credentials stored in database (not environment variables)
   - Consider encrypting password field in future
   - Use Row Level Security (RLS) policies

2. **Access Control**
   - Strict authorization checks on tracking endpoint
   - Time-based access (only during rental period)
   - User-based access (only the renter)

3. **Rate Limiting**
   - Consider implementing rate limiting on tracking endpoint
   - Default auto-refresh is 30 seconds (reasonable)

## Future Enhancements

- [ ] Encrypt SinoTrack passwords in database
- [ ] Add map visualization (Google Maps, Leaflet, Mapbox)
- [ ] Historical tracking data (route history)
- [ ] Geofencing alerts
- [ ] Multiple device support per vehicle
- [ ] Webhook support for real-time updates
- [ ] Mobile app integration

## Support

For SinoTrack API documentation and support:
- Website: https://www.sinotrack.com
- API Documentation: Contact SinoTrack support

For platform-specific issues:
- Check server logs
- Review this documentation
- Test with `/sinotrack-test` page

