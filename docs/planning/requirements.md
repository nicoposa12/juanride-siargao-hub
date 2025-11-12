# JuanRide Requirements Document

## Functional Requirements

### Module 1: Renter-Facing Platform

#### RENT-01: Vehicle Search and Browse
**Priority:** High  
**User Story:** As a Renter, I want to browse and search for available vehicles so that I can find a suitable option for my needs.

**Requirements:**
- The system must provide a search interface with filters for:
  - Vehicle type (scooter, motorcycle, car, van)
  - Date range (start date and end date)
  - Location within Siargao
  - Price range (minimum and maximum daily rate)
- Search results must update in real-time as filters are applied
- System must display only vehicles available for the selected date range
- Search results must be sortable by price, rating, and distance
- System must support pagination for large result sets

**Acceptance Criteria:**
- Search returns accurate results within 2 seconds
- Filters work independently and in combination
- Only available vehicles are displayed
- Results can be viewed in grid or list format

---

#### RENT-02: Vehicle Information Display
**Priority:** High  
**User Story:** As a Renter, I want to view detailed vehicle information so that I can make an informed decision.

**Requirements:**
- Each vehicle listing must display:
  - Multiple high-quality photos (minimum 3, maximum 20)
  - Vehicle specifications (type, make, model, year, plate number)
  - Daily and weekly pricing
  - Complete rental terms and conditions
  - Insurance information and coverage details
  - Owner policies and requirements
  - Pick-up and drop-off location
  - Vehicle availability calendar
- System must display aggregate rating and review count
- System must show recent reviews (minimum 3 most recent)
- Vehicle page must include a booking widget

**Acceptance Criteria:**
- All vehicle information loads within 3 seconds
- Photos can be viewed in full-screen gallery
- Pricing is clearly displayed with no hidden fees
- Availability calendar shows real-time booking status

---

#### RENT-03: Instant Booking
**Priority:** High  
**User Story:** As a Renter, I want to book a vehicle instantly online so that I can secure my rental without manual communication.

**Requirements:**
- System must provide instant booking capability without owner approval
- Booking form must collect:
  - Rental dates (start and end)
  - Renter contact information
  - Pickup and return preferences
  - Special requests or notes
- System must validate:
  - Vehicle availability for selected dates
  - No booking conflicts exist
  - User has valid payment method
- System must generate instant booking confirmation
- Confirmation must include:
  - Unique booking reference number
  - Complete booking details
  - Owner contact information
  - Pickup instructions
  - Cancellation policy

**Acceptance Criteria:**
- Booking process completes in under 2 minutes
- Confirmation appears immediately upon payment
- Owner receives notification within 1 minute
- System prevents double bookings

---

#### RENT-04: Payment Processing
**Priority:** High  
**User Story:** As a Renter, I want to pay for my booking securely online using various payment methods to complete my reservation.

**Requirements:**
- System must support the following payment methods:
  - GCash
  - Maya (formerly PayMaya)
  - Bank Transfer
  - Credit/Debit Cards (Visa, Mastercard)
- Payment processing must be:
  - PCI-compliant
  - Encrypted end-to-end
  - Support 3D Secure verification
- System must provide:
  - Clear payment breakdown
  - Immediate payment confirmation
  - Digital receipt via email
  - Transaction reference number
- Failed payments must:
  - Display clear error messages
  - Offer retry options
  - Release vehicle availability after timeout

**Acceptance Criteria:**
- Payment processing completes within 30 seconds
- Success rate exceeds 95%
- Receipts are automatically emailed
- Failed transactions do not create orphaned bookings

---

#### RENT-05: Notifications and Reminders
**Priority:** Medium  
**User Story:** As a Renter, I want to receive notifications and reminders about my booking so I don't miss important dates.

**Requirements:**
- System must send notifications via:
  - SMS to registered phone number
  - In-app notifications
  - Email
- Notification triggers:
  - Booking confirmation (immediate)
  - Payment confirmation (immediate)
  - Reminder 24 hours before pickup
  - Reminder 2 hours before return time
  - Booking modifications
  - Cancellations
- Users must be able to:
  - Configure notification preferences
  - Opt-out of specific notification types
  - Set preferred notification methods

