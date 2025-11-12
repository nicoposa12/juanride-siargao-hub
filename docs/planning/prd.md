Of course. Here is a comprehensive analysis of the "JUANRIDE: A DIGITAL VEHICLE RENTAL SYSTEM FOR EFFICIENT BOOKING AND MONITORING" capstone project, presented as a detailed Product Requirements Document (PRD).

This PRD synthesizes all information from the provided thesis, organizes it into a standard product development format, and incorporates the requested update to a PostgreSQL database using Supabase.

---

## **Product Requirements Document: JuanRide**

### **1. Introduction & Problem Statement**

**Product:** JuanRide  
**Date:** October 30, 2025  
**Author:** Gemini (based on the work of Camingue, Cañedo, Oposa, Sarvida)  
**Status:** Scoping & Definition

JuanRide is a digital platform designed to modernize and streamline the vehicle rental market in Siargao Island, a major tourist destination in the Philippines. The current vehicle rental ecosystem relies heavily on outdated, manual processes such as paper records, spreadsheets, and informal social media inquiries.

This leads to significant inefficiencies for both vehicle owners and renters:
*   **For Vehicle Owners:** Inefficient fleet management, frequent double bookings, difficulty tracking vehicle availability and location, inaccurate revenue tracking, and limited customer reach.
*   **For Renters (Tourists & Locals):** A fragmented and frustrating booking experience, lack of a centralized platform to view and compare options, uncertainty about vehicle availability and pricing, and potential for miscommunication regarding rental terms.

The JuanRide project directly addresses these challenges by creating a centralized, efficient, and user-friendly digital marketplace for vehicle rentals.

### **2. Product Goals & Objectives**

The primary goal of JuanRide is to become the leading digital platform for vehicle rentals in Siargao, enhancing operational efficiency for businesses and creating a seamless booking experience for users.

*   **Business Objectives:**
    *   Eliminate double bookings and scheduling conflicts for rental owners.
    *   Automate booking, payment, and fleet management processes.
    *   Provide owners with data and analytics to optimize pricing and availability.
    *   Expand the market reach for local rental businesses.

*   **User Objectives:**
    *   Provide a single, reliable platform for renters to find, compare, and book vehicles.
    *   Ensure real-time visibility of vehicle availability and transparent pricing.
    *   Offer secure and convenient digital payment options.
    *   Build trust through a system of user ratings and reviews.

*   **System Objectives:**
    *   Develop a scalable and secure platform that can be expanded to other tourist locations.
    *   Ensure high availability (>99% uptime) and performance (page loads < 3 seconds).
    *   Maintain the integrity and privacy of all user data in compliance with local laws.

### **3. User Personas**

**1. The Renter: "Alex the Tourist"**
*   **Demographics:** 28 years old, tech-savvy traveler planning a one-week trip to Siargao.
*   **Goals:**
    *   To easily find and rent a scooter for the duration of their trip.
    *   To compare prices and options from different vendors without physically visiting shops.
    *   To have a confirmed booking before arriving on the island.
*   **Frustrations:**
    *   Wasting time messaging multiple Facebook pages with slow or no responses.
    *   Arriving at a shop to find no vehicles are available.
    *   Lack of clear pricing and hidden fees.

**2. The Vehicle Owner: "Maria the Entrepreneur"**
*   **Demographics:** 45 years old, owns a small fleet of 10 motorcycles and 2 vans in Siargao.
*   **Goals:**
    *   To keep her vehicles rented out as much as possible.
    *   To reduce the time spent managing bookings via phone calls and notebooks.
    *   To prevent vehicle theft or misuse and ensure timely returns.
*   **Frustrations:**
    *   Losing track of which vehicle is rented, when it's due back, and who has it.
    *   Accidentally double-booking a vehicle, leading to unhappy customers.
    *   Manually tracking payments and revenues.

