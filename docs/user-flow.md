# JuanRide User Flow Documentation

## Overview

This document outlines the complete user journey through JuanRide, detailing how different user types (renters, vehicle owners, and administrators) interact with the platform. Each flow is designed to be intuitive, efficient, and optimized for the unique needs of the Siargao vehicle rental market.

---

## User Personas

Before diving into flows, let's understand our three main user types:

**Alex the Tourist** - A 28-year-old traveler planning a trip to Siargao who needs to rent a scooter for a week.

**Maria the Entrepreneur** - A 45-year-old local business owner with a fleet of 10 motorcycles and 2 vans.

**Admin Team** - The JuanRide operational team ensuring smooth platform operation.

---

## Renter User Flows

### Flow 1: First-Time User Registration and Onboarding

**Entry Point:** Landing page visit (www.juanride.com)

**Steps:**

1. **Landing Page Discovery**
   - User arrives at JuanRide homepage
   - Views hero section showcasing Siargao and vehicle variety
   - Reads value proposition: "Book Your Ride in Siargao, Instantly"
   - Sees featured vehicles and current promotions
   - Reviews trust indicators (number of bookings, user ratings)

2. **Account Creation Trigger**
   - User clicks "Sign Up" or "Get Started" button
   - Alternatively, clicks "Book Now" on any vehicle (redirects to signup)

3. **Registration Process**
   - Sign-up modal appears with options:
     - Email and password registration
     - Google account sign-in
     - Facebook account sign-in
   - User selects preferred method
   - Provides required information:
     - Full name
     - Email address
     - Phone number (with Philippines +63 prefix default)
     - Password (minimum 8 characters)
   - Accepts terms of service and privacy policy

4. **Email Verification**
   - System sends verification email
   - User clicks verification link
   - Account is activated
   - Success message displayed

5. **Profile Completion**
   - User is prompted to complete profile (optional but encouraged)
   - Adds profile picture
   - Provides additional details:
     - Age/birthdate
     - Location
     - Preferred language
   - Profile saved

6. **Quick Tour (First Login)**
   - Brief overlay tour of main features:
     - How to search for vehicles
     - How to make a booking
     - Where to find your bookings
     - How to contact owners
   - User can skip or complete tour

**Exit Point:** User lands on homepage, logged in and ready to search

**Alternative Flows:**
- User already has account → Clicks "Log In" instead
- Social login fails → Falls back to email registration
- Email verification delayed → User can resend verification email

---

### Flow 2: Searching and Browsing Vehicles

**Entry Point:** Homepage or direct search page

**Steps:**

1. **Search Initiation**
   - User sees prominent search interface
   - Enters search criteria:
     - Location (dropdown: General Luna, Cloud 9, Dapa, etc.)
     - Dates (date picker for start and end date)
     - Vehicle type (optional: scooter, motorcycle, car, van)
   - Clicks "Search" button

2. **Search Results Display**
   - Results page loads showing available vehicles
   - Left sidebar shows filters:
     - Price range (slider)
     - Vehicle type (checkboxes)
     - Ratings (star filter)
     - Features (automatic transmission, helmet included, etc.)
   - Main area shows vehicle grid/list with:
     - Vehicle photo
     - Name and type
     - Daily price
     - Rating and review count
     - "Available" badge
     - Quick view button

3. **Filtering and Sorting**
   - User applies filters (results update in real-time)
   - Sorts by:
     - Price: Low to High
     - Price: High to Low
     - Highest Rated
     - Most Popular
   - Pagination for multiple pages of results

4. **Vehicle Quick View**
   - User hovers over vehicle card or clicks "Quick View"
   - Modal shows:
     - More photos (carousel)
     - Key specs
     - Price breakdown
     - Quick book button
   - Can close modal and continue browsing

5. **Saving Favorites**
   - User clicks heart icon on vehicles of interest
   - Vehicle added to "Favorites" list
   - Can access favorites from profile menu

**Exit Point:** User either continues to detailed vehicle page or refines search

