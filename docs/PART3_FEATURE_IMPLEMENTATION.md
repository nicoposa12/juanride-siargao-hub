# JuanRide Siargao Hub - System Documentation
## Part 3: Feature Deep-Dive & Database Schema

**Version 1.0 | Date: November 18, 2025**

---

## Table of Contents

1. [Core Features Explained](#core-features-explained)
2. [Database Schema](#database-schema)
3. [User Flows](#user-flows)

---

## Core Features Explained

### Feature 1: User Registration & Profile Creation

**What it does:** Allows new users to create accounts and set up their profiles with role selection (Renter or Owner).

**Implementation (Simple Explanation):**

**Step 1: User fills signup form**
- Fields: Full Name, Email, Password, Phone Number, Role (Renter/Owner)
- Frontend validates: Email format correct? Password at least 8 characters? Phone number valid?

**Step 2: Frontend sends data to Supabase Auth**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullName,
      phone_number: phoneNumber,
      role: selectedRole
    }
  }
})
```

**Step 3: Supabase creates auth user**
- Hashes password (encrypts it securely)
- Generates unique user ID
- Sends verification email

**Step 4: Create user profile in database**
```typescript
await supabase.from('users').insert({
  id: userId,
  email: email,
  full_name: fullName,
  phone_number: phoneNumber,
  role: selectedRole,
  created_at: new Date()
})
```

**Step 5: Send welcome email**
- If role is Owner: Email includes "How to list your first vehicle" guide
- If role is Renter: Email includes "Explore vehicles" link

**User Flow:**
1. User visits `/signup`
2. Fills form and clicks "Create Account"
3. Sees loading spinner
4. Receives "Check your email" message
5. Clicks verification link in email
6. Redirected to `/welcome` onboarding page

---

### Feature 2: Vehicle Search with Advanced Filtering

**What it does:** Allows renters to discover vehicles using multiple filters and see real-time availability.

**Implementation:**

**Filter Options:**
- **Type:** Motorcycle, Car, Bicycle (multi-select checkbox)
- **Price Range:** Slider with min-max (₱300 - ₱2000/day)
- **Location:** Dropdown (General Luna, Cloud 9, Dapa, etc.)
- **Dates:** Calendar picker (start date + end date)

**How availability checking works:**

```typescript
async function filterByAvailability(vehicles, startDate, endDate) {
  // For each vehicle, check if it has conflicting bookings
  const availableVehicles = []
  
  for (const vehicle of vehicles) {
    // Query bookings that overlap with requested dates
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'confirmed')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    
    // Also check owner's blocked dates
    const { data: blockedDates } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('vehicle_id', vehicle.id)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
    
    // If no conflicts, vehicle is available
    if (conflicts.length === 0 && blockedDates.length === 0) {
      availableVehicles.push(vehicle)
    }
  }
  
  return availableVehicles
}
```

**Translation:** We're asking the database, "Show me all bookings for this vehicle that touch the dates I want to rent it." If there are no overlapping bookings, the vehicle is available.

**User Flow:**
1. User visits `/vehicles`
2. Sees all available vehicles (default view)
3. Selects "Motorcycle" filter → Results refresh instantly
4. Adjusts price range to ₱400-₱600 → Results update
5. Selects dates Dec 15-20 → System checks availability
6. Only vehicles free during those dates are shown
7. User clicks on a vehicle card → Redirected to `/vehicles/abc123`

---

### Feature 3: Booking Creation & Management

**What it does:** Handles the complete booking lifecycle from request to completion.

**Booking Statuses:**
- **Pending:** Booking created, awaiting owner confirmation
- **Confirmed:** Owner accepted, payment completed
- **Active:** Current ongoing rental
- **Completed:** Rental finished
- **Cancelled:** Booking cancelled by either party

**Booking Creation Process:**

**Step 1: User selects dates and clicks "Book Now"**
```typescript
// Frontend calculates price in real-time
const days = calculateDays(startDate, endDate)
let basePrice = 0

