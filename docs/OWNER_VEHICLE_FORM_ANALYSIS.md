# Owner Vehicle Form - Complete Analysis

## Overview

Comprehensive analysis of the vehicle listing form for vehicle owners, including all fields, validation rules, features, and requirements.

**File:** `src/components/owner/VehicleForm.tsx`  
**Route:** `/owner/vehicles/new` (add) | `/owner/vehicles/[id]/edit` (edit)  
**Date:** November 20, 2024

---

## Form Structure

The vehicle form is divided into **7 main sections**:

1. **Basic Information** - Vehicle type, make, model, year, plate number, description
2. **Location & Pricing** - Location and rental rates (daily/weekly/monthly)
3. **Features & Amenities** - Optional features/equipment
4. **Vehicle Images** - Photo uploads (minimum 3 required)
5. **SinoTrack GPS Tracking** - Optional GPS tracking credentials
6. **Rental Terms** - Owner-defined rental conditions
7. **Submit** - Save/cancel actions

---

## Section 1: Basic Information

### Required Fields (*)

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| **Vehicle Type*** | Select | Must be one of 4 types | Scooter |
| **Plate Number*** | Text | Unique, required | ABC-1234 |
| **Make/Brand*** | Text | Required | Honda, Toyota |
| **Model*** | Text | Required | Click 125i, Vios |

### Optional Fields

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| **Year** | Number | 1990-2025 (current year + 1) | 2023 |
| **Description** | Textarea | None | "Well-maintained vehicle..." |

### Vehicle Type Options

From `VEHICLE_TYPES` constant:
- ✅ **Scooter** - `scooter`
- ✅ **Motorcycle** - `motorcycle`
- ✅ **Car** - `car`
- ✅ **Van** - `van`

### Database Constraints

```sql
type TEXT NOT NULL CHECK (type IN ('scooter', 'motorcycle', 'car', 'van'))
make TEXT
model TEXT
year INTEGER CHECK (year >= 1900 AND year <= 2100)
plate_number TEXT UNIQUE NOT NULL
description TEXT
```

### Validation Rules

```typescript
// Client-side
if (!type || !make || !model || !plateNumber) {
  error: 'Please fill in all required fields'
}

// Database-side
- plate_number must be unique
- year must be between 1900-2100
- type must be valid enum value
```

---

## Section 2: Location & Pricing

### Required Fields (*)

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| **Daily Rate (₱)*** | Number | Must be > 0, step 50 | 500 |

### Optional Fields

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| **Location** | Select | From predefined list | General Luna |
| **Weekly Rate (₱)** | Number | Must be > 0, step 100 | 3,000 |
| **Monthly Rate (₱)** | Number | Must be > 0, step 500 | 10,000 |

### Location Options

From `SIARGAO_LOCATIONS` constant:
- ✅ General Luna
- ✅ Cloud 9
- ✅ Dapa
- ✅ Del Carmen
- ✅ Pilar
- ✅ San Isidro
- ✅ San Benito
- ✅ Burgos
- ✅ Santa Monica

### Pricing Strategy

**Daily Rate (Required)**
- Base rental rate
- Minimum step: ₱50
- Must be greater than 0

**Weekly Rate (Optional)**
- Discounted rate for 7+ day rentals
- Typically 15-20% discount from daily × 7
- Example: ₱500/day → ₱3,000/week (saves ₱500)

**Monthly Rate (Optional)**
- Discounted rate for 30+ day rentals
- Typically 30-40% discount from daily × 30
- Example: ₱500/day → ₱10,000/month (saves ₱5,000)

### Database Constraints

```sql
location TEXT
price_per_day DECIMAL(10, 2) NOT NULL CHECK (price_per_day > 0)
price_per_week DECIMAL(10, 2) CHECK (price_per_week > 0)
price_per_month DECIMAL(10, 2) CHECK (price_per_month > 0)
```

---

## Section 3: Features & Amenities

### All Features are Optional

Stored as JSONB object in database:

