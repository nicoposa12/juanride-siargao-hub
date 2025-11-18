# JuanRide Siargao Hub - System Documentation
## Part 2: Frontend & Backend Implementation Details

**Version 1.0 | Date: November 18, 2025**

---

## Table of Contents

1. [Frontend Implementation](#frontend-implementation)
2. [Backend API Implementation](#backend-api-implementation)
3. [Security Implementation](#security-implementation)

---

## Frontend Implementation (The "Shopfront")

Think of the frontend as a physical store. Different sections (aisles) serve different purposes, and staff (components) help customers find what they need.

### Main Application Pages (Shop Sections)

#### 1. Home Page (`/`)
- **Purpose:** Landing page showcasing featured vehicles and platform benefits
- **Key Components:**
  - `HeroSection` - Large banner with call-to-action
  - `FeaturedVehicles` - Grid of 6 recommended vehicles
  - `HowItWorks` - 3-step explanation (Search → Book → Ride)
  - `TestimonialsSection` - User reviews
  - `Footer` - Links and contact info
- **Data Fetching:** Uses React Query to load featured vehicles from `/api/vehicles?featured=true`

#### 2. Vehicle Search & Browse (`/vehicles`)
- **Purpose:** Main marketplace where users search and filter vehicles
- **Key Components:**
  - `VehicleGrid` - Main container that displays search results
  - `FilterPanel` - Sidebar with filter options
  - `VehicleCard` - Individual vehicle display card
  - `Pagination` - Navigate through result pages
- **How it works:**
  1. User lands on page → `VehicleGrid` component loads
  2. `useQuery` hook fetches initial vehicles: `searchVehicles({ limit: 12 })`
  3. User adjusts filters (type, price, location, dates)
  4. Filter state updates → React Query automatically refetches with new parameters
  5. Loading spinner shows while fetching
  6. Results render in responsive grid (1 column mobile, 2 tablet, 3 desktop)

**Code snippet from VehicleGrid:**
```typescript
const { data: vehicles, isLoading } = useQuery({
  queryKey: ['vehicles', filters], // Re-fetch when filters change
  queryFn: () => searchVehicles(filters)
})
```

#### 3. Vehicle Detail Page (`/vehicles/[id]`)
- **Purpose:** Full information page for a specific vehicle
- **Key Components:**
  - `ImageGallery` - Swipeable photo carousel
  - `VehicleInfo` - Name, type, description, specifications
  - `BookingWidget` - Date picker and price calculator
  - `AvailabilityCalendar` - Visual calendar showing blocked dates
  - `ReviewsList` - Past renter reviews and ratings
  - `OwnerProfile` - Mini card with owner name, rating, join date
- **Smart Features:**
  - Availability calendar queries database for booked dates
  - Booking widget calculates total price in real-time as user selects dates
  - "Book Now" button is disabled if selected dates conflict with existing bookings

#### 4. Checkout Page (`/checkout`)
- **Purpose:** Booking confirmation with date selection and price breakdown
- **Key Components:**
  - `CheckoutForm` - Date inputs, terms acceptance
  - `VehicleSummary` - Shows selected vehicle details
  - `PricingBreakdown` - Itemized costs (base rental + fees)
  - `DatePicker` - Calendar input with disabled past dates
- **Business Logic:**
  ```typescript
  // Pricing calculation based on rental duration
  const days = calculateDays(startDate, endDate)
  
  if (days >= 28 && vehicle.price_per_month) {
    // Use monthly rate (cheapest)
    subtotal = vehicle.price_per_month
  } else if (days >= 7 && vehicle.price_per_week) {
    // Use weekly rate
    subtotal = vehicle.price_per_week
  } else {
    // Use daily rate
    subtotal = vehicle.price_per_day * days
  }
  
  const platformFee = subtotal * 0.10 // 10% commission
  const total = subtotal + platformFee
  ```

#### 5. Payment Page (`/checkout/[bookingId]`)
- **Purpose:** Payment processing with multiple payment methods
- **Key Components:**
  - `PaymentMethodSelector` - Radio buttons (GCash, Maya, Card)
  - `PayMongoCardForm` - Credit card input fields (if card selected)
  - `PaymentSummary` - Final amount to be charged
  - `LoadingSpinner` - Shows during payment processing
  - `ErrorAlert` - Displays payment errors
- **Payment Flow:**
  1. User selects payment method (e.g., GCash)
  2. Clicks "Pay Now" button
  3. Frontend calls `/api/payments/create-source` with booking ID and method
  4. API returns PayMongo checkout URL
  5. User is redirected to PayMongo/GCash page
  6. User completes payment in GCash app
  7. PayMongo redirects user back to our `/payment/success` page
  8. Success page verifies payment status from database
  9. Shows confirmation message with booking details

#### 6. Real-Time Chat (`/messages/[bookingId]`)
- **Purpose:** Communication between renter and owner about a specific booking
- **Key Components:**
  - `ChatBox` - Main container with messages list
  - `MessageBubble` - Individual message (styled differently for sent vs received)
  - `MessageInput` - Text input with send button
  - `TypingIndicator` - Shows "Owner is typing..." (future feature)
- **How Real-Time Works:**
  ```typescript
  useEffect(() => {
    // Subscribe to new messages for this booking
    const channel = subscribeToBookingMessages(bookingId, (newMessage) => {
      // When new message arrives, add it to the messages array
      setMessages((prev) => [...prev, newMessage])
    })
    
    // Cleanup: Unsubscribe when user leaves chat
    return () => channel.unsubscribe()
  }, [bookingId])
  ```
  **Translation:** When the chat page loads, we "tune in" to a specific radio channel (the booking ID). Whenever someone sends a message, Supabase broadcasts it on that channel, and our component instantly receives it and displays it.

#### 7. User Dashboard (`/dashboard`)
- **Purpose:** Overview of user's bookings, favorites, and profile
- **Key Sections:**
  - `UpcomingBookings` - List of confirmed future rentals
  - `PastBookings` - Completed rentals with "Leave Review" option
  - `FavoriteVehicles` - Saved vehicles for quick access
  - `ProfileCard` - User info with "Edit Profile" button
- **Data Queries:**
  - Fetches user's bookings: `GET /api/bookings/user`
  - Fetches favorites: `GET /api/favorites`
  - Separates bookings into "upcoming" (status = confirmed, start_date > today) and "past" (status = completed)

#### 8. Owner Dashboard (`/owner/dashboard`)
- **Purpose:** Vehicle owners manage their fleet and view earnings
- **Key Sections:**
  - `MyVehicles` - List of owned vehicles with edit/delete buttons
  - `PendingBookings` - Incoming rental requests awaiting owner confirmation
  - `ConfirmedBookings` - Upcoming rentals (owner needs to prepare vehicle)
  - `EarningsChart` - Bar chart of monthly revenue
  - `AddVehicleButton` - Quick link to `/owner/vehicles/new`
- **Owner Actions:**
  - Confirm/reject booking requests
  - Mark vehicle as "in maintenance" (temporarily unavailable)
  - Upload additional vehicle photos
  - Set blocked dates (personal use, maintenance schedule)

#### 9. Admin Dashboard (`/admin/dashboard`)
- **Purpose:** Platform administrators moderate content and view analytics
- **Key Sections:**
  - `PendingVehicles` - New listings awaiting approval
  - `ReportedUsers` - Flagged accounts needing review
  - `PlatformStats` - Total users, vehicles, revenue, bookings
  - `RecentActivity` - Live feed of latest bookings and registrations
  - `RevenueChart` - Line graph of platform fees over time
- **Admin Powers:**
  - Approve/reject vehicle listings
  - Ban/suspend users
  - Refund payments
  - View all system data

### How Components Share Data (Global State Management)

**Problem:** Multiple components need to know "Who is logged in?" Without a system, we'd have to pass this information through 10 levels of components like a game of telephone.

**Solution: React Context API**

Think of Context as a "company-wide bulletin board." Instead of whispering information person-to-person, you post it once, and everyone can read it.

#### AuthContext (The User Information Board)

**What it stores:**
- Current user object (id, email, name, role, profile_picture)
- Loading state (is user data still being fetched?)
- Authentication functions (signIn, signUp, signOut, resetPassword)

**Example usage in any component:**
```typescript
function Header() {
  const { user, signOut } = useAuth() // Hook into the bulletin board
  
  if (!user) {
    return <LoginButton />
  }
  
  return (
    <div>
      <img src={user.profile_picture} alt="Profile" />
      <span>Welcome, {user.name}</span>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

**Translation:** The Header component doesn't need to know *how* to log in a user or *where* user data comes from. It just asks the AuthContext, "Who's logged in?" and gets an answer.

### Frontend Performance Optimizations

#### 1. Image Optimization
- **Problem:** A 5MB vehicle photo takes 10 seconds to load on slow connections
- **Solution:** Next.js `<Image>` component automatically:
  - Compresses images (5MB → 200KB)
  - Lazy loads (only loads images when user scrolls to them)
  - Serves modern formats (WebP for Chrome, JPEG for Safari)
  - Generates multiple sizes (mobile vs desktop)

#### 2. Code Splitting (Lazy Loading Pages)
- **Problem:** Downloading the entire app code at once is slow (2MB JavaScript)
- **Solution:** Each page is a separate file
  - User visits `/vehicles` → Only loads vehicle search code (300KB)
  - If they never visit `/admin`, admin code is never downloaded
  - Result: 85% reduction in initial load time

#### 3. React Query Caching
- **How it works:**
  ```
  User searches for motorcycles → Fetch data → Cache for 5 minutes
  User navigates away → Data stays in cache
  User comes back → Instant display from cache
  Meanwhile, React Query refetches in background to check for updates
  ```
- **Result:** Searches feel instant after the first load

#### 4. Optimistic Updates
- **Example:** User clicks "Favorite" on a vehicle
  ```typescript
  // Immediately show filled heart (optimistic)
  setIsFavorited(true)
  
  // Send request to server
  try {
    await addToFavorites(vehicleId)
  } catch (error) {
    // If it fails, undo the change
    setIsFavorited(false)
    showError('Failed to favorite')
  }
  ```
- **Result:** UI feels responsive even on slow connections

---

## Backend API Implementation (The "Kitchen")

### What is an API? (Simple Explanation)

**API** stands for "Application Programming Interface," but that's confusing jargon. Think of it this way:

An API is like a waiter in a restaurant:
- You (the frontend) sit at a table and look at the menu
- You tell the waiter (API), "I want the pasta" (request)
- The waiter takes your order to the kitchen (backend logic)
- The kitchen prepares your food (processes data, queries database)
- The waiter brings your food back (response)

You never go into the kitchen yourself. The waiter is the middleman who knows how to communicate with both you and the kitchen staff.

### Our API Endpoints (The "Menu")

#### Vehicle Management APIs

**1. GET /api/vehicles**
- **Purpose:** Search for vehicles based on filters
- **Who can use it:** Anyone (public endpoint)
- **Request Parameters:**
  ```
  ?type=motorcycle,car          (Filter by vehicle types)
  &minPrice=300                 (Minimum daily rate)
  &maxPrice=1000                (Maximum daily rate)
  &location=General Luna        (Filter by location)
  &startDate=2024-12-01         (Check availability from this date)
  &endDate=2024-12-07           (Check availability until this date)
  &limit=12                     (Results per page)
  &offset=0                     (Pagination offset)
  ```
- **Process:**
  1. Build database query: `SELECT * FROM vehicles WHERE...`
  2. Apply type filter: `type IN ('motorcycle', 'car')`
  3. Apply price filter: `price_per_day BETWEEN 300 AND 1000`
  4. Apply location filter: `location = 'General Luna'`
  5. Join with owner data: Include owner name and rating
  6. If dates provided: Cross-reference `bookings` table to exclude unavailable vehicles
  7. Return matching vehicles as JSON array
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": "abc123",
        "name": "Honda Click 150",
        "type": "motorcycle",
        "price_per_day": 500,
        "price_per_week": 3000,
        "price_per_month": 10000,
        "location": "General Luna",
        "images": ["url1.jpg", "url2.jpg"],
        "owner": {
          "name": "Juan Cruz",
          "rating": 4.8
        },
        "is_available": true
      }
    ],
    "total": 15,
    "page": 1
  }
  ```

**2. POST /api/vehicles** (Owner/Admin only)
- **Purpose:** Create a new vehicle listing
- **Authentication:** Requires valid session token
- **Authorization:** User must have "owner" or "admin" role
- **Request Body:**
  ```json
  {
    "name": "Yamaha Mio i125",
    "type": "motorcycle",
    "description": "Perfect for island exploring",
    "price_per_day": 400,
    "price_per_week": 2500,
    "price_per_month": 8500,
    "location": "General Luna",
    "features": ["Automatic", "Fuel-efficient", "Storage compartment"]
  }
  ```
- **Process:**
  1. **Verify authentication:** Check session token in cookie
  2. **Verify authorization:** Confirm user.role === 'owner' or 'admin'
  3. **Validate input:** Ensure all required fields present, prices > 0
  4. **Upload images:** (If files attached) → Supabase Storage → Get URLs
  5. **Insert into database:**
     ```sql
     INSERT INTO vehicles (
       owner_id, name, type, description, prices, location, images, is_approved
     ) VALUES (
       user.id, 'Yamaha Mio i125', 'motorcycle', ..., false
     )
     ```
  6. **Send notification:** Email admin about new listing pending approval
  7. **Return created vehicle:**
     ```json
     {
       "success": true,
       "data": { "id": "xyz789", "name": "Yamaha Mio i125", ... }
     }
     ```

**3. PUT /api/vehicles/[id]** (Owner only)
- **Purpose:** Update vehicle details
- **Security Check:**
  ```typescript
  const vehicle = await getVehicle(id)
  if (vehicle.owner_id !== user.id && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  ```
  **Translation:** "You can only edit your own vehicles, unless you're an admin."

**4. DELETE /api/vehicles/[id]** (Owner/Admin only)
- **Purpose:** Remove vehicle listing
- **Cascade Effect:** Also deletes related data (photos from storage, future bookings cancelled)

#### Booking Management APIs

**5. POST /api/bookings**
- **Purpose:** Create a new rental booking
- **Process:**
  ```typescript
  // 1. Validate dates
  if (startDate < new Date()) {
    return error('Cannot book past dates')
  }
  if (startDate >= endDate) {
    return error('End date must be after start date')
  }
  
  // 2. Check vehicle availability
  const conflictingBookings = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'confirmed')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
  
  if (conflictingBookings.length > 0) {
    return error('Vehicle not available for selected dates')
  }
  
  // 3. Calculate total price
  const days = calculateDays(startDate, endDate)
  const basePrice = days >= 28 ? vehicle.price_per_month :
                    days >= 7  ? vehicle.price_per_week :
                    days * vehicle.price_per_day
  const platformFee = basePrice * 0.10
  const totalPrice = basePrice + platformFee
  
  // 4. Create booking record
  const booking = await supabase.from('bookings').insert({
    renter_id: user.id,
    vehicle_id: vehicleId,
    start_date: startDate,
    end_date: endDate,
    total_price: totalPrice,
    status: 'pending' // Awaits owner confirmation
  }).select().single()
  
  // 5. Notify owner
  await sendEmail(owner.email, 'New booking request', ...)
  
  return { booking }
  ```

**6. GET /api/bookings/user** (Authenticated)
- **Purpose:** Fetch all bookings for logged-in user
- **Smart Query:** Returns different data based on user role
  ```typescript
  if (user.role === 'renter') {
    // Get bookings where user is the renter
    query = query.eq('renter_id', user.id)
  } else if (user.role === 'owner') {
    // Get bookings for user's vehicles
    const userVehicles = await getUserVehicles(user.id)
    query = query.in('vehicle_id', userVehicles.map(v => v.id))
  }
  ```

**7. PUT /api/bookings/[id]/confirm** (Owner only)
- **Purpose:** Owner confirms a booking request
- **Security:**
  ```typescript
  const booking = await getBooking(id)
  const vehicle = await getVehicle(booking.vehicle_id)
  
  if (vehicle.owner_id !== user.id) {
    return error('You can only confirm bookings for your vehicles')
  }
  ```
- **Action:**
  ```typescript
  await supabase.from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
  
  await sendEmail(renter.email, 'Booking confirmed!', ...)
  ```

#### Payment Processing APIs

**8. POST /api/payments/create-source**
- **Purpose:** Initialize PayMongo payment
- **Request Body:**
  ```json
  {
    "bookingId": "abc123",
    "paymentMethod": "gcash",
    "amount": 3850
  }
  ```
- **Process:**
  1. Fetch booking details to verify amount
  2. Call PayMongo API:
     ```typescript
     const response = await fetch('https://api.paymongo.com/v1/sources', {
       method: 'POST',
       headers: {
         'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY)}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         data: {
           attributes: {
             type: 'gcash',
             amount: amount * 100, // PayMongo uses cents
             currency: 'PHP',
             redirect: {
               success: 'https://juanride.com/payment/success',
               failed: 'https://juanride.com/payment/failed'
             }
           }
         }
       })
     })
     ```
  3. PayMongo returns checkout URL: `https://payments.paymongo.com/sources/src_abc123`
  4. Store payment record in database:
     ```typescript
     await supabase.from('payments').insert({
       booking_id: bookingId,
       amount: amount,
       currency: 'PHP',
       payment_method: 'gcash',
       status: 'pending',
       paymongo_source_id: sourceId
     })
     ```
  5. Return checkout URL to frontend
  6. Frontend redirects user to PayMongo page

**9. POST /api/payments/webhook** (PayMongo servers only)
- **Purpose:** Receive payment status updates from PayMongo
- **Security:** Verify webhook signature
  ```typescript
  const signature = request.headers.get('paymongo-signature')
  const isValid = verifyPayMongoSignature(request.body, signature)
  
  if (!isValid) {
    return error('Invalid webhook signature', 401)
  }
  ```
- **Event Types:**
  - `source.chargeable` → Payment completed successfully
  - `payment.paid` → Funds received
  - `payment.failed` → Payment declined/failed
- **On Success:**
  ```typescript
  if (event.type === 'source.chargeable') {
    // Update payment status
    await supabase.from('payments')
      .update({
        status: 'paid',
        paid_at: new Date(),
        transaction_id: event.data.id
      })
      .eq('paymongo_source_id', event.data.id)
    
    // Update booking status
    await supabase.from('bookings')
      .update({ status: 'confirmed', payment_status: 'paid' })
      .eq('id', payment.booking_id)
    
    // Send confirmation emails
    await sendConfirmationEmail(renter)
    await sendBookingNotification(owner)
  }
  ```

#### Messaging APIs

**10. POST /api/messages**
- **Purpose:** Send a chat message
- **Request Body:**
  ```json
  {
    "bookingId": "abc123",
    "message": "What time should I pick up the motorcycle?"
  }
  ```
- **Process:**
  ```typescript
  // 1. Verify user is part of this booking
  const booking = await getBooking(bookingId)
  const vehicle = await getVehicle(booking.vehicle_id)
  
  const isParticipant = (
    user.id === booking.renter_id || user.id === vehicle.owner_id
  )
  
  if (!isParticipant) {
    return error('You are not part of this conversation')
  }
  
  // 2. Insert message
  const newMessage = await supabase.from('messages').insert({
    booking_id: bookingId,
    sender_id: user.id,
    message: message,
    created_at: new Date()
  }).select().single()
  
  // 3. Supabase Realtime automatically broadcasts this to subscribers
  
  // 4. If recipient is offline, send email notification
  const recipient = user.id === booking.renter_id ? vehicle.owner_id : booking.renter_id
  const recipientOnline = await checkIfOnline(recipient)
  
  if (!recipientOnline) {
    await sendEmail(recipient, 'New message from ${user.name}', ...)
  }
  
  return { message: newMessage }
  ```

**11. GET /api/messages/[bookingId]**
- **Purpose:** Fetch chat history
- **Security:** Same check—user must be renter or owner

#### Admin APIs

**12. PUT /api/admin/vehicles/[id]/approve** (Admin only)
- **Purpose:** Approve a pending vehicle listing
- **Authorization Check:**
  ```typescript
  if (user.role !== 'admin') {
    return error('Admin access required', 403)
  }
  ```
- **Action:**
  ```typescript
  await supabase.from('vehicles')
    .update({ is_approved: true, approved_at: new Date() })
    .eq('id', vehicleId)
  
  await sendEmail(owner, 'Vehicle approved!', ...)
  ```

**13. GET /api/admin/analytics** (Admin only)
- **Purpose:** Platform statistics for admin dashboard
- **Queries:**
  ```typescript
  // User stats
  const totalUsers = await supabase.from('users').select('id', { count: 'exact' })
  const newUsersThisMonth = await supabase.from('users')
    .select('id', { count: 'exact' })
    .gte('created_at', startOfMonth)
  
  // Vehicle stats
  const totalVehicles = await supabase.from('vehicles')
    .select('id', { count: 'exact' })
    .eq('is_approved', true)
  const pendingVehicles = await supabase.from('vehicles')
    .select('id', { count: 'exact' })
    .eq('is_approved', false)
  
  // Revenue stats
  const completedBookings = await supabase.from('bookings')
    .select('total_price')
    .eq('status', 'completed')
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0)
  const platformEarnings = totalRevenue * 0.10
  
  return {
    users: { total: totalUsers, newThisMonth: newUsersThisMonth },
    vehicles: { total: totalVehicles, pending: pendingVehicles },
    revenue: { total: totalRevenue, platform: platformEarnings }
  }
  ```

---

## Security Implementation

Security is multi-layered. Think of it like a house: you have a fence (firewall), locked doors (authentication), security cameras (logging), and a safe (encryption).

### Layer 1: Authentication (Who are you?)

**Supabase Auth** handles this automatically:
1. **Password Hashing:** Passwords are encrypted using bcrypt (industry standard)
   - User's password "secret123" → Stored as "$2a$10$N9qo8uL..." (irreversible)
   - Even if database is hacked, passwords can't be decrypted
2. **Session Tokens (JWT):**
   - When user logs in → Server generates a "token" (like a concert wristband)
   - Token contains: user ID, role, expiration time
   - Token is signed with secret key → Can't be forged
   - Every request includes token → Server verifies it's valid
3. **Email Verification:**
   - New signups get verification email
   - Account is limited until email confirmed

### Layer 2: Authorization (What can you do?)

**Middleware checks user role before allowing access to pages:**

```typescript
// middleware.ts
export async function middleware(request) {
  const { pathname } = request.nextUrl
  const user = await getCurrentUser()
  
  // Public pages (anyone can access)
  if (pathname.startsWith('/vehicles') || pathname === '/') {
    return NextResponse.next()
  }
  
  // Protected pages (must be logged in)
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  // Owner-only pages
  if (pathname.startsWith('/owner')) {
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.redirect('/unauthorized')
    }
  }
  
  // Admin-only pages
  if (pathname.startsWith('/admin')) {
    if (user.role !== 'admin') {
      return NextResponse.redirect('/unauthorized')
    }
  }
  
  return NextResponse.next()
}
```

**Translation:** This code runs before every page load and checks, "Should this user see this page?"

### Layer 3: Row Level Security (RLS) in Database

**Database-level protection:** Even if our API has a bug, RLS prevents unauthorized data access.

**Example RLS Policies:**

**Bookings Table Policy:**
```sql
-- Users can only see their own bookings (as renter) or bookings for their vehicles (as owner)
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (
  auth.uid() = renter_id 
  OR 
  auth.uid() IN (
    SELECT owner_id FROM vehicles WHERE id = bookings.vehicle_id
  )
);
```

**Translation:** When a SQL query tries to fetch bookings, PostgreSQL automatically adds a WHERE clause that filters to only bookings the user has permission to see.

**Messages Table Policy:**
```sql
-- Users can only see messages for bookings they're part of
CREATE POLICY "Booking participants can view messages"
ON messages FOR SELECT
USING (
  booking_id IN (
    SELECT id FROM bookings 
    WHERE renter_id = auth.uid() 
    OR vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  )
);
```

### Layer 4: Input Validation & Sanitization

**Prevent malicious input:**

```typescript
// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return error('Invalid email format')
}

// Validate price is positive number
if (typeof price !== 'number' || price <= 0) {
  return error('Price must be a positive number')
}

// Sanitize text input (remove dangerous HTML)
const sanitizedMessage = message.replace(/<script.*?>.*?<\/script>/gi, '')
```

### Layer 5: API Rate Limiting

**Prevent abuse (e.g., someone trying 1000 passwords per second):**

```typescript
// Allow max 5 login attempts per IP per minute
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests
  message: 'Too many attempts, please try again later'
})
```

### Layer 6: HTTPS Encryption

All data in transit is encrypted:
- User sends login request → Encrypted over HTTPS
- Eavesdroppers can't see username/password
- Vercel provides automatic HTTPS certificate

### Layer 7: Payment Security (PCI-DSS Compliance)

**We never see credit card numbers:**
- User enters card on PayMongo's page (not ours)
- PayMongo returns a token: `tok_abc123`
- We charge using the token, never touching raw card data
- This keeps us compliant with strict financial regulations

---

**Continue to [Part 3: Feature Deep-Dive & Database Schema](PART3_FEATURE_IMPLEMENTATION.md)**