**Alternative Flows:**
- No results found → Suggestions for alternative dates or locations
- User not logged in → Can browse but must login to book

---

### Flow 3: Viewing Vehicle Details and Booking

**Entry Point:** Click on vehicle from search results

**Steps:**

1. **Vehicle Page Load**
   - Detailed vehicle page displays:
     - Large photo gallery (with zoom and full-screen options)
     - Vehicle name, make, model
     - Owner profile card (photo, name, rating, response rate)
     - Price per day and weekly/monthly rates
     - Star rating and review count

2. **Information Review**
   - User scrolls through sections:
     - **Overview:** Vehicle description, features, location
     - **Specifications:** Type, year, transmission, fuel type
     - **What's Included:** Helmet, lock, phone holder, etc.
     - **Rental Terms:** Age requirements, deposit, cancellation policy
     - **Location:** Map showing pickup point
     - **Reviews:** Recent reviews from past renters
     - **Owner Policies:** Rules and requirements

3. **Booking Widget Interaction**
   - Right sidebar (or bottom on mobile) shows booking widget:
     - Date selector (pre-filled if from search)
     - Number of vehicles (if available)
     - Price breakdown:
       - Base price × days
       - Service fee
       - Total price
     - "Book Now" button (prominent)

4. **Initiating Booking**
   - User selects rental dates in widget
   - Reviews final price
   - Clicks "Book Now"
   - If not logged in, redirected to login/signup
   - If logged in, proceeds to booking confirmation

5. **Asking Questions (Alternative Path)**
   - User has questions before booking
   - Clicks "Contact Owner" button
   - Chat window opens
   - Can send message to owner
   - Receives response (notification sent to user)
   - Returns to booking when ready

**Exit Point:** Proceeds to checkout or returns to search

**Alternative Flows:**
- Vehicle becomes unavailable during browsing → Shown "No longer available" with similar suggestions
- User wants different dates → Updates dates in widget, availability updates

---

### Flow 4: Checkout and Payment

**Entry Point:** Clicked "Book Now" on vehicle page

**Steps:**

1. **Booking Summary Page**
   - Displays booking summary:
     - Vehicle details and photo
     - Rental dates and duration
     - Price breakdown
     - Pickup location and time
   - Renter information section (pre-filled from profile):
     - Name
     - Phone number
     - Email
     - Can edit if needed

2. **Additional Information**
   - User provides:
     - Estimated arrival time in Siargao
     - Flight/travel details (optional)
     - Special requests or notes for owner
     - Emergency contact (optional)

3. **Payment Method Selection**
   - User selects payment method:
     - **GCash:** Redirects to GCash app/portal
     - **Maya:** Redirects to Maya app/portal
     - **Credit/Debit Card:** Inline card form
     - **Bank Transfer:** Shows bank details and instructions
   - Enters payment details if applicable

4. **Review and Confirm**
   - Final review of all booking details
   - Checkbox to accept cancellation policy
   - Total amount displayed prominently
   - "Confirm and Pay" button

5. **Payment Processing**
   - Loading indicator shows payment processing
   - Redirected to payment gateway if needed
   - Completes payment authentication (3D Secure, etc.)
   - Returns to JuanRide

6. **Booking Confirmation**
   - Success page displays:
     - "Booking Confirmed!" message
     - Booking reference number
     - All booking details
     - Owner contact information
     - Pickup instructions
     - Add to calendar option
   - Confirmation email sent automatically
   - SMS confirmation sent to phone

7. **Next Steps Display**
   - Clear call-to-action buttons:
     - "View Booking Details"
     - "Contact Owner"
     - "Back to Search"
   - Information about what happens next:
     - Owner will prepare vehicle
     - Reminder sent 24 hours before pickup
     - Map to pickup location

**Exit Point:** User can view booking in "My Bookings" section

**Alternative Flows:**
- Payment fails → Error message with retry option, booking held for 15 minutes
- Bank transfer selected → Booking marked "pending" until payment verified
- Connection lost during payment → Session recovery, can check payment status