**Acceptance Criteria:**
- Notifications are delivered within 2 minutes of trigger event
- SMS delivery rate exceeds 98%
- Users can manage preferences in profile settings
- Notifications include relevant booking details

---

#### RENT-06: Reviews and Ratings
**Priority:** High  
**User Story:** As a Renter, I want to view ratings and reviews for vehicles and owners so I can choose a reliable provider.

**Requirements:**
- System must display:
  - Overall average rating (1-5 stars)
  - Total number of reviews
  - Rating distribution (how many 5-star, 4-star, etc.)
  - Individual reviews with ratings
  - Reviewer name and review date
  - Verification badge for confirmed bookings
- Reviews must be sortable by:
  - Most recent
  - Highest rated
  - Lowest rated
  - Most helpful
- System must show vehicle-specific ratings
- System must show owner aggregate ratings

**Acceptance Criteria:**
- Ratings accurately reflect all reviews
- Only verified renters can leave reviews
- Reviews appear within 24 hours of submission
- Inappropriate reviews can be flagged

---

#### RENT-07: Submit Reviews
**Priority:** Medium  
**User Story:** As a Renter, I want to leave feedback and ratings after my rental so I can share my experience.

**Requirements:**
- System must allow review submission after rental completion
- Review form must include:
  - Overall rating (1-5 stars, required)
  - Category ratings (cleanliness, condition, value - optional)
  - Written review (optional, max 500 characters)
  - Photo uploads (optional, max 5 photos)
- System must:
  - Send review reminder 1 day after return
  - Allow editing within 48 hours of submission
  - Display reviewer name (or anonymous option)
  - Moderate for inappropriate content

**Acceptance Criteria:**
- Review submission completes in under 2 minutes
- Photos are compressed and optimized automatically
- Reviews appear publicly after moderation
- Owners can respond to reviews

---

#### RENT-08: In-App Communication
**Priority:** Medium  
**User Story:** As a Renter, I want to communicate with the vehicle owner through in-app chat for inquiries and coordination.

**Requirements:**
- System must provide real-time chat functionality
- Chat features must include:
  - Text messaging
  - Image sharing
  - Automated booking details in chat context
  - Message timestamps
  - Read receipts
  - Chat history preservation
- System must support:
  - Booking-specific conversations
  - Pre-booking inquiries
  - Post-booking coordination
- Notifications for new messages

**Acceptance Criteria:**
- Messages delivered in real-time (< 2 seconds)
- Chat history persists indefinitely
- Images are compressed for mobile viewing
- Unread message count is visible

---

#### RENT-09: Mobile Accessibility
**Priority:** High  
**User Story:** As a Renter, I want to access the platform on my mobile phone so I can manage bookings on the go.

**Requirements:**
- System must be fully responsive for mobile devices
- Mobile interface must support:
  - All search and booking functions
  - Photo viewing and gallery
  - Payment processing
  - Chat functionality
  - Booking management
- Android application must:
  - Use WebView to render responsive website
  - Support offline viewing of bookings
  - Integrate with mobile payment apps
  - Support push notifications
- Performance requirements:
  - Page load time < 3 seconds on 4G
  - Touch-friendly interface (minimum 44px tap targets)
  - Optimized images for mobile bandwidth

**Acceptance Criteria:**
- All features work on mobile devices
- Interface is usable on screens 320px and wider
- Android app passes Google Play Store requirements
- Mobile payment integration works seamlessly

---

### Module 2: Owner-Facing Dashboard

#### OWN-01: Vehicle Listing Management
**Priority:** High  
**User Story:** As an Owner, I want to create a profile and list my vehicles with descriptions, photos, and pricing so renters can book them.

**Requirements:**
- Owner onboarding must collect:
  - Business/owner name
  - Contact information
  - Business registration (if applicable)
  - ID verification
  - Bank account for payouts
- Vehicle listing form must include:
  - Vehicle type selection
  - Make, model, and year
  - Plate number (unique identifier)
  - Detailed description (max 1000 characters)
  - Daily pricing
  - Weekly pricing (optional discount)
  - Monthly pricing (optional discount)
  - Location/pickup address
  - Rental terms and requirements
- Photo upload must support:
  - Multiple photo upload (minimum 3, maximum 20)
  - Drag-and-drop interface
  - Automatic image optimization
  - Photo reordering