| Feature | Field Name | Description |
|---------|------------|-------------|
| **Helmet Included** | `helmet_included` | Free helmet(s) provided |
| **Phone Holder** | `phone_holder` | Mounted phone holder |
| **Storage Box** | `storage_box` | Under-seat or rear storage |
| **GPS Enabled** | `gps_enabled` | GPS tracking device installed |
| **Bluetooth** | `bluetooth` | Bluetooth connectivity |
| **USB Charging** | `usb_charging` | USB charging port |

### Default State

```typescript
{
  helmet_included: false,
  phone_holder: false,
  storage_box: false,
  gps_enabled: false,
  bluetooth: false,
  usb_charging: false,
}
```

### Database Schema

```sql
features JSONB DEFAULT '{}'
```

**Format:**
```json
{
  "helmet_included": true,
  "phone_holder": true,
  "storage_box": false,
  "gps_enabled": true,
  "bluetooth": false,
  "usb_charging": true
}
```

---

## Section 4: Vehicle Images

### Requirements

| Property | Value | Note |
|----------|-------|------|
| **Minimum Images*** | 3 | At least 3 photos required |
| **Maximum Images** | 20 | Up to 20 photos allowed |
| **Max File Size** | 5 MB | Per image |
| **Supported Formats** | JPG, PNG, WebP | Common image formats |

### Validation

```typescript
// Client-side
if (imageUrls.length < 3) {
  error: 'Please upload at least 3 images of your vehicle.'
}

// Constants
MAX_IMAGES_PER_VEHICLE = 20
MIN_IMAGES_PER_VEHICLE = 3
MAX_IMAGE_SIZE_MB = 5
```

### Database Schema

```sql
image_urls TEXT[] DEFAULT '{}'
```

**Stored as array:**
```typescript
[
  'https://bucket.supabase.co/vehicles/abc123-1.jpg',
  'https://bucket.supabase.co/vehicles/abc123-2.jpg',
  'https://bucket.supabase.co/vehicles/abc123-3.jpg',
]
```

### Best Practices for Images

1. **First Image** - Main hero shot (front/side angle)
2. **Additional Images:**
   - Front view
   - Side view
   - Back view
   - Interior/dashboard
   - Storage compartment
   - Special features
   - Condition details

---

## Section 5: SinoTrack GPS Tracking

### Optional GPS Tracking System

All fields are **optional** but if provided, **ALL THREE must be filled**.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **Device ID** | Text | TEID/IMEI number | 868123456789012 |
| **Account** | Text | SinoTrack username | owner@email.com |
| **Password** | Text | SinoTrack password | ••••••••• |

### Validation Rule

**All or Nothing:**
```typescript
const hasSinotrackFields = sinotrackDeviceId || sinotrackAccount || sinotrackPassword
const hasAllSinotrackFields = sinotrackDeviceId && sinotrackAccount && sinotrackPassword

if (hasSinotrackFields && !hasAllSinotrackFields) {
  error: 'Please fill in all SinoTrack fields or leave them all empty.'
}
```

### Database Constraints

```sql
sinotrack_device_id TEXT
sinotrack_account TEXT
sinotrack_password TEXT

-- Constraint: All three must be NULL or all three must be filled
CONSTRAINT check_sinotrack_fields_consistency 
CHECK (
  (sinotrack_device_id IS NULL AND sinotrack_account IS NULL AND sinotrack_password IS NULL) OR
  (sinotrack_device_id IS NOT NULL AND sinotrack_account IS NOT NULL AND sinotrack_password IS NOT NULL)
)
```

### Purpose

- **Real-time GPS tracking** of rented vehicles
- **Anti-theft** protection
- **Fleet management** for owners with multiple vehicles
- **Route history** and mileage tracking
- **Geofencing** alerts (if configured)

---

## Section 6: Rental Terms

### Optional Field

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **Rental Terms** | Textarea | Owner-defined conditions | "Valid driver's license required..." |

### Common Rental Terms Examples

```
✓ Valid driver's license required
✓ Minimum 1 day rental
✓ Security deposit: ₱2,000
✓ Helmet must be returned
✓ Fuel policy: Return with same fuel level
✓ Late return fee: ₱200/hour
✓ Damage responsibility: Renter liable
✓ Age requirement: 21+ years old
✓ Insurance coverage: Comprehensive
✓ Maintenance: Daily checks required
```