---

### Flow 5: Managing Active Bookings

**Entry Point:** "My Bookings" page from profile menu

**Steps:**

1. **Bookings Dashboard**
   - Displays tabs:
     - **Upcoming:** Future bookings
     - **Active:** Currently rented vehicles
     - **Completed:** Past rentals
     - **Cancelled:** Cancelled bookings
   - Each booking card shows:
     - Vehicle photo and name
     - Booking dates
     - Status badge
     - Quick action buttons

2. **Viewing Upcoming Booking**
   - User clicks on upcoming booking
   - Details page shows:
     - Full booking information
     - Pickup location with map
     - Owner contact info
     - Countdown to pickup time
     - "Contact Owner" button
     - "Modify Booking" button
     - "Cancel Booking" button

3. **Contacting Owner**
   - User clicks "Contact Owner"
   - Chat window opens (booking context visible)
   - Can discuss pickup details, ask questions
   - Messages saved in chat history

4. **Modifying Booking (if allowed)**
   - User clicks "Modify Booking"
   - Can change:
     - Dates (if vehicle available)
     - Pickup time
     - Special requests
   - Price recalculated if dates change
   - Requires owner approval for date changes
   - Confirmation of changes

5. **Cancelling Booking**
   - User clicks "Cancel Booking"
   - Modal shows cancellation policy:
     - Refund amount based on policy
     - Cancellation fee (if applicable)
   - User confirms cancellation
   - Booking status updated to "Cancelled"
   - Refund processed (if applicable)
   - Owner notified

6. **During Active Rental**
   - Booking status shows "Active"
   - Displays:
     - Return date and time
     - Return location
     - Owner contact for emergencies
     - Option to extend rental
   - Reminder sent 2 hours before return time

7. **After Rental Completion**
   - Booking moves to "Completed"
   - Prompt to leave review:
     - Rating (1-5 stars)
     - Written review
     - Upload photos (optional)
   - Submit review
   - Can view receipt and booking details

**Exit Point:** User completes booking lifecycle or returns to dashboard

**Alternative Flows:**
- Extend rental → Checks availability, processes additional payment
- Report issue → Opens support chat, can attach photos
- Late return → Notified of additional charges, can contact owner

---

### Flow 6: Leaving a Review

**Entry Point:** Completed booking in "My Bookings" or email reminder

**Steps:**

1. **Review Prompt**
   - User receives review request:
     - In-app notification
     - Email 24 hours after return
     - Banner on completed booking
   - Clicks "Leave Review"

2. **Review Form**
   - Rating section:
     - Overall rating (1-5 stars, required)
     - Category ratings (optional):
       - Vehicle condition
       - Cleanliness
       - Value for money
       - Owner communication
   - Written review:
     - Text area (optional, max 500 characters)
     - Placeholder suggestions for helpful reviews
   - Photo upload:
     - Optional, up to 5 photos
     - Drag-and-drop or click to select

3. **Review Preview**
   - User reviews their submission
   - Can edit before submitting
   - Toggle to post anonymously (optional)

4. **Submit Review**
   - Clicks "Submit Review"
   - Confirmation message
   - Review sent for moderation
   - "Thank you" message displayed

5. **Review Published**
   - After moderation (usually within 24 hours):
     - Review appears on vehicle page
     - Owner can respond
     - User notified when published

**Exit Point:** Review is live, user can view it on vehicle page

**Alternative Flows:**
- User wants to edit review → Can edit within 48 hours of submission
- Review flagged as inappropriate → Admin reviews, may contact user

---

## Vehicle Owner User Flows

### Flow 7: Owner Registration and Onboarding

**Entry Point:** Landing page, clicks "List Your Vehicles" or "Become an Owner"

**Steps:**

1. **Owner Interest Page**
   - Information about becoming an owner:
     - Benefits of listing on JuanRide
     - How it works
     - Pricing/commission structure
     - Success stories from other owners
   - "Get Started" button