**3. The System Administrator**
*   **Demographics:** A member of the JuanRide operational team.
*   **Goals:**
    *   To ensure the platform runs smoothly for all users.
    *   To manage user accounts and listings, ensuring they meet platform standards.
    *   To handle disputes and support requests effectively.
*   **Frustrations:**
    *   Inability to quickly resolve user issues due to a lack of system tools.
    *   Poorly structured data that makes reporting and analysis difficult.

### **4. Functional Requirements & Features**

#### **Module 1: Renter-Facing Platform**
| Feature ID | User Story | Details | Priority |
| :--- | :--- | :--- | :--- |
| RENT-01 | As a Renter, I want to browse and search for available vehicles... | ...so that I can find a suitable option for my needs. Search filters must include: vehicle type (scooter, car, van), date range, location, and price. | High |
| RENT-02 | As a Renter, I want to view detailed vehicle information... | ...so that I can make an informed decision. Details include photos, pricing, rental terms, insurance info, and owner policies. | High |
| RENT-03 | As a Renter, I want to book a vehicle instantly online... | ...so that I can secure my rental without manual back-and-forth communication. System must provide instant confirmation. | High |
| RENT-04 | As a Renter, I want to pay for my booking securely online... | ...using various payment methods (GCash, Maya, Bank Transfer, Cards) to complete my reservation. | High |
| RENT-05 | As a Renter, I want to receive notifications and reminders... | ...about my booking confirmation, upcoming rental, and return time via SMS and in-app alerts. | Medium |
| RENT-06 | As a Renter, I want to view ratings and reviews for vehicles and owners... | ...so I can choose a reliable and trusted provider. | High |
| RENT-07 | As a Renter, I want to leave my own feedback and rating... | ...after my rental is complete to share my experience with others. | Medium |
| RENT-08 | As a Renter, I want to communicate with the vehicle owner... | ...through an in-app chat for any inquiries or coordination. | Medium |
| RENT-09 | As a Renter, I want to access the platform on my mobile phone... | ...so I can manage my booking on the go. | High |

#### **Module 2: Owner-Facing Dashboard**
| Feature ID | User Story | Details | Priority |
| :--- | :--- | :--- | :--- |
| OWN-01 | As an Owner, I want to create a profile and list my vehicles... | ...with descriptions, photos, pricing, and availability so that renters can book them. | High |
| OWN-02 | As an Owner, I want a real-time dashboard... | ...that shows me which vehicles are available, booked, or under maintenance. | High |
| OWN-03 | As an Owner, I want to manage booking requests... | ...by accepting, declining, or modifying them through my dashboard. | High |
| OWN-04 | As an Owner, I want to track my earnings and view transaction history... | ...to monitor my business performance. | High |
| OWN-05 | As an Owner, I want to track my vehicle's location using GPS... | ...to prevent loss, misuse, and assist in recovery. This requires hardware installation on vehicles. | Medium |
| OWN-06 | As an Owner, I want to manage and schedule vehicle maintenance... | ...so I can ensure my fleet is safe and in optimal condition. | Medium |
| OWN-07 | As an Owner, I want to receive notifications for new bookings... | ...cancellations, and payment confirmations. | High |
| OWN-08 | As an Owner, I want to communicate with renters... | ...through an in-app chat to answer questions and coordinate pick-up/drop-off. | Medium |

#### **Module 3: Administrator Panel**
| Feature ID | User Story | Details | Priority |
| :--- | :--- | :--- | :--- |
| ADM-01 | As an Admin, I want to manage all user accounts... | ...including creating, updating, suspending, and deleting accounts for renters and owners. | High |
| ADM-02 | As an Admin, I want to approve or reject new vehicle listings... | ...to ensure they meet platform quality and safety standards. | High |
| ADM-03 | As an Admin, I want to oversee all transactions... | ...and have the ability to manage disputes or process refunds. | High |
| ADM-04 | As an Admin, I want to monitor and manage user-generated content... | ...such as reviews and ratings, and remove any that is inappropriate or fraudulent. | Medium |
| ADM-05 | As an Admin, I want to generate system-wide reports... | ...on key metrics like booking volume, revenue, and user activity. | High |
| ADM-06 | As an Admin, I want to configure system settings... | ...such as booking policies, rental rates, and payment gateway integrations. | Medium |