- Listing must support:
  - Save as draft
  - Submit for approval
  - Edit after approval
  - Activate/deactivate

**Acceptance Criteria:**
- Listing creation completes in under 10 minutes
- Photos upload within 30 seconds total
- Listings await admin approval before going live
- Owners receive notification when approved

---

#### OWN-02: Real-Time Dashboard
**Priority:** High  
**User Story:** As an Owner, I want a real-time dashboard that shows which vehicles are available, booked, or under maintenance.

**Requirements:**
- Dashboard must display:
  - Overview cards showing total vehicles, active bookings, revenue today
  - Vehicle status grid (available, booked, maintenance)
  - Calendar view of all bookings
  - Today's pickups and returns
  - Pending booking requests
  - Recent transactions
- Dashboard must update in real-time when:
  - New bookings are made
  - Bookings are cancelled
  - Vehicles are returned
  - Status changes occur
- Dashboard must provide quick actions:
  - Mark vehicle as picked up
  - Mark vehicle as returned
  - Change vehicle status
  - View booking details

**Acceptance Criteria:**
- Dashboard loads in under 3 seconds
- Real-time updates appear within 5 seconds
- All vehicle statuses are accurate
- Quick actions work without page refresh

---

#### OWN-03: Booking Management
**Priority:** High  
**User Story:** As an Owner, I want to manage booking requests by accepting, declining, or modifying them.

**Requirements:**
- System must display all bookings with:
  - Booking status (pending, confirmed, active, completed, cancelled)
  - Renter information
  - Vehicle details
  - Rental period
  - Total amount
  - Payment status
- For instant bookings:
  - Bookings are automatically confirmed
  - Owner receives notification
  - Owner can cancel with valid reason
- For request-based bookings (future feature):
  - Owner can accept or decline
  - Response required within 24 hours
  - Auto-decline after timeout
- Booking operations:
  - Mark as picked up
  - Mark as returned
  - Report damage or issues
  - Extend rental period
  - Process early returns

**Acceptance Criteria:**
- All bookings are visible in chronological order
- Status updates reflect immediately
- Renters receive notifications of status changes
- Booking history is preserved

---

#### OWN-04: Financial Tracking
**Priority:** High  
**User Story:** As an Owner, I want to track my earnings and view transaction history to monitor business performance.

**Requirements:**
- Financial dashboard must show:
  - Today's revenue
  - Week-to-date revenue
  - Month-to-date revenue
  - Total revenue (all time)
  - Pending payments
  - Completed transactions
- Transaction history must include:
  - Date and time
  - Booking reference
  - Vehicle
  - Amount
  - Payment method
  - Status (pending, paid, refunded)
  - Platform fee/commission
- Reports must be:
  - Exportable to CSV/Excel
  - Filterable by date range
  - Filterable by vehicle
  - Downloadable for accounting
- System must display:
  - Revenue by vehicle
  - Revenue trends over time
  - Payment method breakdown

**Acceptance Criteria:**
- Financial data is accurate and up-to-date
- Reports generate within 5 seconds
- Exported files contain all transaction details
- Revenue calculations include all fees

---

#### OWN-05: GPS Vehicle Tracking
**Priority:** Medium  
**User Story:** As an Owner, I want to track my vehicle's location using GPS to prevent loss and assist in recovery.

**Requirements:**
- System must integrate with GPS hardware installed on vehicles
- Tracking features must include:
  - Real-time location on map
  - Location history and route tracking
  - Geofence alerts (vehicle leaves designated area)
  - Speed monitoring
  - Movement notifications when vehicle is rented
  - Parking location logging
- Map interface must:
  - Show all vehicles on single map
  - Support individual vehicle tracking
  - Display current speed and heading
  - Show last known location if offline
- Alerts must notify owner when:
  - Vehicle leaves safe zone
  - Excessive speed detected
  - Unauthorized movement (when not rented)
  - GPS device is disconnected

**Acceptance Criteria:**
- Location updates every 30 seconds when active
- Map loads within 2 seconds
- Alerts sent within 1 minute of trigger
- Location history stored for 90 days

---

#### OWN-06: Maintenance Management
**Priority:** Medium  
**User Story:** As an Owner, I want to manage and schedule vehicle maintenance to ensure my fleet is safe and in optimal condition.