2. **Account Creation**
   - Similar to renter registration but with owner role
   - Additional information required:
     - Business name (if applicable)
     - Business type (individual, company)
     - Tax ID or business registration number
     - Phone number for business inquiries

3. **Owner Verification**
   - Upload required documents:
     - Valid government ID (front and back)
     - Business permit (if applicable)
     - Proof of vehicle ownership
   - Documents sent for admin review
   - Verification status: "Pending Review"

4. **Bank Account Setup**
   - Provide payout information:
     - Bank name
     - Account number
     - Account name
     - Branch (if applicable)
   - Verification for payouts

5. **Owner Dashboard Tour**
   - Guided tour of dashboard features:
     - How to add vehicles
     - Managing bookings
     - Tracking earnings
     - Communicating with renters
   - Can skip tour and explore

6. **Verification Approval**
   - Admin reviews documents (usually within 24-48 hours)
   - Owner receives email/SMS notification
   - Account status: "Verified"
   - Can now list vehicles

**Exit Point:** Owner ready to create first listing

**Alternative Flows:**
- Verification rejected → Reason provided, can resubmit documents
- Pending verification → Can create draft listings but not publish

---

### Flow 8: Creating a Vehicle Listing

**Entry Point:** Owner dashboard, clicks "Add New Vehicle"

**Steps:**

1. **Listing Form - Basic Information**
   - Step 1 of multi-step form:
     - Vehicle type (scooter, motorcycle, car, van)
     - Make (Honda, Yamaha, Toyota, etc.)
     - Model
     - Year
     - Plate number (unique identifier)
     - Transmission type (manual, automatic)
     - Fuel type

2. **Listing Form - Description**
   - Step 2:
     - Vehicle name/title (pre-filled, editable)
     - Detailed description (text editor, max 1000 chars)
     - Features checklist:
       - Helmet included
       - Lock included
       - Phone holder
       - Waterproof bag
       - etc.
     - Location/pickup address
     - Map pin to mark exact location

3. **Listing Form - Photos**
   - Step 3:
     - Photo upload interface (drag-and-drop)
     - Requirements shown:
       - Minimum 3 photos
       - Maximum 20 photos
       - Recommended: front, back, sides, dashboard, seat
     - Photo preview and reordering
     - Set cover photo
     - Auto-optimization and compression

4. **Listing Form - Pricing**
   - Step 4:
     - Daily rate (required, in PHP)
     - Weekly rate (optional, suggested discount shown)
     - Monthly rate (optional)
     - Security deposit amount (optional)
     - Extra charges (late return fee, fuel policy, etc.)

5. **Listing Form - Rental Terms**
   - Step 5:
     - Minimum rental duration
     - Maximum rental duration
     - Minimum renter age
     - Requirements (license type, etc.)
     - Cancellation policy (dropdown with templates)
     - House rules and policies
     - Insurance coverage (if any)

6. **Review and Submit**
   - Final review page showing all information
   - Preview of how listing will appear to renters
   - Options:
     - "Save as Draft" → Can continue editing later
     - "Submit for Approval" → Sends to admin for review
   - Submits listing

7. **Awaiting Approval**
   - Listing status: "Pending Approval"
   - Notification sent when admin reviews
   - Owner can view draft but cannot make live

8. **Listing Approved**
   - Admin approves listing
   - Status changes to "Active"
   - Listing visible to renters
   - Owner receives confirmation
   - Can now receive bookings

**Exit Point:** Listing is live and bookable

**Alternative Flows:**
- Listing rejected → Feedback provided, owner makes corrections and resubmits
- Save as draft → Returns to dashboard, can continue later from "Drafts" section
- Add another vehicle → Immediately starts new listing flow

---

### Flow 9: Managing Bookings (Owner Side)

**Entry Point:** Owner dashboard showing booking notifications

**Steps:**

1. **Dashboard Overview**
   - Owner sees:
     - Today's pickups (list with times)
     - Today's returns (list with times)
     - New bookings (notification badge)
     - Upcoming bookings calendar view
     - Fleet status (available, booked, maintenance)

