# JuanRide Capstone Documentation Update Guide

## Overview
This document provides a detailed before/after comparison of all changes made to align the capstone documentation with the actual implemented system, particularly focusing on the Supabase/PostgreSQL architecture and GCash payment integration via PayMongo.

---

## Change 1: Database Management System (Technical Background Section)

### Location: Chapter 3 - Methodology, Technical Background Section

### BEFORE:
```
• Database Management System: JuanRide uses MongoDB as the primary database
system, combined with Prisma to manage data more efficiently. MongoDB is a
document-based NoSQL database that works well with a wide variety of data types
such as vehicle details, user profiles, rental records, and payment history. It is flexible
and scalable, which fits the needs of the platform as it grows.

Prisma is an ORM (Object-Relational Mapping) tool that connects the database to the
web and mobile applications. It helps developers manage and access data more easily
by making database queries safer and more readable. This setup supports faster
development and improves data handling for both users and system administrators.
```

### AFTER:
```
• Database Management System: JuanRide uses Supabase, a backend-as-a-service 
platform built on PostgreSQL, as the primary database and backend infrastructure. 
Supabase provides a robust relational database system that efficiently manages 
structured data including vehicle details, user profiles, rental bookings, payment 
transactions, real-time messaging, and system logs.

PostgreSQL, the underlying database engine, is a powerful open-source relational 
database known for its reliability, data integrity, and support for complex queries. 
It enables the platform to maintain relationships between entities such as users, 
vehicles, bookings, and payments through foreign keys and joins, ensuring data 
consistency and accuracy.

Supabase extends PostgreSQL with built-in features including:
  - Real-time subscriptions for live updates (used in chat messaging)
  - Row-Level Security (RLS) policies for fine-grained access control
  - Built-in authentication system with JWT tokens
  - RESTful API and client SDK for seamless integration
  - Cloud storage for vehicle images and documents

This architecture provides enterprise-grade security, automatic scaling, and real-time 
capabilities that are essential for JuanRide's booking system, chat features, and 
instant availability updates.
```

---

## Change 2: Payment Processing System (NEW SECTION - Add After Styling and Design)

### Location: Chapter 3 - Methodology, Technical Background Section (After Styling and Design bullet)

### BEFORE:
```
[Nothing - this is a NEW section to add]
```

### AFTER:
```
• Payment Processing System: JuanRide integrates PayMongo, a Philippine-based 
payment gateway, to handle all financial transactions securely and efficiently. PayMongo 
enables the platform to accept multiple payment methods that are widely used in the 
Philippines, particularly catering to the local market in Siargao.

The payment system supports the following methods:
  - GCash: The most popular mobile wallet in the Philippines, allowing instant 
    payments through QR codes or mobile numbers. This addresses the preference 
    for cashless transactions mentioned in stakeholder interviews.
  - Maya (formerly PayMaya): Another widely-used e-wallet platform providing 
    similar digital payment capabilities.
  - Credit/Debit Cards: Visa, Mastercard, and other major card networks for 
    international tourists and users who prefer traditional payment methods.
  - Bank Transfers: Direct bank transfer options for customers who prefer this method.

Payment Flow Implementation:
1. Payment Intent Creation: When a renter proceeds to checkout, the system creates 
   a PayMongo payment intent with booking details and total amount.
2. Secure Payment Processing: Renters are redirected to PayMongo's secure payment 
   page where they select their preferred payment method (GCash, Maya, or card).
3. Real-time Verification: The system receives instant webhooks from PayMongo 
   confirming successful or failed transactions.
4. Automatic Fee Calculation: Database triggers automatically calculate the 10% 
   platform service fee and 90% owner payout upon successful payment.
5. Booking Confirmation: Once payment is verified, the booking status updates to 
   "confirmed" and both renter and owner receive email notifications.
6. Transaction Records: All payment details, including transaction IDs, timestamps, 
   and amounts, are securely stored in the database for audit trails.

This integration addresses the pain points mentioned by vehicle owners in interviews, 
particularly the GCash cash-out fees and partial payment issues. The system ensures 
full payment before booking confirmation, eliminating the "pay half now, half later" 
problem that causes delays and follow-ups. The automated fee splitting also provides 
transparency for both platform operators and vehicle owners regarding revenue sharing.
```