**Requirements:**
- Maintenance system must support:
  - Scheduled maintenance creation
  - Recurring maintenance schedules
  - Maintenance type categorization (oil change, tire rotation, etc.)
  - Service cost recording
  - Service provider information
  - Maintenance notes
- When maintenance is scheduled:
  - Vehicle availability is automatically blocked
  - Active bookings show "unavailable" for those dates
  - Owner receives reminders
- Maintenance history must display:
  - All past services
  - Service dates
  - Costs
  - Service provider
  - Notes
  - Odometer readings
- Reports must show:
  - Total maintenance costs per vehicle
  - Maintenance frequency
  - Cost trends

**Acceptance Criteria:**
- Maintenance schedules prevent new bookings
- Reminders sent 3 days before scheduled service
- History is complete and accurate
- Costs are tracked and reportable

---

#### OWN-07: Owner Notifications
**Priority:** High  
**User Story:** As an Owner, I want to receive notifications for new bookings, cancellations, and payment confirmations.

**Requirements:**
- Notification types:
  - New booking confirmed
  - Booking cancelled
  - Payment received
  - Payment pending
  - Review submitted
  - Message received
  - Pickup reminder (2 hours before)
  - Return reminder (2 hours before)
  - Maintenance reminder
  - Vehicle alert (GPS)
- Delivery methods:
  - SMS
  - Email
  - In-app notification
  - Push notification (mobile app)
- Notification preferences:
  - Enable/disable by type
  - Choose delivery method per type
  - Set quiet hours

**Acceptance Criteria:**
- Critical notifications (bookings, payments) always sent
- Preferences respected for non-critical notifications
- Notifications delivered within 2 minutes
- SMS delivery rate > 98%

---

#### OWN-08: Owner-Renter Communication
**Priority:** Medium  
**User Story:** As an Owner, I want to communicate with renters through in-app chat to answer questions and coordinate.

**Requirements:**
- Same chat functionality as renters (RENT-08)
- Additional owner features:
  - Quick reply templates
  - Automated responses for common questions
  - Chat assignment to staff members
  - Conversation tagging
- Owners must be able to:
  - Initiate conversations
  - View all active conversations
  - Search chat history
  - Archive old conversations

**Acceptance Criteria:**
- All renter chat features available to owners
- Quick replies save time on common questions
- Conversation list shows unread count
- Search finds messages across all chats

---

### Module 3: Administrator Panel

#### ADM-01: User Account Management
**Priority:** High  
**User Story:** As an Admin, I want to manage all user accounts including creating, updating, suspending, and deleting accounts.

**Requirements:**
- Admin must be able to:
  - View all users (renters, owners, admins)
  - Search users by name, email, phone
  - Filter by user type and status
  - View complete user profiles
  - Edit user information
  - Suspend accounts (with reason)
  - Delete accounts (with confirmation)
  - Reset passwords
  - Verify user identity
  - View user activity logs
- User list must display:
  - User name and email
  - User type and status
  - Registration date
  - Last login
  - Total bookings/listings
- Account actions must:
  - Require confirmation for destructive actions
  - Log all administrative changes
  - Notify users of account changes

**Acceptance Criteria:**
- User search returns results within 1 second
- All user data is accessible and editable
- Account suspensions are immediate
- Activity logs are complete and auditable

---

#### ADM-02: Listing Approval and Moderation
**Priority:** High  
**User Story:** As an Admin, I want to approve or reject new vehicle listings to ensure they meet platform quality and safety standards.

**Requirements:**
- Listing approval queue must show:
  - Pending listings
  - Listing details and photos
  - Owner information
  - Submission date
- Admin must be able to:
  - Approve listing (goes live immediately)
  - Reject listing (with reason sent to owner)
  - Request modifications
  - Suspend active listings
  - Remove listings permanently
- Quality checks must include:
  - Photo quality and appropriateness
  - Accurate vehicle information
  - Reasonable pricing
  - Clear rental terms
  - Valid license plate
- Admin must be able to:
  - Edit listing details
  - Flag for review
  - Add internal notes

**Acceptance Criteria:**
- Approval queue shows all pending listings
- Approve/reject actions are instant
- Owners receive notification of decision
- Quality standards are enforced consistently