2. **New Booking Notification**
   - Owner receives notification (SMS, email, in-app):
     - "New booking for [Vehicle Name]!"
     - Booking details summary
     - Renter name and contact
   - Clicks notification to view details

3. **Booking Details View**
   - Complete booking information:
     - Booking reference number
     - Renter profile (name, photo, rating, past bookings)
     - Vehicle details
     - Rental period
     - Pickup/return times
     - Total amount and payout
     - Payment status
     - Special requests from renter

4. **Pre-Pickup Preparation**
   - Owner prepares vehicle:
     - Checks vehicle condition
     - Fuels up vehicle
     - Ensures cleanliness
     - Checks included items (helmet, etc.)
   - Can message renter:
     - Confirm pickup time
     - Provide additional instructions
     - Share exact location pin

5. **Pickup Process**
   - Day of pickup:
     - Reminder notification sent 2 hours before
     - Owner marks "Renter Arrived" (optional)
     - Conducts pickup:
       - Verifies renter ID and license
       - Brief vehicle orientation
       - Notes existing damage (photo documentation)
     - Owner marks booking as "Picked Up" in app
     - Status changes to "Active"

6. **During Rental Period**
   - Can monitor:
     - Rental status
     - Days remaining
     - GPS location (if enabled)
     - Renter contact available
   - Can communicate via chat if needed

7. **Return Process**
   - Reminder sent 2 hours before return time:
     - To owner and renter
   - At return:
     - Inspect vehicle for damage
     - Check fuel level
     - Verify all included items present
     - Take photos of vehicle condition
   - Owner marks "Vehicle Returned" in app
     - Note any issues or damage
     - Additional charges (if applicable)
   - Booking status changes to "Completed"

8. **Post-Return Actions**
   - Payout processed to owner's bank account
   - Can respond to renter's review
   - Vehicle status returns to "Available"

**Exit Point:** Booking completed, vehicle ready for next rental

**Alternative Flows:**
- Renter requests to extend → Owner approves/declines, price adjusted
- Vehicle damaged → Owner files damage report, evidence uploaded
- Renter late for pickup → Owner can contact, cancel, or wait
- Late return → Automatic late fees applied, owner notified

---

### Flow 10: Fleet Management and Analytics

**Entry Point:** Owner dashboard, clicks "My Vehicles" or "Analytics"

**Steps:**

1. **Fleet Overview**
   - Grid/list view of all vehicles:
     - Vehicle photo and name
     - Current status (available, booked, maintenance)
     - Next booking date (if any)
     - Total bookings this month
     - Revenue this month
     - Quick action buttons

2. **Individual Vehicle Management**
   - Owner clicks on vehicle
   - Vehicle dashboard shows:
     - Booking calendar (past and future)
     - Revenue chart (daily, weekly, monthly)
     - Utilization rate
     - Average rating and review count
     - Recent reviews
     - Booking statistics

3. **Editing Vehicle Listing**
   - Clicks "Edit Listing"
   - Can modify:
     - Photos
     - Description
     - Pricing
     - Availability
     - Features and policies
   - Changes saved immediately (or sent for approval if major changes)

4. **Setting Availability**
   - Calendar interface to block dates:
     - Click dates to make unavailable
     - Add reason (personal use, maintenance, etc.)
     - Blocked dates cannot receive bookings
   - Can unblock dates later

5. **Scheduling Maintenance**
   - Clicks "Schedule Maintenance"
   - Form for maintenance:
     - Maintenance type (oil change, tire replacement, etc.)
     - Scheduled date
     - Service provider
     - Estimated cost
     - Notes
   - Vehicle automatically blocked for those dates
   - Reminder sent before maintenance

6. **Revenue Analytics**
   - Financial dashboard shows:
     - Total earnings (all-time, this year, this month, this week)
     - Revenue by vehicle (comparison)
     - Revenue trends (line chart)
     - Payout history
     - Pending payments
     - Average daily rate achieved
     - Occupancy rate