### Database Schema

```sql
rental_terms TEXT
```

---

## Section 7: Submit Actions

### Buttons

| Button | Type | Action |
|--------|------|--------|
| **Cancel** | Outline | Navigate back to `/owner/vehicles` |
| **Add Vehicle** | Primary | Submit form (new vehicle) |
| **Update Vehicle** | Primary | Submit form (editing) |

### Submission Flow

**For New Vehicles:**
```
1. Validate all required fields
2. Validate image count (min 3)
3. Validate SinoTrack consistency
4. Insert into database
5. Set status: 'available'
6. Set is_approved: false (requires admin approval)
7. Clear form draft from sessionStorage
8. Show success toast
9. Redirect to /owner/vehicles
```

**For Editing:**
```
1. Same validation as new
2. Update existing vehicle record
3. Update updated_at timestamp
4. Show success toast
5. Redirect to /owner/vehicles
```

---

## Advanced Features

### 1. Auto-Save Draft (New Vehicles Only)

**Purpose:** Prevent data loss if user navigates away

**How it Works:**
- Auto-saves form to `sessionStorage` every 1 second
- Restores draft on page reload
- Clears draft after successful submission
- Only for new vehicles (not editing)

**Storage Key:** `vehicle_form_draft`

**Draft Notice:**
```
Draft restored - Your form data has been recovered 
from a previous session. [Clear Draft]
```

### 2. Approval System

**All new vehicles require admin approval before going live:**

```typescript
status: 'available'      // Owner sets this
is_approved: false       // Admin must approve
```

**Approval Flow:**
```
Owner submits → Pending approval → Admin reviews → 
Admin approves → Vehicle goes live → Visible to renters
```

**Alert Message:**
```
Your vehicle listing will be reviewed by our admin 
team before it becomes visible to renters.
```

### 3. Form State Management

**State Variables (17 total):**
```typescript
// Basic info
type, make, model, year, plateNumber, description

// Pricing & location
location, pricePerDay, pricePerWeek, pricePerMonth

// Additional
rentalTerms, imageUrls, features

// SinoTrack
sinotrackDeviceId, sinotrackAccount, sinotrackPassword

// UI states
submitting, showDraftNotice, initialDraft
```

---

## Complete Validation Summary

### Client-Side Validation

**Required Fields Check:**
```typescript
✓ type (vehicle type)
✓ make (brand)
✓ model
✓ plateNumber
✓ pricePerDay
✓ imageUrls.length >= 3
```

**Conditional Validation:**
```typescript
✓ SinoTrack: All 3 fields or none
✓ Year: 1990 to current year + 1 (if provided)
✓ Prices: Must be positive numbers (if provided)
```

### Database-Side Validation

**Constraints:**
```sql
✓ type: Must be in enum
✓ plate_number: Unique, not null
✓ price_per_day: Must be > 0, not null
✓ price_per_week: Must be > 0 (if provided)
✓ price_per_month: Must be > 0 (if provided)
✓ year: Between 1900-2100 (if provided)
✓ SinoTrack: All 3 or none consistency check
```

---

## Database Schema Summary

### vehicles Table

```sql
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    type TEXT NOT NULL CHECK (type IN ('scooter', 'motorcycle', 'car', 'van')),
    make TEXT,
    model TEXT,
    year INTEGER CHECK (year >= 1900 AND year <= 2100),
    plate_number TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing
    price_per_day DECIMAL(10, 2) NOT NULL CHECK (price_per_day > 0),
    price_per_week DECIMAL(10, 2) CHECK (price_per_week > 0),
    price_per_month DECIMAL(10, 2) CHECK (price_per_month > 0),
    
    -- Status & location
    status TEXT NOT NULL CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')) 
        DEFAULT 'available',
    location TEXT,
    
    -- Media & features
    image_urls TEXT[] DEFAULT '{}',
    features JSONB DEFAULT '{}',
    rental_terms TEXT,
    
    -- GPS tracking (optional)
    sinotrack_device_id TEXT,
    sinotrack_account TEXT,
    sinotrack_password TEXT,
    
    -- Additional fields (not in form)
    transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
    fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
    
    -- Admin approval
    is_approved BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_sinotrack_fields_consistency 
    CHECK (
      (sinotrack_device_id IS NULL AND sinotrack_account IS NULL AND sinotrack_password IS NULL) OR
      (sinotrack_device_id IS NOT NULL AND sinotrack_account IS NOT NULL AND sinotrack_password IS NOT NULL)
    )
);
```