if (days >= 28 && vehicle.price_per_month) {
  basePrice = vehicle.price_per_month
} else if (days >= 7 && vehicle.price_per_week) {
  basePrice = vehicle.price_per_week
} else {
  basePrice = vehicle.price_per_day * days
}

const platformFee = basePrice * 0.10 // 10% JuanRide commission
const totalPrice = basePrice + platformFee
```

**Step 2: API creates booking record**
```typescript
const booking = await supabase.from('bookings').insert({
  renter_id: userId,
  vehicle_id: vehicleId,
  start_date: startDate,
  end_date: endDate,
  base_price: basePrice,
  platform_fee: platformFee,
  total_price: totalPrice,
  status: 'pending'
}).select().single()
```

**Step 3: Redirect to payment page**
- User goes to `/checkout/[bookingId]`
- Selects payment method (GCash, Maya, or Card)
- Completes payment → Booking status becomes "confirmed"

**Owner Confirmation (Optional Flow):**
- Some owners require manual confirmation before payment
- Owner receives email: "New booking request for your Honda Click"
- Owner logs in → Sees pending booking in dashboard
- Clicks "Confirm" → Renter gets notified → Can proceed to payment

**User Flow (Renter):**
1. Search for vehicle → Find perfect motorcycle
2. Click "Book Now" → Select dates
3. Review pricing breakdown
4. Click "Proceed to Payment"
5. Choose GCash → Complete payment
6. Receive confirmation email with pickup instructions
7. Booking appears in "Upcoming Rentals" section

**User Flow (Owner):**
1. Receive email: "New booking request"
2. Log into Owner Dashboard
3. See pending booking with renter details
4. Review renter's profile and rating
5. Click "Confirm Booking" or "Decline"
6. If confirmed → Prepare vehicle for pickup
7. On booking start date → Meet renter at agreed location

---

### Feature 4: Payment Processing with PayMongo

**What it does:** Secure payment collection supporting GCash, Maya, and credit/debit cards.

**Why PayMongo?**
- PCI-DSS Level 1 certified (highest security standard)
- Supports Philippine payment methods (GCash, Maya)
- Lower fees than international gateways
- Instant payment confirmation webhooks

**Payment Flow:**

**Step 1: User selects payment method**
- **GCash/Maya:** Redirect to GCash app, scan QR code, confirm payment
- **Credit Card:** Enter card details on PayMongo's secure form

**Step 2: Create payment source**
```typescript
// API calls PayMongo to create payment source
const response = await fetch('https://api.paymongo.com/v1/sources', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: {
      attributes: {
        type: 'gcash', // or 'grab_pay', 'card'
        amount: totalPrice * 100, // Convert to cents
        currency: 'PHP',
        redirect: {
          success: 'https://juanride.com/payment/success',
          failed: 'https://juanride.com/payment/failed'
        }
      }
    }
  })
})

const { checkout_url, id: sourceId } = response.data.attributes
```

**Step 3: Store payment record**
```typescript
await supabase.from('payments').insert({
  booking_id: bookingId,
  amount: totalPrice,
  payment_method: 'gcash',
  status: 'pending',
  paymongo_source_id: sourceId
})
```

**Step 4: Redirect user**
- User goes to `checkout_url` (PayMongo's page)
- Completes payment in GCash app
- GCash confirms payment to PayMongo

**Step 5: PayMongo webhook (happens in background)**
```typescript
// PayMongo sends POST request to our /api/payments/webhook endpoint
{
  "type": "source.chargeable",
  "data": {
    "id": "src_abc123",
    "attributes": {
      "status": "chargeable",
      "amount": 385000 // ₱3,850 in cents
    }
  }
}

// Our webhook handler updates records:
await supabase.from('payments')
  .update({ status: 'paid', paid_at: new Date() })
  .eq('paymongo_source_id', 'src_abc123')

