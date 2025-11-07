# JuanRide - Digital Vehicle Rental System for Siargao Island 

A modern, full-stack vehicle rental platform built with Next.js 14 and Supabase, designed specifically for the tourism ecosystem in Siargao Island, Philippines.

## 🌟 Features

### For Renters
- 🔍 **Smart Vehicle Search** - Find the perfect ride with advanced filters
- 📅 **Instant Booking** - Reserve vehicles in real-time with availability checking
- 💳 **Secure Payments** - Multiple payment options (GCash, Maya, Cards, Bank Transfer)
- ⭐ **Reviews & Ratings** - Make informed decisions based on community feedback
- 💬 **Real-time Chat** - Communicate directly with vehicle owners
- 📱 **Mobile-First Design** - Optimized for browsing on the go

### For Vehicle Owners
- 🚗 **Fleet Management** - Manage all your vehicles from one dashboard
- 📊 **Analytics & Insights** - Track revenue, utilization, and performance
- 📆 **Booking Calendar** - Visual overview of all reservations
- 🔧 **Maintenance Tracking** - Schedule and log vehicle maintenance
- 💰 **Financial Reports** - Monitor earnings and export transaction data
- 🔔 **Smart Notifications** - Stay updated on bookings and payments

### For Administrators
- 👥 **User Management** - Oversee all renters and owners
- ✅ **Listing Moderation** - Approve and manage vehicle listings
- 💵 **Transaction Oversight** - Monitor all platform transactions
- 🛡️ **Dispute Resolution** - Handle conflicts between users
- 📈 **Platform Analytics** - Comprehensive metrics and reporting

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Deployment:** Vercel
- **Real-time:** Supabase Realtime

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Payment gateway accounts (GCash, Maya) for production

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/juanride-siargao-hub.git
cd juanride-siargao-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Run the database migrations in `supabase/migrations/` directory
3. Set up Storage buckets:
   - `vehicle-images`
   - `profile-images`
   - `review-images`
4. Enable authentication providers (Email, Google, etc.)

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 6. Generate TypeScript types from Supabase

```bash
npm run supabase:gen-types
```

## 📁 Project Structure

```
juanride-siargao-hub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (renter)/          # Renter dashboard
│   │   ├── (owner)/           # Owner dashboard
│   │   ├── (admin)/           # Admin panel
│   │   ├── vehicles/          # Vehicle browsing
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── shared/           # Shared components
│   │   ├── vehicle/          # Vehicle-related components
│   │   ├── booking/          # Booking components
│   │   ├── owner/            # Owner dashboard components
│   │   └── admin/            # Admin panel components
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/        # Supabase clients and queries
│   │   └── utils/           # Helper functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── supabase/
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── docs/                    # Documentation

```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
vercel --prod
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [Product Requirements Document](docs/prd.md)
- [Feature Specifications](docs/features.md)
- [Technical Stack](docs/tech-stack.md)
- [User Flows](docs/user-flow.md)
- [Implementation Guide](docs/implementation.md)
- [Project Structure](docs/project-structure.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for the Siargao Island tourism community
- Powered by Supabase and Vercel
- UI components from Shadcn/UI

## 📧 Contact

For support or inquiries, please contact [your-email@example.com](mailto:your-email@example.com)

---

Built with ❤️ for Siargao Island