---

## Form Data Flow

### Submission Process

```
User Input
  ↓
Form State (React useState)
  ↓
Auto-save to sessionStorage (every 1s)
  ↓
[User clicks Submit]
  ↓
Client-side Validation
  ↓
Transform to vehicleData object
  ↓
Supabase Insert/Update
  ↓
Database Validation (constraints)
  ↓
Success: Clear draft, show toast, redirect
  OR
Error: Show error message, keep form data
```

### Data Transformation

**Form → Database:**
```typescript
{
  owner_id: user.id,                    // From auth context
  type,                                  // Direct from form
  make,                                  // Direct from form
  model,                                 // Direct from form
  year: year ? parseInt(year) : null,    // Parse to int or null
  plate_number: plateNumber,             // Direct from form
  description,                           // Direct from form
  location,                              // Direct from form
  price_per_day: parseFloat(pricePerDay), // Parse to float
  price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
  price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
  rental_terms: rentalTerms || null,     // Empty string → null
  image_urls: imageUrls,                 // Array as-is
  features,                              // Object as-is (JSONB)
  sinotrack_device_id: sinotrackDeviceId || null,
  sinotrack_account: sinotrackAccount || null,
  sinotrack_password: sinotrackPassword || null,
  status: 'available',                   // Default status
  is_approved: false,                    // Requires admin approval
}
```

---

## User Experience Features

### 1. Draft Recovery

**Scenario:** User starts filling form, accidentally closes tab

**Solution:**
- Form data auto-saved to sessionStorage
- On return, form pre-populated with saved data
- Blue alert shows: "Draft restored"
- User can continue or clear draft

### 2. Validation Feedback

**Real-time Feedback:**
- Required fields marked with *
- Input validation on blur
- Error messages in toast notifications
- Disabled submit button while submitting

### 3. Image Management

**Features:**
- Drag-and-drop upload
- Multiple image selection
- Image preview thumbnails
- Reorder images
- Delete individual images
- Progress indicators

### 4. Mobile Responsive

**Optimized for:**
- Desktop (full layout)
- Tablet (2-column grid)
- Mobile (single column)

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Required Fields Missing" | Missing required fields | Fill type, make, model, plate, daily rate |
| "Images Required" | Less than 3 images | Upload at least 3 vehicle photos |
| "Incomplete GPS Setup" | Partial SinoTrack data | Fill all 3 GPS fields or clear all |
| "Plate number already exists" | Duplicate plate number | Use unique plate number |
| "Authentication Required" | Not logged in | Log in as owner |

### Database Errors

```typescript
try {
  await supabase.from('vehicles').insert(vehicleData)
} catch (error) {
  // Handle unique constraint violations
  // Handle check constraint violations
  // Handle foreign key violations
  // Show user-friendly error message
}
```

---

## Component Dependencies

### UI Components

From `@/components/ui`:
- Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
- Button
- Input
- Label
- Textarea
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Checkbox
- Separator
- Alert, AlertDescription
- Skeleton

### Custom Components

- **ImageUpload** - Multi-image upload with preview
- **SinoTrackCredentials** - GPS tracking fields

### Hooks

- `useAuth` - User authentication and profile
- `useToast` - Toast notifications
- `useRouter` - Next.js navigation

### Libraries

- `lucide-react` - Icons (Save, Loader2, AlertCircle, ArrowLeft)
- `@/lib/supabase/client` - Database client
- `@/lib/constants` - Constants (vehicle types, locations)

---

## Future Enhancements

### Potential Additions

1. **Transmission Type** ⚙️
   - Manual / Automatic selector
   - Already in database schema

