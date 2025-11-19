# SinoTrack Integration - Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         JuanRide Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ Vehicle Owner│         │    Renter    │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
│         │ 1. Add GPS            │ 4. View Tracking             │
│         │    Credentials        │                              │
│         ▼                        ▼                              │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ Vehicle Form │         │ Booking Page │                     │
│  │   Component  │         │   Component  │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
│         │ 2. Validate           │ 5. Fetch Position            │
│         │                        │                              │
│         ▼                        ▼                              │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ /api/validate│         │ /api/track/  │                     │
│  │              │         │  [vehicleId] │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
│         │ 3. Store              │ 6. Authorize                 │
│         │                        │                              │
│         ▼                        ▼                              │
│  ┌──────────────────────────────────────┐                      │
│  │         Supabase Database            │                      │
│  │  ┌────────────────────────────────┐  │                      │
│  │  │ vehicles                       │  │                      │
│  │  │  - sinotrack_device_id        │  │                      │
│  │  │  - sinotrack_account          │  │                      │
│  │  │  - sinotrack_password         │  │                      │
│  │  └────────────────────────────────┘  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ 7. Fetch GPS Data
                           ▼
                  ┌─────────────────┐
                  │  SinoTrack API  │
                  │  246.sinotrack  │
                  │      .com       │
                  └─────────────────┘
```

## Owner Flow: Adding GPS Credentials

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vehicle Owner Journey                         │
└─────────────────────────────────────────────────────────────────┘

1. Navigate to Vehicle Form
   │
   ├─→ /owner/vehicles/new (new vehicle)
   └─→ /owner/vehicles/[id]/edit (edit existing)
   
2. Scroll to "GPS Tracking (Optional)" Section
   │
   ├─→ Enter Device ID (TEID/IMEI)
   ├─→ Enter SinoTrack Account
   └─→ Enter SinoTrack Password
   
3. Click "Test Connection"
   │
   ├─→ POST /api/sinotrack/validate
   │   │
   │   ├─→ Authenticate with SinoTrack
   │   ├─→ Fetch device list
   │   └─→ Return validation result
   │
   ├─→ ✅ Success: "Credentials are valid (X devices found)"
   └─→ ❌ Error: "Invalid credentials"
   
4. Save Vehicle
   │
   ├─→ Validate all fields
   ├─→ Check: All GPS fields filled OR all empty
   ├─→ INSERT/UPDATE vehicles table
   └─→ ✅ Success: Redirect to vehicle list

┌─────────────────────────────────────────────────────────────────┐
│ Database Constraint: All 3 fields must be filled or all empty   │
└─────────────────────────────────────────────────────────────────┘
```

## Renter Flow: Viewing Live Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│                      Renter Journey                              │
└─────────────────────────────────────────────────────────────────┘

1. Navigate to Bookings
   │
   └─→ /dashboard/bookings
   
2. Click on Active Booking
   │
   └─→ /dashboard/bookings/[bookingId]
   
3. Authorization Check
   │
   ├─→ Is user authenticated? ────────────────┐
   │                                           │
   ├─→ Is user the renter? ───────────────────┤
   │                                           │
   ├─→ Is booking active/confirmed? ──────────┤
   │                                           │
   ├─→ Is current date within rental period? ─┤
   │                                           │
   └─→ Does vehicle have GPS credentials? ────┤
                                               │
                                               ▼
                                          ┌─────────┐
                                          │   ALL   │
                                          │   YES?  │
                                          └────┬────┘
                                               │
                              ┌────────────────┴────────────────┐
                              │                                 │
                             YES                               NO
                              │                                 │
                              ▼                                 ▼
                    ┌──────────────────┐            ┌──────────────────┐
                    │  Show Tracking   │            │  Show Message    │
                    │    Component     │            │  "Not Available" │
                    └────────┬─────────┘            └──────────────────┘
                             │
                             │
4. Fetch GPS Data            │
   │                         │
   └─→ GET /api/sinotrack/track/[vehicleId]
       │
       ├─→ Verify authorization
       ├─→ Fetch vehicle credentials from DB
       ├─→ Call SinoTrack API
       └─→ Return position data
       
5. Display on Map
   │
   ├─→ Show coordinates
   ├─→ Show speed
   ├─→ Show signal strength
   ├─→ Show last update time
   └─→ "Open in Google Maps" button
   
6. Auto-Refresh (every 30 seconds)
   │
   └─→ Repeat step 4