7. **Performance Insights**
   - Analytics showing:
     - Most booked vehicle
     - Highest earning vehicle
     - Best performing season/months
     - Average booking duration
     - Repeat renter percentage
     - Search impressions vs bookings

8. **Exporting Reports**
   - Owner clicks "Export Report"
   - Select date range and vehicle(s)
   - Choose format (CSV, Excel, PDF)
   - Download financial report for accounting

**Exit Point:** Owner has full visibility of fleet performance

**Alternative Flows:**
- Deactivate listing → Vehicle hidden from search, can reactivate anytime
- Delete listing → Confirmation required, cannot undo
- Bulk actions → Select multiple vehicles, change pricing or availability

---

## Administrator User Flows

### Flow 11: Admin Dashboard and Monitoring

**Entry Point:** Admin login, lands on admin dashboard

**Steps:**

1. **Admin Dashboard Overview**
   - High-level metrics cards:
     - Total users (renters, owners)
     - Active listings
     - Bookings today/this week/this month
     - Revenue today/this week/this month
     - Pending approvals (badges for attention)
     - Active disputes
     - System health status

2. **Real-Time Activity Feed**
   - Scrolling feed showing:
     - New user registrations
     - New vehicle listings
     - New bookings
     - Completed bookings
     - Reviews submitted
     - Disputes opened
   - Click any item for details

3. **Quick Actions Panel**
   - Buttons for common tasks:
     - "Review Pending Listings"
     - "Moderate Reviews"
     - "View Disputes"
     - "User Management"
     - "System Settings"
     - "Generate Reports"

**Exit Point:** Admin navigates to specific management area

---

### Flow 12: Managing User Accounts

**Entry Point:** Admin dashboard, clicks "User Management"

**Steps:**

1. **User List View**
   - Comprehensive user table:
     - Filters (user type, status, registration date)
     - Search by name, email, phone
     - Columns:
       - Name, email, user type, status
       - Registration date, last login
       - Total bookings/listings
       - Actions
   - Pagination for large user base

2. **Viewing User Profile**
   - Admin clicks on user
   - Complete profile view:
   - Personal information
     - Account status and verification
     - Activity history
     - Bookings (if renter)
     - Listings (if owner)
     - Reviews given and received
     - Transaction history
     - Compliance issues (if any)

3. **User Actions**
   - Admin can:
     - Edit user information
     - Verify/unverify account
     - Suspend account (with reason)
     - Unsuspend account
     - Delete account (with confirmation)
     - Reset password
     - Send notification to user
     - View audit log

4. **Handling Verification**
   - For owner verification pending:
     - View uploaded documents
     - Check document validity
     - Approve or reject
     - Provide feedback if rejected

5. **Suspending/Banning Users**
   - If policy violation detected:
     - Admin opens user profile
     - Clicks "Suspend Account"
     - Enters reason and duration
     - Notifies user via email
     - User cannot login during suspension

**Exit Point:** User account is properly managed

---

### Flow 13: Approving and Moderating Listings

**Entry Point:** Admin clicks "Pending Listings" from dashboard

**Steps:**

1. **Pending Listings Queue**
   - List of all pending listings:
     - Vehicle photo and name
     - Owner name
     - Submission date
     - Quick approve/reject buttons
     - "Review" button for detailed view

2. **Listing Review**
   - Admin clicks "Review"
   - Detailed listing view (same as renter sees)
   - Review checklist:
     - Photos quality and appropriateness
     - Accurate vehicle information
     - Reasonable pricing
     - Clear rental terms
     - Valid plate number
     - Location validity

3. **Quality Checks**
   - Admin verifies:
     - Photos match vehicle description
     - No inappropriate content
     - Pricing not excessively high/low
     - Terms comply with platform policies
     - No duplicate listings

4. **Approval or Rejection**
   - If compliant:
     - Click "Approve Listing"
     - Listing goes live immediately
     - Owner notified of approval
   - If issues found:
     - Click "Reject Listing"
     - Select rejection reason(s):
       - Poor quality photos
       - Incomplete information
       - Policy violations
       - Duplicate listing
       - Suspicious activity
     - Add custom feedback
     - Owner receives detailed feedback
     - Owner can correct and resubmit