2. **Fuel Type** ⛽
   - Gasoline / Diesel / Electric / Hybrid
   - Already in database schema

3. **Mileage** 🛣️
   - Current odometer reading
   - Helpful for maintenance tracking

4. **Insurance Details** 🛡️
   - Insurance provider
   - Policy number
   - Expiration date

5. **Vehicle Specs** 📋
   - Engine size
   - Seating capacity
   - Color

6. **Availability Calendar** 📅
   - Block specific dates
   - Recurring unavailability

7. **Instant Booking** ⚡
   - Enable/disable instant booking
   - Require owner approval

8. **Minimum Rental Period** ⏰
   - Set minimum days
   - Custom rental periods

---

## Testing Checklist

### Form Validation

- [ ] Submit with empty form → shows required fields error
- [ ] Submit with < 3 images → shows images required error
- [ ] Submit with partial GPS data → shows incomplete GPS error
- [ ] Submit with duplicate plate → shows plate exists error
- [ ] Submit valid data → successfully creates vehicle

### Draft Feature

- [ ] Fill form partially → refresh page → data restored
- [ ] Submit form → draft cleared
- [ ] Click "Clear Draft" → form resets

### Image Upload

- [ ] Upload 1 image → shows count 1/3
- [ ] Upload 3 images → shows count 3/3, can submit
- [ ] Upload 20 images → reaches max limit
- [ ] Upload > 5MB image → shows size error
- [ ] Reorder images → order saved correctly
- [ ] Delete image → count decreases

### Pricing

- [ ] Enter daily rate only → saves successfully
- [ ] Enter all three rates → saves all correctly
- [ ] Enter negative price → validation error
- [ ] Enter zero price → validation error

### Features

- [ ] Check features → saves as true in database
- [ ] Uncheck features → saves as false in database
- [ ] Default state → all false

### GPS Tracking

- [ ] Fill all 3 fields → saves successfully
- [ ] Fill 1 field → shows error
- [ ] Fill 2 fields → shows error
- [ ] Leave all empty → saves successfully

---

## Summary

### Required Information

**Minimum to List Vehicle:**
1. ✅ Vehicle type (scooter/motorcycle/car/van)
2. ✅ Make/brand
3. ✅ Model
4. ✅ Plate number (unique)
5. ✅ Daily rental rate
6. ✅ At least 3 photos

**Total:** 6 required fields/items

### Optional Enhancements

- Year
- Description
- Location
- Weekly/monthly rates
- 6 features (helmet, phone holder, storage, GPS, Bluetooth, USB)
- GPS tracking (3 fields)
- Rental terms
- Up to 20 photos

### Key Features

✅ **Auto-save draft** - Prevents data loss  
✅ **Admin approval** - Quality control  
✅ **GPS tracking** - Fleet management  
✅ **Flexible pricing** - Daily/weekly/monthly rates  
✅ **Rich media** - Up to 20 images  
✅ **Mobile responsive** - Works on all devices  
✅ **Validation** - Client + server-side  

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│     VEHICLE LISTING FORM REQUIREMENTS   │
├─────────────────────────────────────────┤
│ REQUIRED:                               │
│  • Vehicle Type (dropdown)              │
│  • Make/Brand (text)                    │
│  • Model (text)                         │
│  • Plate Number (text, unique)          │
│  • Daily Rate ₱ (number, > 0)           │
│  • Images (min 3, max 20)               │
├─────────────────────────────────────────┤
│ OPTIONAL:                               │
│  • Year (1990-2025)                     │
│  • Description (textarea)               │
│  • Location (9 options in Siargao)      │
│  • Weekly Rate ₱                        │
│  • Monthly Rate ₱                       │
│  • 6 Features (checkboxes)              │
│  • GPS Tracking (3 fields, all or none) │
│  • Rental Terms (textarea)              │
├─────────────────────────────────────────┤
│ FEATURES:                               │
│  ✓ Auto-save draft                      │
│  ✓ Admin approval required              │
│  ✓ Mobile responsive                    │
│  ✓ Image upload with preview            │
│  ✓ Validation (client + server)         │
└─────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** November 20, 2024  
**Status:** Complete Analysis