┌─────────────────────────────────────────────────────────────────┐
│ Security: Only active renters during rental period can track    │
└─────────────────────────────────────────────────────────────────┘
```

## API Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│          GET /api/sinotrack/track/[vehicleId]                   │
└─────────────────────────────────────────────────────────────────┘

Request
   │
   ▼
┌──────────────────────┐
│ 1. Check Auth Token  │
└──────────┬───────────┘
           │
           ├─→ ❌ No token → 401 Unauthorized
           │
           ▼
┌──────────────────────┐
│ 2. Fetch Vehicle     │
│    from Database     │
└──────────┬───────────┘
           │
           ├─→ ❌ Not found → 404 Not Found
           ├─→ ❌ No GPS credentials → 404 Not Available
           │
           ▼
┌──────────────────────┐
│ 3. Check Active      │
│    Booking           │
└──────────┬───────────┘
           │
           ├─→ ❌ No active booking → 403 Forbidden
           ├─→ ❌ Not the renter → 403 Forbidden
           ├─→ ❌ Outside rental dates → 403 Forbidden
           │
           ▼
┌──────────────────────┐
│ 4. Call SinoTrack    │
│    API               │
└──────────┬───────────┘
           │
           ├─→ ❌ API error → 500 Internal Error
           ├─→ ❌ No GPS data → 404 No Data
           │
           ▼
┌──────────────────────┐
│ 5. Return Position   │
│    Data              │
└──────────┬───────────┘
           │
           ▼
       ✅ 200 OK
       {
         position: {...},
         vehicle: {...},
         booking: {...}
       }
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Storage & Access                        │
└─────────────────────────────────────────────────────────────────┘

Environment Variables (Server-side only)
┌────────────────────────────────────────┐
│ SINOTRACK_SERVER                       │  ← Global server URL
│ SINOTRACK_TEST_ACCOUNT (optional)      │  ← Test page only
│ SINOTRACK_TEST_PASSWORD (optional)     │  ← Test page only
│ SINOTRACK_TEST_DEVICE_ID (optional)    │  ← Test page only
└────────────────────────────────────────┘

Database (Supabase)
┌────────────────────────────────────────┐
│ vehicles table                         │
│  ├─ sinotrack_device_id (per vehicle) │  ← Owner enters
│  ├─ sinotrack_account (per vehicle)   │  ← Owner enters
│  └─ sinotrack_password (per vehicle)  │  ← Owner enters
│                                        │
│ bookings table                         │
│  ├─ renter_id                          │  ← For authorization
│  ├─ vehicle_id                         │  ← Links to vehicle
│  ├─ start_date                         │  ← Date validation
│  ├─ end_date                           │  ← Date validation
│  └─ status                             │  ← Must be active/confirmed
└────────────────────────────────────────┘

SinoTrack API (External)
┌────────────────────────────────────────┐
│ POST /APP/AppJson.asp                  │
│  ├─ Proc_Login / Proc_LoginIMEI       │  ← Authentication
│  └─ Proc_GetLastPosition               │  ← Get GPS data
└────────────────────────────────────────┘

Response to Client
┌────────────────────────────────────────┐
│ {                                      │
│   position: {                          │
│     latitude: 9.8167,                  │
│     longitude: 126.0333,               │
│     speedKph: 45.5,                    │
│     gsmSignal: 28,                     │
│     gpsSignal: 30,                     │
│     recordedAt: "2024-11-19T10:30:00Z" │
│   },                                   │
│   vehicle: {...},                      │
│   booking: {...}                       │
│ }                                      │
└────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Architecture                       │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Authentication
┌────────────────────────────────────────┐
│ Supabase Auth                          │
│  ├─ JWT token validation              │
│  └─ User session management            │
└────────────────────────────────────────┘

Layer 2: Authorization
┌────────────────────────────────────────┐
│ Booking Verification                   │
│  ├─ User is the renter                │
│  ├─ Booking is active/confirmed       │
│  └─ Current date within rental period  │
└────────────────────────────────────────┘

Layer 3: Data Access
┌────────────────────────────────────────┐
│ Database Queries                       │
│  ├─ Filter by renter_id               │
│  ├─ Filter by vehicle_id              │
│  └─ Filter by date range               │
└────────────────────────────────────────┘

Layer 4: Credential Protection
┌────────────────────────────────────────┐
│ API Response                           │
│  ├─ Never expose credentials to client│
│  ├─ Only return position data         │
│  └─ Server-side API calls only         │
└────────────────────────────────────────┘

Layer 5: Database Constraints
┌────────────────────────────────────────┐
│ Data Integrity                         │
│  ├─ All 3 GPS fields or none          │
│  ├─ Foreign key constraints            │
│  └─ Row Level Security (RLS)           │
└────────────────────────────────────────┘
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Structure                         │
└─────────────────────────────────────────────────────────────────┘

Owner Side
└─ VehicleForm
   └─ SinoTrackCredentials
      ├─ Input (Device ID)
      ├─ Input (Account)
      ├─ Input (Password)
      ├─ Button (Test Connection)
      │  └─ POST /api/sinotrack/validate
      └─ Alert (Validation Result)

Renter Side
└─ BookingDetailsPage
   ├─ Vehicle Info Card
   ├─ Booking Info Card
   ├─ Owner Info Card
   └─ VehicleTracker (conditional)
      ├─ useEffect (fetch on mount)
      ├─ useEffect (auto-refresh)
      ├─ Map Display
      │  ├─ Coordinates
      │  └─ "Open in Google Maps" Button
      ├─ Stats Grid
      │  ├─ Speed
      │  ├─ Last Updated
      │  ├─ GSM Signal
      │  └─ GPS Signal
      └─ Refresh Button
         └─ GET /api/sinotrack/track/[vehicleId]
```

---

These diagrams provide a visual overview of how the SinoTrack integration works across the entire system.