5. **Requesting Modifications**
   - For minor issues:
     - Click "Request Changes"
     - Specify what needs correction
     - Listing stays pending
     - Owner receives notification
     - Makes corrections and resubmits
     - Returns to admin queue

**Exit Point:** Listing is approved, rejected, or awaiting corrections

---

### Flow 14: Transaction and Dispute Management

**Entry Point:** Admin dashboard, clicks "Transactions" or "Disputes"

**Steps:**

1. **Transaction Dashboard**
   - Overview of all platform transactions:
     - Filter by date, status, amount
     - Search by booking reference, user
     - Columns showing:
       - Date, booking ref, renter, owner
       - Vehicle, amount, payment method
       - Status, platform fee
     - Export to CSV

2. **Individual Transaction View**
   - Admin clicks transaction
   - Complete details:
     - Full booking information
     - Payment timeline
     - Payment method details
     - Payout status to owner
     - Platform fees collected
     - Any refunds processed

3. **Dispute Queue**
   - List of open disputes:
     - Priority/severity indicator
     - Dispute type (damage, late return, payment, etc.)
     - Parties involved
     - Date opened
     - Status (new, in progress, resolved)

4. **Reviewing Dispute**
   - Admin clicks on dispute
   - Views both sides:
     - Renter's claim with evidence (photos, messages)
     - Owner's response with evidence
     - Booking and transaction details
     - Chat history between parties
     - Previous disputes involving either party

5. **Dispute Resolution**
   - Admin analyzes evidence
   - Options:
     - **Full refund to renter:** Owner at fault
     - **No refund:** Renter at fault
     - **Partial refund:** Shared responsibility
     - **Additional charge to renter:** Damage/late fees
     - **Warning to user:** Policy violation
   - Admin enters decision and reasoning
   - Executes financial action (refund, charge)
   - Closes dispute
   - Both parties notified

6. **Post-Resolution**
   - Decision recorded in both user profiles
   - Refunds processed within 5-7 business days
   - Admin can add notes for future reference
   - Patterns tracked for fraud detection

**Exit Point:** Dispute resolved, transaction completed

---

## Error Handling and Edge Case Flows

### Flow 15: Payment Failure Recovery

**Scenario:** User's payment fails during checkout

**Steps:**

1. **Payment Error Detected**
   - System captures error from payment gateway
   - Error message displayed to user:
     - Clear explanation of what went wrong
     - Suggested next steps

2. **Error Type Handling**
   - **Insufficient funds:**
     - "Payment failed: Insufficient balance. Please try another payment method."
     - Option to change payment method
   - **3D Secure failure:**
     - "Payment authentication failed. Please try again."
     - Option to retry payment
   - **Network timeout:**
     - "Connection lost. Checking payment status..."
     - System checks with payment gateway
     - Prevents duplicate charges

3. **Recovery Options**
   - User can:
     - Try different payment method
     - Retry same payment method
     - Save booking for later (hold for 15 minutes)
     - Contact support

4. **Booking Hold Period**
   - If payment fails, booking held for 15 minutes
   - User receives email with payment link
   - Can complete payment within hold period
   - After 15 minutes, vehicle released to others

**Exit Point:** Payment succeeds on retry, or booking cancelled

---

### Flow 16: Double Booking Prevention

**Scenario:** Two users try to book the same vehicle for overlapping dates

**Steps:**

1. **Concurrent Booking Attempts**
   - User A starts booking process
   - User B starts booking process for same vehicle/dates
   - Both add to cart and proceed to checkout

2. **Optimistic Locking**
   - First user to confirm payment (User A) locks the booking
   - User B's payment is processed
   - System checks availability before confirmation

3. **Availability Conflict Detection**
   - System detects vehicle no longer available
   - User B's payment is not processed or auto-refunded
   - Error message: "Sorry, this vehicle was just booked by another user."

