# JuanRide Siargao Hub - System Documentation
## Part 1: System Overview & Technical Stack

**Version 1.0 | Date: November 18, 2025**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack Explained](#technology-stack-explained)
3. [System Architecture Flow](#system-architecture-flow)

---

## System Overview

### 1.1. Project Mission

**Problem:** Tourists and locals in Siargao struggle to find reliable, affordable vehicle rentals. Traditional rental shops lack online presence, making it hard to compare prices, check availability, or book in advance. Vehicle owners miss opportunities to earn from their idle vehicles.

**Solution:** JuanRide is a web-based vehicle rental marketplace that connects vehicle owners with renters in Siargao, providing a transparent, secure platform for discovering, booking, and managing vehicle rentals with real-time availability, instant messaging, and integrated payment processing.

### 1.2. Core Objectives

1. **Democratize Vehicle Rental:** Empower local vehicle owners to list their motorcycles, cars, and bicycles without technical expertise
2. **Provide Transparency:** Offer clear pricing, real-time availability, and verified reviews to build trust
3. **Ensure Security:** Implement role-based access control, secure payment processing via PayMongo, and verified user profiles
4. **Streamline Operations:** Automate booking management, payment tracking, and communication between renters and owners
5. **Enable Scalability:** Build on cloud infrastructure (Supabase) that automatically grows with demand
6. **Support Local Economy:** Keep commission fees reasonable (10%) to maximize owner earnings while sustaining platform operations

### 1.3. Target Audience & Value Proposition

#### Primary Audience: Vehicle Owners (Motorcycle, Car, Bicycle)
**Who they are:** Local Siargao residents with 1-5 idle vehicles, limited technical skills, seeking supplemental income.

**Why they'll choose JuanRide:**
- **Zero upfront cost:** No setup fees to list vehicles
- **Easy management:** Simple dashboard to track bookings, earnings, and vehicle status
- **Secure payments:** Automated payment collection via PayMongo (GCash, Maya, Cards)
- **Marketing for free:** Platform drives customer traffic; owners don't need their own website
- **Real-time communication:** Chat directly with renters to answer questions

#### Secondary Audience: Renters (Tourists & Locals)
**Who they are:** Tourists visiting Siargao (ages 18-45), digital nomads, and locals needing temporary vehicles.

**Why they'll choose JuanRide:**
- **Convenience:** Book vehicles online before arriving in Siargao, avoiding airport taxi scams
- **Price transparency:** Compare daily, weekly, and monthly rates side-by-side
- **Verified options:** See real photos, ratings, and availability calendars
- **Instant booking confirmation:** No back-and-forth calls; book in seconds
- **Secure payment:** Pay via trusted Philippine payment methods (GCash, Maya)

#### Tertiary Audience: Platform Administrators
**Who they are:** JuanRide staff managing platform quality and safety.

**Why they need the system:**
- **Moderation dashboard:** Approve/reject vehicle listings to maintain quality
- **Analytics:** Track revenue, user growth, and booking trends
- **Support tools:** Manage tickets and user disputes efficiently

---

## Technology Stack Explained

Think of building a web app like building a house. You need different materials for different parts: wood for the frame, concrete for the foundation, glass for windows. Our "materials" are software technologies, each chosen for a specific reason.

### Frontend Technologies (The "Shopfront" - What Users See)

#### 1. Next.js 14 (React Framework)
- **What it is:** Next.js is a framework (a pre-built toolkit) built on top of React. React is a library that lets us build user interfaces using reusable "components" (like LEGO blocks).
- **Why we chose it:** Next.js gives us both the "shopfront" (what users see) and a "back office" (API routes) in one codebase. It's like getting a store and warehouse in the same building. It also automatically makes our website load super fast by "pre-building" pages before users even visit them.
- **Simple analogy:** If building a website is like building with LEGOs, React gives us the LEGO blocks, and Next.js gives us the instruction manual plus special pieces that make everything snap together faster.

#### 2. TypeScript
- **What it is:** TypeScript is JavaScript (the programming language that runs in web browsers) with added "rules" that catch mistakes before they become bugs.
- **Why we chose it:** It's like spell-check for code. If we accidentally type `user.nmae` instead of `user.name`, TypeScript immediately tells us "Hey, that's wrong!" This prevents bugs from reaching real users.
- **Simple analogy:** JavaScript is like writing in pencil—you can write anything. TypeScript is like writing with a smart pen that underlines errors as you write.

#### 3. Tailwind CSS
- **What it is:** A styling framework that lets us design the look of our website using pre-made "style commands" (like `text-blue-500` for blue text).
- **Why we chose it:** Instead of writing hundreds of lines of custom style code, we use Tailwind's shortcuts. It's faster, more consistent, and easier to maintain.
- **Simple analogy:** Traditional CSS is like mixing paint from scratch every time. Tailwind is like having 500 pre-mixed paint colors ready to use instantly.

#### 4. shadcn/ui Components
- **What it is:** A collection of pre-built, beautiful UI pieces (buttons, forms, cards, dialogs) that we can copy-paste into our project.
- **Why we chose it:** Why build a button from scratch when someone already built a perfect, accessible button? These components follow modern design standards and work on all devices.
- **Simple analogy:** It's like buying furniture from IKEA instead of building every chair from raw wood.

#### 5. React Query (TanStack Query)
- **What it is:** A tool that manages fetching, caching, and updating data from our database.
- **Why we chose it:** When a user searches for vehicles, React Query fetches the results, stores them temporarily ("caches" them), and automatically refreshes them when they're old. This makes our app feel instant.
- **Simple analogy:** It's like a smart assistant who remembers what you asked for 5 minutes ago, so they don't have to run to the library every time you need the same information.

### Backend Technologies (The "Kitchen" - Where Logic Happens)

#### 6. Next.js API Routes
- **What it is:** Next.js lets us create "endpoints" (URLs that our frontend talks to) right inside our frontend codebase. For example, `/api/notifications/email` is an endpoint that sends emails.
- **Why we chose it:** We don't need a separate server codebase. Everything lives together, making development faster and deployment simpler.
- **Simple analogy:** It's like having the kitchen connected to the restaurant dining area instead of in a separate building across the street.

#### 7. Supabase (Backend-as-a-Service)
- **What it is:** Supabase is a cloud platform that provides four critical services in one:
  - **PostgreSQL Database:** Where we store all our data (users, vehicles, bookings)
  - **Authentication System:** Handles user sign-ups, logins, password resets securely
  - **Storage:** Cloud file storage for vehicle photos
  - **Realtime Subscriptions:** Allows live updates (like chat messages appearing instantly)
- **Why we chose it:** Building these four systems from scratch would take months. Supabase gives us enterprise-grade security and scalability out of the box. It also automatically handles things like password encryption and SQL injection protection.
- **Simple analogy:** Supabase is like renting a fully-equipped commercial kitchen, walk-in freezer, safe, and phone system instead of building them all yourself. You focus on cooking (your app logic), not plumbing and electrical work.

### Database (The "Pantry" - Where Data Lives)

#### 8. PostgreSQL (via Supabase)
- **What it is:** A "relational database" that stores data in organized tables (like Excel spreadsheets) with relationships between them.
- **Why we chose it:** PostgreSQL is battle-tested, handles complex queries (searching, filtering, joining data), and has built-in safety features. Plus, Supabase manages it for us, so we don't worry about servers crashing.
- **Simple analogy:** Think of it as a super-organized filing cabinet where every piece of paper (data) has a specific drawer (table), and we can instantly find related papers using reference numbers (foreign keys).

### Authentication & Security (The "Security Guard")

#### 9. Supabase Auth
- **What it is:** A secure authentication service that manages user accounts, passwords, email verification, and password resets.
- **Why we chose it:** Building secure authentication is extremely difficult and dangerous if done wrong. Supabase Auth follows industry best practices (like bcrypt password hashing, JWT tokens, and secure session management) automatically.
- **Simple analogy:** It's like hiring a professional security company to guard your store instead of trying to learn martial arts yourself.

#### 10. Row Level Security (RLS) Policies
- **What it is:** Database-level security rules that automatically ensure users can only see and modify their own data.
- **Why we chose it:** Even if a hacker finds a vulnerability in our code, RLS acts as a second wall of defense. For example, a renter can't view another renter's bookings because the database itself blocks unauthorized access.
- **Simple analogy:** It's like having automatic locks on every drawer in a filing cabinet that only open for authorized people—even if someone breaks into the office.

### Payment Processing (The "Cash Register")

#### 11. PayMongo
- **What it is:** A Philippine-based payment gateway (like Stripe, but optimized for the Philippines) that handles GCash, Maya (formerly PayMaya), credit/debit cards, and bank transfers.
- **Why we chose it:** Our target market is in the Philippines, where GCash and Maya are dominant. PayMongo is PCI-DSS compliant (bank-level security for credit card data) and handles complex payment flows, so we never touch raw credit card numbers.
- **Simple analogy:** PayMongo is like a secure cash register that accepts all payment types and protects both the customer's credit card and our business from fraud.

### Cloud Storage (The "Photo Album")

#### 12. Supabase Storage
- **What it is:** Cloud file storage specifically for user-uploaded images (vehicle photos, profile pictures).
- **Why we chose it:** Integrated with Supabase, so images are protected by the same security rules (RLS). We get automatic CDN (Content Delivery Network) support, meaning images load fast worldwide.
- **Simple analogy:** It's like having an unlimited photo album hosted on the cloud that automatically resizes images to fit phone screens vs. computer screens.

### Deployment & Hosting (The "Land & Building")

#### 13. Vercel (Frontend Hosting)
- **What it is:** A cloud hosting platform optimized for Next.js apps, with automatic deployments from GitHub.
- **Why we chose it:** Every time we push code to GitHub, Vercel automatically builds and deploys our app globally in under 2 minutes. It also provides a fast CDN (servers in multiple countries) so pages load quickly everywhere.
- **Simple analogy:** It's like having a chain of stores that instantly update their inventory and signage the moment headquarters sends new products.

---

## Data Flow Diagrams (DFD)

For detailed, code-traced data flow diagrams of all 8 core system flows, see:

- **[Part 1: User Signup & Vehicle Search](./DATA_FLOW_DIAGRAMS_PART1.md)**
  - DFD 1: User Signup & Profile Creation Flow
  - DFD 2: Vehicle Search & Availability Filtering

- **[Part 2: Booking & Payment Processing](./DATA_FLOW_DIAGRAMS_PART2.md)**
  - DFD 3: Booking Creation & Checkout Flow
  - DFD 4: PayMongo Payment Processing Flow

- **[Part 3: Chat, Listings & Security](./DATA_FLOW_DIAGRAMS_PART3.md)**
  - DFD 5: Real-time Chat Messaging System
  - DFD 6: Owner Vehicle Listing Creation
  - DFD 7: Admin Dashboard Analytics Aggregation
  - DFD 8: Middleware Role-Based Authorization

These diagrams trace actual code execution paths through the system, showing exactly how data flows from user input through API routes, database queries, and external services, with specific file and line number references.

---

## System Architecture Flow

This diagram shows how information flows through our system when a user books a vehicle. Think of it like tracking a pizza order from phone call to delivery.

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S WEB BROWSER                      │
│                    (The Customer / Storefront)                  │
│  - User sees pages, clicks buttons, fills forms                │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (1) User types URL or clicks link
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND APP                         │
│                   (The Shop Staff / Waiter)                     │
│  - React Components: VehicleGrid, BookingForm, ChatBox         │
│  - Manages what user sees and collects user input              │
│  - Handles routing (/vehicles, /checkout, /messages)           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (2) Frontend needs data → Makes API request
             │     Example: "GET /api/vehicles?type=motorcycle"
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE (Security Guard)                    │
│  - Checks: Is user logged in? (Session validation)             │
│  - Checks: Does user have permission? (Role: renter/owner)     │
│  - Decision: Allow request OR Redirect to /unauthorized        │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (3) Request approved → Continue to backend
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (The Kitchen)                   │
│  - Endpoint examples:                                           │
│    • /api/vehicles → Fetches vehicle data                      │
│    • /api/bookings → Creates booking records                   │
│    • /api/notifications/email → Sends emails                   │
│  - Processes business logic (price calculations, validations)  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (4) Backend needs to read/write data
             ▼
┌─────────────────────────────────────────────────────────────────┐
│            SUPABASE CLIENT (The Data Messenger)                 │
│  - Supabase JavaScript library that talks to cloud database    │
│  - Handles authentication tokens in requests                   │
│  - Formats queries and parses responses                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (5) Query sent to cloud → "SELECT * FROM vehicles"
             ▼
┌─────────────────────────────────────────────────────────────────┐
│            SUPABASE CLOUD (The Master Server)                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  POSTGRESQL DATABASE (The Pantry - Where Data Lives)     │ │
│  │  - Tables: users, vehicles, bookings, payments, messages │ │
│  │  - Row Level Security: Automatic data access control     │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  AUTHENTICATION SERVICE (The Bouncer)                    │ │
│  │  - Manages user sessions (login/logout)                  │ │
│  │  - Password hashing, email verification, password reset  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  STORAGE SERVICE (The Photo Archive)                     │ │
│  │  - Bucket: vehicle-images (uploaded vehicle photos)      │ │
│  │  - Automatically generates public URLs for images        │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  REALTIME SERVICE (The Instant Messenger)                │ │
│  │  - WebSocket channels for live chat                      │ │
│  │  - Broadcasts new messages instantly to connected users  │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ (6) Data retrieved → Sent back up the chain
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES (Partners)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PAYMONGO (The Payment Processor)                       │   │
│  │  - Creates payment sources (GCash, Maya, Card)          │   │
│  │  - Processes transactions securely                       │   │
│  │  - Sends webhooks (notifications) on payment status      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

               DATA FLOWS BACK TO USER'S BROWSER
                    ↓
            User sees vehicles, booking confirmation, etc.
```

### Real-World Example Flow: User Books a Motorcycle

Let's follow a complete transaction step-by-step:

1. **User visits** `juanride.com/vehicles` in their browser
2. **Frontend (React)** displays the vehicle search page
3. **User filters** for "motorcycle" and clicks "Search"
4. **Frontend makes request** to `/api/vehicles?type=motorcycle`
5. **Middleware checks** user is logged in (session cookie)
6. **API Route** calls `searchVehicles()` function
7. **Supabase Client** sends SQL query: `SELECT * FROM vehicles WHERE type = 'motorcycle' AND status = 'available'`
8. **PostgreSQL Database** returns 15 matching vehicles
9. **API Route** checks availability (cross-references bookings table)
10. **Data flows back** to Frontend → User sees 15 motorcycles
11. **User clicks** "Book Now" on a Honda Click 150
12. **Frontend shows** checkout form
13. **User fills** dates (Dec 1-7), submits form
14. **API Route** creates booking record in database, calculates total price (7 days × ₱500/day = ₱3,500)
15. **Payment Page loads**, user selects "GCash"
16. **API calls PayMongo API** to create payment source
17. **PayMongo returns** redirect URL to GCash payment page
18. **User completes payment** in GCash app
19. **PayMongo webhook** notifies our API: "Payment successful!"
20. **API updates** booking status to "confirmed", payment status to "paid"
21. **User receives** confirmation email and sees booking in their dashboard
22. **Owner receives** notification of new booking and payment

---

## Next Documents

Continue reading:
- **Part 2:** [Frontend & Backend Implementation Details](PART2_TECHNICAL_IMPLEMENTATION.md)
- **Part 3:** [Feature Deep-Dive & Database Schema](PART3_FEATURE_IMPLEMENTATION.md)
- **Part 4:** [Business & Marketing Strategy](PART4_BUSINESS_STRATEGY.md)
- **Part 5:** [Defense Preparation Q&A](PART5_DEFENSE_GUIDE.md)