---

## Change 3: SDLC Design Phase

### Location: Chapter 3 - Design of Software, System, Product, and/or Processes, Section 2 (Design)

### BEFORE:
```
2. Design
Develop system architecture, including user interface wireframes for web/mobile,
MongoDB database schema for vehicle/user data, and process flows for
booking/payment. Plan responsive layouts using Next.js and Tailwind CSS. Ensure
scalability and security (encrypted data, user authentication) to meet Siargao's
tourism-driven needs.
```

### AFTER:
```
2. Design
Develop system architecture, including user interface wireframes for web/mobile,
PostgreSQL database schema via Supabase for vehicle/user data, and process flows for
booking/payment. Plan responsive layouts using Next.js and Tailwind CSS. Design
Row-Level Security (RLS) policies for data protection and define database triggers for
automated business logic. Ensure scalability and security (encrypted data, JWT-based
authentication) to meet Siargao's tourism-driven needs.
```

---

## Change 4: SDLC Implementation Phase

### Location: Chapter 3 - Design of Software, System, Product, and/or Processes, Section 3 (Implementation)

### BEFORE:
```
3. Implementation
Code the platform using Next.js for the web frontend, Node.js for backend logic, and
Android Studio for a mobile web view. Integrate MongoDB with Prisma for data
management. Build features like vehicle listings, booking forms, GPS tracking, and
payment modules. Develop APIs for seamless system integration.
```

### AFTER:
```
3. Implementation
Code the platform using Next.js for the web frontend with server-side rendering,
Supabase for backend services including authentication, database, and real-time features,
and Android Studio for a mobile web view. Implement database migrations with SQL
for schema definition and triggers. Build features like vehicle listings with approval
workflow, booking forms with conflict detection, real-time chat messaging, GPS tracking,
and PayMongo payment integration. Develop middleware for route protection and role-
based access control.
```

---

## Change 5: Software Requirements Table

### Location: Chapter 3 - Resources Section, Table 3

### BEFORE:
```
Table 3
Software Requirements in Developing the System
Operating System         Windows 10 / 11 (Recommended),
                        Android 6.0+ (Minimum for mobile)
Database and ORM        MongoDB (Cloud/Local), Prisma
                        (Object-Relational Mapping)
Web Development Tools   Visual Studio Code (IDE)
Mobile Development Tools Android Studio
Server and Hosting      DigitalOcean Droplet VPS (Hosting),
                        GoDaddy (Domain Management)
Web Browsers           Compatible with Chrome, Firefox,
                        Microsoft Edge
```

### AFTER:
```
Table 3
Software Requirements in Developing the System
Operating System         Windows 10 / 11 (Recommended),
                        Android 6.0+ (Minimum for mobile)
Database and Backend    Supabase (PostgreSQL-based BaaS),
                        Authentication, Real-time, Storage
Web Development Tools   Visual Studio Code (IDE), Next.js 14,
                        React, TypeScript, Tailwind CSS,
                        Shadcn/UI
Mobile Development Tools Android Studio (WebView)
Payment Integration     PayMongo API (GCash, Maya, Cards)
Email Service          Resend (Transactional emails)
Server and Hosting     Vercel/DigitalOcean (Web hosting),
                        Supabase Cloud (Database),
                        GoDaddy (Domain Management)
Web Browsers           Compatible with Chrome, Firefox,
                        Microsoft Edge, Safari
```

---

## Change 6: System Architecture & Implementation (NEW SECTION)

### Location: Chapter 4 - Results and Discussion Section (Add at the beginning, before "Testing")

### BEFORE:
```
RESULTS AND DISCUSSION
Testing
```