await supabase.from('bookings')
  .update({ payment_status: 'paid', status: 'confirmed' })
  .eq('id', bookingId)
```

**Step 6: User sees confirmation**
- Redirected back to our site at `/payment/success?booking=abc123`
- Page queries database → Confirms payment was recorded
- Shows success message + booking details
- Sends confirmation email

**Security Measures:**
- We never see credit card numbers (handled by PayMongo)
- Webhook signatures verified (ensures requests really from PayMongo)
- Payment amounts double-checked (booking total must match payment amount)
- Idempotency keys prevent duplicate charges

---

### Feature 5: Real-Time Chat Messaging

**What it does:** Enables instant communication between renters and owners for a specific booking.

**How Real-Time Works (Simple Explanation):**

Traditional way (slow):
```
User sends message → Saved to database
Other user's page checks every 10 seconds: "Any new messages?"
If yes → Fetch and display
```

Real-time way (instant):
```
User sends message → Saved to database
Database broadcasts: "New message!"
Other user's page is listening → Instantly displays message
(No constant checking needed)
```

**Technical Implementation:**

**Setup: Subscribe to messages**
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`booking:${bookingId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Listen for new messages
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        // New message arrived!
        const newMessage = payload.new
        setMessages((prev) => [...prev, newMessage])
      }
    )
    .subscribe()
  
  // Cleanup when user leaves chat
  return () => {
    channel.unsubscribe()
  }
}, [bookingId])
```

**Sending a message:**
```typescript
async function sendMessage(text) {
  const { data: newMessage } = await supabase
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: userId,
      message: text,
      created_at: new Date()
    })
    .select()
    .single()
  
  // Supabase Realtime automatically broadcasts this to all subscribers
}
```

**User Flow:**
1. Renter creates booking → Chat becomes available
2. Renter sends: "What's the pickup location?"
3. Message instantly appears in owner's chat (if online)
4. Owner replies: "General Luna Public Market"
5. Both see messages in real-time (like WhatsApp)
6. Offline notifications via email

---

### Feature 6: Vehicle Listing Creation (For Owners)

**What it does:** Allows vehicle owners to list their vehicles with photos, pricing, and details.

**Form Fields:**
- **Basic Info:** Vehicle Name, Type (motorcycle/car/bicycle), Brand, Model, Year
- **Pricing:** Daily Rate, Weekly Rate (optional), Monthly Rate (optional)
- **Details:** Description, Features (checkboxes: Helmet included, GPS, etc.)
- **Location:** Pickup location (address or landmark)
- **Photos:** Upload up to 5 images

**Image Upload Process:**

```typescript
async function uploadVehicleImages(files) {
  const imageUrls = []
  
  for (const file of files) {
    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName)
    
    imageUrls.push(publicUrl)
  }
  
  return imageUrls
}
```

**Approval Workflow:**

1. Owner submits vehicle listing → `is_approved: false`
2. Vehicle is NOT visible to renters yet
3. Admin receives notification
4. Admin reviews listing (checks photos are real, pricing is reasonable)
5. Admin clicks "Approve" or "Reject"
6. If approved → Vehicle becomes visible in search results
7. Owner receives approval email

**Why approval is necessary:**
- Prevent fake listings
- Ensure photo quality
- Verify pricing is fair (not ₱1/day scam listings)
- Maintain platform quality

**User Flow (Owner):**
1. Click "List Your Vehicle" in owner dashboard
2. Fill out form with vehicle details
3. Upload 5 photos of the motorcycle
4. Set prices: ₱500/day, ₱3,000/week, ₱10,000/month
5. Submit listing
6. See "Pending Approval" status in dashboard
7. Wait 24-48 hours
8. Receive email: "Your Honda Click 150 has been approved!"
9. Vehicle now appears in search results

---

### Feature 7: Admin Dashboard & Platform Management

**What it does:** Provides administrators with tools to moderate content, monitor platform health, and manage users.

**Key Admin Sections:**

**1. Pending Approvals**
- Shows all vehicles awaiting approval
- Displays vehicle photos, details, owner info
- One-click approve/reject buttons
- Rejection requires reason (sent to owner)

**2. Platform Analytics**
- **User Stats:**
  - Total users: 1,247
  - New this month: 89
  - Growth rate: +12%
  - Breakdown: 850 renters, 380 owners, 17 admins
- **Vehicle Stats:**
  - Total approved vehicles: 156
  - Pending approval: 7
  - Average daily rate: ₱485
- **Revenue Stats:**
  - Total platform revenue: ₱1,245,600
  - Platform fees collected: ₱124,560 (10%)
  - This month's revenue: ₱186,400

**3. Recent Activity Feed**
- "Juan Dela Cruz booked a Honda Click 150 (₱3,500)"
- "Maria Santos listed a Toyota Vios"
- "Pedro Reyes completed a 7-day rental"
- Shows last 50 activities in real-time

**4. User Management**
- Search users by name or email
- View user details (bookings, vehicles, ratings)
- Suspend accounts (temporary ban)
- Delete accounts (permanent removal)

**Analytics Query Example:**
```typescript
// Fetch revenue data
const { data: completedBookings } = await supabase
  .from('bookings')
  .select('total_price, platform_fee, created_at')
  .eq('status', 'completed')