4. **Alternative Suggestions**
   - System shows User B:
     - Similar vehicles still available for those dates
     - Same vehicle on different dates
     - "View Alternatives" button

5. **Auto-Refund if Charged**
   - If payment already processed:
     - Immediate automatic refund initiated
     - Refund confirmation shown
     - Apology and alternatives offered

**Exit Point:** Conflict resolved, user finds alternative or retries search

---

### Flow 17: GPS Tracking Alert (Vehicle Theft/Misuse)

**Scenario:** Owner receives GPS alert that vehicle left safe zone

**Steps:**

1. **Alert Trigger**
   - GPS system detects vehicle outside geofence
   - Or: Vehicle moving when not rented
   - Or: Excessive speed detected

2. **Immediate Notification**
   - Owner receives:
     - Push notification (if mobile app)
     - SMS alert
     - In-app notification
   - Alert contains:
     - Which vehicle
     - Current location (map link)
     - Type of alert
     - Timestamp

3. **Owner Response**
   - Owner opens dashboard
   - Views real-time map showing:
     - Vehicle current location
     - Movement trail
     - Current speed
   - Decides on action:
     - Contact renter (if rented)
     - Verify if authorized use
     - Report to authorities if theft

4. **Contacting Renter**
   - If vehicle is rented:
     - Owner sends message via chat
     - "I noticed you're far from Siargao. Is everything okay?"
     - Renter can explain (e.g., ferry to mainland)
     - Owner can adjust geofence or verify

5. **Reporting Theft**
   - If unauthorized movement:
     - Owner can mark as "Stolen" in dashboard
     - Admin notified immediately
     - Location tracking data available for police
     - Booking (if any) investigated

6. **Resolution**
   - Vehicle recovered
   - Owner updates status
   - Investigation if insurance claim needed

**Exit Point:** Alert addressed, appropriate action taken

---

## Mobile-Specific User Flows

### Flow 18: Mobile Booking Experience

**Entry Point:** User on mobile device (Android app or mobile web)

**Optimizations:**

1. **Mobile-First Search**
   - Large, thumb-friendly search button
   - Simplified filters (collapsible)
   - Swipeable vehicle cards
   - Infinite scroll instead of pagination

2. **Touch-Optimized Gallery**
   - Swipe through vehicle photos
   - Pinch to zoom
   - Full-screen image viewing
   - Thumbnail navigation

3. **Mobile Checkout**
   - Single-column form layout
   - Large input fields
   - Native date pickers
   - Autofill support for contact info
   - Mobile payment integration (GCash/Maya apps)

4. **Payment App Integration**
   - Seamless handoff to GCash/Maya app
   - Auto-return to JuanRide after payment
   - Deep linking support

5. **Offline Viewing**
   - Cached booking details available offline
   - Booking reference accessible without internet
   - Owner contact info saved locally

**Exit Point:** Completed booking with mobile-optimized experience

---

## Key User Experience Principles

Throughout all flows, JuanRide maintains:

1. **Clarity:**
   - Clear labels and instructions
   - No jargon or confusing terms
   - Progress indicators in multi-step processes

2. **Efficiency:**
   - Minimal clicks to complete tasks
   - Smart defaults and autofill
   - Quick actions where appropriate

3. **Feedback:**
   - Loading indicators during waits
   - Success/error messages
   - Confirmation dialogs for important actions

4. **Accessibility:**
   - Mobile-responsive design
   - Touch-friendly targets (min 44px)
   - Keyboard navigation support
   - Screen reader compatibility

5. **Error Prevention:**
   - Validation before submission
   - Confirmation for destructive actions
   - Clear error messages with recovery steps

6. **Consistency:**
   - Uniform UI patterns
   - Consistent terminology
   - Predictable navigation

---

## Conclusion

These user flows are designed to create a seamless, intuitive experience for all JuanRide users. Each flow prioritizes efficiency, clarity, and user satisfaction while maintaining security and preventing errors. As the platform evolves, these flows will be refined based on user feedback and analytics.