### AFTER:
```
RESULTS AND DISCUSSION

System Architecture & Implementation

The JuanRide platform implements a three-tier architecture with frontend (Next.js), 
backend (Supabase), and database (PostgreSQL) layers featuring sophisticated security 
and automation.

Authentication Flow: User registration creates auth.users records with JWT tokens. 
Database triggers automatically create user profiles. Middleware intercepts requests 
for role-based routing (admin→/admin/dashboard, owner→/owner/dashboard, 
renter→homepage).

Vehicle Search: VehicleGrid calls searchVehicles() querying is_approved=true vehicles. 
Date-specific searches use filterByAvailability() checking booking conflicts and 
blocked_dates arrays to prevent double-bookings.

Booking Creation: Database triggers automatically populate owner_id, validate no 
conflicts exist (raising exceptions if detected), and update vehicle status to 'rented' 
when confirmed.

Real-Time Chat: Supabase channels provide real-time messaging. Components subscribe 
to INSERT events on messages table, displaying new messages instantly without refresh.

Payment Processing: PayMongo integration supports GCash, Maya, and cards. After 
payment confirmation, triggers calculate 10% platform fee and 90% owner payout. 
Resend service sends email confirmations to both parties.

Admin Approval: Admins query is_approved=false vehicles, update approval status, 
and createNotification() informs owners their listings are live.

Security: Middleware provides session validation and role-based guards. Row-Level 
Security (RLS) policies ensure users only access authorized data. Owner routes require 
'owner' or 'admin' roles; admin routes require 'admin' only.

Testing
```

---

## Summary of Key Changes

### 1. **Database Technology**
   - **Old:** MongoDB (NoSQL) with Prisma ORM
   - **New:** Supabase (PostgreSQL relational database with BaaS features)
   - **Reason:** Reflects actual implementation with relational data structure, RLS policies, real-time features

### 2. **Payment Integration** (NEW)
   - **Added:** Complete PayMongo payment system documentation
   - **Includes:** GCash, Maya, credit/debit cards
   - **Features:** 10%/90% fee split, automated calculations, email notifications
   - **Addresses:** Stakeholder pain points from Miss Arah's interview (GCash fees, partial payments)

### 3. **Authentication & Security**
   - **Added:** JWT token authentication, database triggers, RLS policies
   - **Added:** Middleware route protection and role-based access control

### 4. **Real-Time Features**
   - **Added:** Supabase real-time subscriptions for chat messaging
   - **Added:** Live availability updates and conflict detection

### 5. **System Architecture**
   - **Added:** Comprehensive documentation of actual implementation flows
   - **Includes:** 7 core user flows with technical details

---

## Implementation Checklist

- [ ] Update Database Management System section (Chapter 3)
- [ ] Add Payment Processing System section (Chapter 3)
- [ ] Update SDLC Design phase description (Chapter 3)
- [ ] Update SDLC Implementation phase description (Chapter 3)
- [ ] Update Software Requirements table (Chapter 3, Table 3)
- [ ] Add System Architecture & Implementation section (Chapter 4)
- [ ] Review all mentions of "MongoDB" and replace with "Supabase/PostgreSQL"
- [ ] Review all mentions of "Prisma" and update context appropriately
- [ ] Verify GCash is prominently mentioned in payment sections
- [ ] Ensure 10%/90% fee split is documented

---

## Additional Notes

1. **Interview Integration:** The payment processing section directly addresses Miss Arah Dolera's concerns from the interview transcript (lines 1150-1153 in capstone.md) about GCash fees and partial payment issues.

2. **Technical Accuracy:** All technical details are based on the actual implemented system as documented in the JuanRide codebase architecture.

3. **Academic Tone:** All new content maintains the formal academic writing style consistent with the rest of the capstone document.

4. **Page Numbers:** When inserting new content, be sure to adjust page number references ("STI College Surigao X") accordingly.

---

**Document Version:** 1.0  
**Date:** November 17, 2025  
**Purpose:** Guide for updating official capstone documentation to reflect actual system implementation