---

#### ADM-03: Transaction Management
**Priority:** High  
**User Story:** As an Admin, I want to oversee all transactions and manage disputes or process refunds.

**Requirements:**
- Transaction dashboard must show:
  - All transactions (paginated)
  - Transaction details
  - Payment status
  - Disputes and issues
- Transaction filters:
  - Date range
  - Status
  - Payment method
  - Amount range
  - User or owner
- Admin must be able to:
  - View complete transaction details
  - Initiate refunds
  - Cancel transactions
  - Resolve disputes
  - Add notes to transactions
  - Download transaction reports
- Dispute resolution must:
  - Show both parties' perspectives
  - Allow admin mediation
  - Support partial refunds
  - Log resolution details
  - Notify all parties of outcome

**Acceptance Criteria:**
- All transactions are visible and searchable
- Refund processing completes within 24 hours
- Disputes have clear resolution workflow
- Transaction reports are accurate

---

#### ADM-04: Content Moderation
**Priority:** Medium  
**User Story:** As an Admin, I want to monitor and manage user-generated content such as reviews and ratings, and remove inappropriate content.

**Requirements:**
- Moderation queue must show:
  - Flagged reviews
  - Reported content
  - User complaints
  - Suspicious activity
- Admin must be able to:
  - Review flagged content
  - Approve or remove reviews
  - Edit review visibility
  - Warn or suspend users for violations
  - View content history
- Content filters must detect:
  - Profanity and inappropriate language
  - Spam and promotional content
  - Fake or fraudulent reviews
  - Duplicate content
- Actions must include:
  - Approve content
  - Remove content
  - Request modification
  - Ban user from reviews

**Acceptance Criteria:**
- Flagged content appears in moderation queue
- Removal is immediate and irreversible
- Users are notified of removals
- Moderation logs are maintained

---

#### ADM-05: System Analytics and Reporting
**Priority:** High  
**User Story:** As an Admin, I want to generate system-wide reports on key metrics like booking volume, revenue, and user activity.

**Requirements:**
- Analytics dashboard must show:
  - Total users (renters, owners)
  - Active listings
  - Total bookings (daily, weekly, monthly)
  - Revenue metrics
  - Platform growth trends
  - User engagement metrics
  - Conversion rates
- Reports must include:
  - User acquisition and retention
  - Booking conversion funnel
  - Revenue by vehicle type
  - Geographic distribution
  - Payment method usage
  - Top performing listings
  - User satisfaction scores
- Data visualization:
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distributions
  - Tables for detailed data
- Export capabilities:
  - CSV export
  - PDF reports
  - Scheduled email reports
  - Custom date ranges

**Acceptance Criteria:**
- Dashboard loads in under 5 seconds
- Data is accurate and current
- Reports are exportable in multiple formats
- Visualizations are clear and informative

---

#### ADM-06: System Configuration
**Priority:** Medium  
**User Story:** As an Admin, I want to configure system settings such as booking policies, rental rates, and payment gateway integrations.

**Requirements:**
- Configuration panel must allow:
  - Platform-wide settings
  - Booking policy configuration
  - Commission rate settings
  - Payment gateway management
  - Email template editing
  - SMS template editing
  - Feature toggles
  - Maintenance mode
- Booking policies:
  - Cancellation policy
  - Minimum/maximum rental periods
  - Advance booking requirements
  - Age restrictions
  - Deposit requirements
- Payment settings:
  - Payment gateway credentials
  - Commission percentages
  - Payout schedules
  - Currency settings
- Communication settings:
  - Email service configuration
  - SMS provider settings
  - Notification templates
  - Sender information

**Acceptance Criteria:**
- All settings are editable and save successfully
- Changes take effect immediately or as scheduled
- Invalid configurations are prevented
- Settings changes are logged

---

## Non-Functional Requirements

### Performance Requirements

**Response Time:**
- Page load time: < 3 seconds on 4G connection
- API response time: < 500ms for 95% of requests
- Search results: < 2 seconds
- Payment processing: < 30 seconds
- Real-time chat: < 2 seconds message delivery

**Throughput:**
- Support minimum 1,000 concurrent users
- Handle 10,000+ daily bookings during peak season
- Process 500+ payment transactions per hour