### **5. Technical Requirements & Architecture**

The project will be developed with a modern, scalable technology stack.

*   **Frontend (Web Application):** Next.js 14 (React)
*   **Styling:** Tailwind CSS, Shadcn/UI
*   **Mobile Application:** Android Studio utilizing a WebView to render the responsive web application.
*   **Backend & Database:** **Supabase (PostgreSQL)**
    *   This is an update from the originally proposed MongoDB. Supabase is chosen for its powerful combination of a relational PostgreSQL database with backend-as-a-service features, which are perfectly suited for JuanRide's needs.
    *   **Authentication:** Supabase Auth for secure user sign-up, login, and role management (renter, owner, admin).
    *   **Database:** Supabase's managed PostgreSQL for storing all transactional data. The relational model ensures data integrity for bookings, payments, and user relationships.
    *   **Real-time Functionality:** Supabase Realtime Subscriptions will power features like in-app chat and live updates on booking status.
    *   **Storage:** Supabase Storage for handling user-uploaded images of vehicles and identity documents.
    *   **Serverless Functions:** Supabase Edge Functions can be used for backend logic like processing payments or sending notifications.
*   **Hosting & Deployment:** DigitalOcean, Vercel (for Next.js), and GoDaddy for domain management.

### **6. Updated Database Schema (PostgreSQL for Supabase)**

```sql
-- Users table stores information for all roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('renter', 'owner', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table, linked to an owner
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('scooter', 'motorcycle', 'car', 'van')),
    make TEXT,
    model TEXT,
    year INT,
    plate_number TEXT UNIQUE,
    description TEXT,
    price_per_day NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    location TEXT,
    image_urls TEXT[], -- Array of URLs from Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table is the core of the system
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table, linked to a booking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table for feedback
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    reviewer_id UUID REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance logs for vehicles
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id),
    service_date DATE NOT NULL,
    description TEXT,
    cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **7. Non-Functional Requirements**

*   **Usability:** The UI must be clean, intuitive, and easy to navigate for non-tech-savvy users.
*   **Performance:** All pages must load in under 3 seconds. The backend must handle concurrent booking requests without degradation.
*   **Security:** All user data, especially personal information and payment details, must be encrypted in transit and at rest. Implement secure login and ID verification.
*   **Scalability:** The architecture must support growth in the number of users, vehicles, and transaction volume, with the potential to expand to new geographical locations.
*   **Reliability:** The system must maintain >99% uptime. Regular data backups are required to prevent data loss.
*   **Compliance:** The system must comply with the Data Privacy Act of the Philippines.

### **8. Success Metrics (KPIs)**

*   **Platform Growth:**
    *   Number of active renters and vehicle owners.
    *   Number of vehicles listed on the platform.
*   **Engagement & Satisfaction:**
    *   Daily/Monthly Active Users (DAU/MAU).
    *   Booking conversion rate (from search to confirmed booking).
    *   Average user ratings for both renters and owners.
*   **Business & Operational:**
    *   Total Gross Merchandise Volume (GMV) processed through the platform.
    *   Reduction in reported double bookings by owners.
    *   System uptime percentage.

### **9. Future Scope & Potential Enhancements**

*   **Geographical Expansion:** Scale the platform to other tourist hotspots in the Philippines (e.g., Palawan, Boracay).
*   **Multi-Language Support:** Add support for languages other than English to cater to international tourists.
*   **Insurance Integration:** Partner with insurance providers to offer rental insurance directly through the platform.
*   **Advanced Analytics:** Provide owners with more detailed reports on demand forecasting, pricing optimization, and vehicle performance.
*   **Native Mobile Applications:** Develop fully native iOS and Android applications for an enhanced mobile experience, moving beyond the initial WebView approach.