const totalRevenue = completedBookings.reduce((sum, b) => 
  sum + parseFloat(b.total_price), 0
)

const totalFees = completedBookings.reduce((sum, b) => 
  sum + parseFloat(b.platform_fee), 0
)

// Calculate monthly breakdown
const monthlyRevenue = completedBookings.reduce((acc, booking) => {
  const month = new Date(booking.created_at).toLocaleString('default', { month: 'short' })
  acc[month] = (acc[month] || 0) + parseFloat(booking.total_price)
  return acc
}, {})

// Result: { Jan: 45000, Feb: 67000, Mar: 89000, ... }
```

---

## Database Schema (The "Pantry Organization")

Think of our database as a filing cabinet. Each table is a drawer, and each drawer holds specific types of documents.

### Main Tables:

#### 1. **users** (The People Directory)
Stores all user accounts (renters, owners, admins).

**Columns:**
- `id` (UUID): Unique identifier, matches Supabase Auth user ID
- `email` (Text): User's email address
- `full_name` (Text): Display name
- `phone_number` (Text): Contact number
- `role` (Text): One of: 'renter', 'owner', 'admin'
- `profile_picture` (Text URL): Link to profile photo
- `created_at` (Timestamp): When account was created
- `rating` (Decimal 0-5): Average rating (null for renters)

**Relationships:**
- One user can have many vehicles (if role = owner)
- One user can have many bookings (if role = renter)

**Example Row:**
```
id: "550e8400-e29b-41d4-a716-446655440000"
email: "juan@example.com"
full_name: "Juan Dela Cruz"
phone_number: "+639171234567"
role: "owner"
rating: 4.8
created_at: "2024-11-01T08:30:00Z"
```

---

#### 2. **vehicles** (The Vehicle Catalog)
Stores all vehicle listings.

**Columns:**
- `id` (UUID): Unique vehicle ID
- `owner_id` (UUID): Links to users table → Who owns this vehicle
- `name` (Text): Display name, e.g., "Honda Click 150"
- `type` (Text): 'motorcycle', 'car', or 'bicycle'
- `description` (Text): Long description
- `price_per_day` (Decimal): Daily rental rate
- `price_per_week` (Decimal, optional): Weekly rate (if owner offers)
- `price_per_month` (Decimal, optional): Monthly rate
- `location` (Text): Pickup location
- `features` (JSON Array): ["Helmet included", "GPS", "Full tank"]
- `images` (JSON Array): [" url1.jpg", "url2.jpg", ...]
- `is_approved` (Boolean): Admin approval status
- `status` (Text): 'available', 'in_maintenance', 'inactive'
- `created_at` (Timestamp)

**Relationships:**
- Belongs to one owner (users table)
- Has many bookings
- Has many reviews

**Example Row:**
```
id: "veh_001"
owner_id: "550e8400..."
name: "Honda Click 150"
type: "motorcycle"
price_per_day: 500
price_per_week: 3000
location: "General Luna"
features: ["Automatic", "Helmet", "Fuel-efficient"]
is_approved: true
status: "available"
```

---

#### 3. **bookings** (The Reservation Ledger)
Tracks all rental bookings.

**Columns:**
- `id` (UUID): Unique booking ID
- `renter_id` (UUID): Who's renting
- `vehicle_id` (UUID): Which vehicle
- `start_date` (Date): Rental start
- `end_date` (Date): Rental end
- `base_price` (Decimal): Rental cost (before fees)
- `platform_fee` (Decimal): JuanRide's 10% commission
- `total_price` (Decimal): Total amount charged
- `status` (Text): 'pending', 'confirmed', 'active', 'completed', 'cancelled'
- `payment_status` (Text): 'unpaid', 'paid', 'refunded'
- `created_at` (Timestamp)

**Relationships:**
- Belongs to one renter (users table)
- Belongs to one vehicle
- Has one payment
- Has many messages

**Example Row:**
```
id: "book_001"
renter_id: "user_002"
vehicle_id: "veh_001"
start_date: "2024-12-15"
end_date: "2024-12-20"
base_price: 2500
platform_fee: 250
total_price: 2750
status: "confirmed"
payment_status: "paid"
```

---

#### 4. **payments** (The Transaction Log)
Records all payment transactions.

**Columns:**
- `id` (UUID)
- `booking_id` (UUID): Links to bookings table
- `amount` (Decimal): Payment amount
- `currency` (Text): "PHP"
- `payment_method` (Text): 'gcash', 'maya', 'card'
- `status` (Text): 'pending', 'paid', 'failed', 'refunded'
- `paymongo_source_id` (Text): PayMongo transaction reference
- `paid_at` (Timestamp): When payment completed
- `created_at` (Timestamp)

**Relationships:**
- Belongs to one booking

**Example Row:**
```
id: "pay_001"
booking_id: "book_001"
amount: 2750
payment_method: "gcash"
status: "paid"
paymongo_source_id: "src_abc123xyz"
paid_at: "2024-12-10T14:35:22Z"
```

---

#### 5. **messages** (The Chat Logs)
Stores all chat messages between renters and owners.

**Columns:**
- `id` (UUID)
- `booking_id` (UUID): Which booking conversation this belongs to
- `sender_id` (UUID): Who sent the message
- `message` (Text): Message content
- `created_at` (Timestamp)

**Relationships:**
- Belongs to one booking
- Belongs to one sender (users table)

**Example Row:**
```
id: "msg_001"
booking_id: "book_001"
sender_id: "user_002"
message: "What time can I pick up the motorcycle?"
created_at: "2024-12-14T09:15:00Z"
```

---

### Database Relationships Diagram

```
users (The People)
  ├─ owns → vehicles (One owner has many vehicles)
  ├─ rents → bookings (One renter has many bookings)
  └─ sends → messages (One user sends many messages)

vehicles (The Catalog)
  ├─ owned by → users (Each vehicle has one owner)
  ├─ booked in → bookings (One vehicle has many bookings)
  └─ has → reviews (One vehicle has many reviews)

bookings (The Reservations)
  ├─ made by → users (renter)
  ├─ for → vehicles
  ├─ has → payment (one-to-one)
  └─ contains → messages (one-to-many)

payments (The Transactions)
  └─ for → bookings (one-to-one)

messages (The Chat)
  ├─ in → bookings (conversation thread)
  └─ from → users (sender)
```

---

**Continue to [Part 4: Business & Marketing Strategy](PART4_BUSINESS_STRATEGY.md)**