**Database Performance:**
- Query response time: < 100ms for 90% of queries
- Support for 100,000+ vehicles
- Support for 1,000,000+ users
- Transaction processing: < 50ms

### Security Requirements

**Authentication:**
- Secure user authentication using Supabase Auth
- Password hashing with bcrypt (minimum 12 rounds)
- JWT token-based authorization
- Session management with secure tokens
- Multi-factor authentication support (future)

**Data Protection:**
- All data encrypted at rest (AES-256)
- All communications encrypted in transit (TLS 1.3)
- PCI-DSS compliance for payment data
- Personal data anonymization in logs
- Secure backup encryption

**Access Control:**
- Role-based access control (RBAC)
- Principle of least privilege
- Admin action audit logging
- API rate limiting
- IP-based access restrictions for admin panel

**Input Validation:**
- Server-side validation for all inputs
- SQL injection prevention
- XSS attack prevention
- CSRF token validation
- File upload restrictions and scanning

### Scalability Requirements

**Horizontal Scaling:**
- Stateless application design
- Load balancer support
- Database replication support
- Microservices architecture readiness

**Vertical Scaling:**
- Optimize for increasing user base (10x growth)
- Database indexing for performance
- Caching strategy implementation
- CDN integration for static assets

**Storage:**
- Scalable cloud storage for images
- Database storage growth planning
- Log rotation and archival
- Backup retention policies

### Availability Requirements

**Uptime:**
- System uptime: 99.9% (< 8.7 hours downtime per year)
- Scheduled maintenance windows: off-peak hours only
- Maximum unplanned downtime: 1 hour per incident

**Disaster Recovery:**
- Daily automated backups
- Point-in-time recovery capability
- Backup retention: 30 days
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

**Monitoring:**
- Real-time system health monitoring
- Error logging and alerting
- Performance metrics tracking
- Uptime monitoring
- Automated incident response

### Reliability Requirements

**Data Integrity:**
- ACID compliance for transactions
- Referential integrity enforcement
- Data validation at application and database levels
- Duplicate booking prevention
- Consistent state management

**Error Handling:**
- Graceful error handling
- User-friendly error messages
- Automatic retry for transient failures
- Transaction rollback on failures
- Error logging for debugging

### Usability Requirements

**User Interface:**
- Intuitive navigation
- Consistent design language
- Responsive design (mobile, tablet, desktop)
- Accessibility compliance (WCAG 2.1 Level AA)
- Multi-browser support (Chrome, Firefox, Safari, Edge)

**User Experience:**
- Maximum 3 clicks to complete booking
- Clear call-to-action buttons
- Helpful error messages with recovery steps
- Progress indicators for multi-step processes
- Confirmation dialogs for important actions

**Localization:**
- Filipino Peso (PHP) as primary currency
- English as primary language
- Date format: MM/DD/YYYY or DD/MM/YYYY (configurable)
- Time zone: Philippine Time (UTC+8)

### Compliance Requirements

**Data Privacy:**
- Compliance with Data Privacy Act of 2012 (Philippines)
- User consent for data collection
- Right to data access and deletion
- Privacy policy and terms of service
- Cookie consent management

**Business Compliance:**
- Accurate financial record keeping
- Tax reporting capabilities
- Business registration requirements
- Consumer protection compliance

### Browser and Device Support

**Web Browsers:**
- Google Chrome (last 2 versions)
- Mozilla Firefox (last 2 versions)
- Safari (last 2 versions)
- Microsoft Edge (last 2 versions)

**Mobile Devices:**
- iOS 13+
- Android 8.0+
- Responsive design for screens 320px to 2560px wide

**Operating Systems:**
- Windows 10+
- macOS 10.14+
- Linux (Ubuntu, Fedora, etc.)
- Android 8.0+
- iOS 13+

### Testing Requirements

**Test Coverage:**
- Unit test coverage: minimum 80%
- Integration test coverage: minimum 70%
- End-to-end test coverage for critical paths
- Performance testing under load
- Security testing and penetration testing

**Testing Types:**
- Automated unit testing
- Integration testing
- End-to-end testing
- User acceptance testing
- Load and stress testing
- Security testing
- Cross-browser testing
- Mobile device testing
