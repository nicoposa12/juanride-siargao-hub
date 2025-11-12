# Prisma Setup Guide for JuanRide

## 🎯 Overview

JuanRide now uses **Prisma** as the primary ORM (Object-Relational Mapping) for database operations. Prisma provides:

- ✅ Type-safe database access
- ✅ Auto-generated TypeScript types
- ✅ Laravel-style migrations
- ✅ Intuitive query API
- ✅ Built-in connection pooling
- ✅ Database introspection

---

## 📋 Prerequisites

1. Get your **database password** from Supabase:
   - Go to: https://app.supabase.com/project/xoushfbwvicjwnippuic/settings/database
   - Find "Connection String" section
   - Copy your database password

2. Update `.env.local` with the correct password:
   ```bash
   # Replace [YOUR-PASSWORD] with your actual password
   DATABASE_URL="postgresql://postgres.xoushfbwvicjwnippuic:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.xoushfbwvicjwnippuic:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   ```

---

## 🚀 Laravel-Style Commands

### Migration Commands

```bash
# Run pending migrations (like: php artisan migrate)
npm run migrate

# Check migration status (like: php artisan migrate:status)
npm run migrate:status

# Reset database and run all migrations (like: php artisan migrate:fresh)
npm run migrate:fresh

# Deploy migrations to production (like: php artisan migrate --force)
npm run migrate:deploy

# Rollback last migration
npm run migrate:rollback
```

### Database Commands

```bash
# Seed the database (like: php artisan db:seed)
npm run db:seed

# Push schema changes without migrations (like: php artisan db:push)
npm run db:push

# Pull database schema to Prisma schema
npm run db:pull

# Open Prisma Studio (visual database editor)
npm run db:studio

# Generate Prisma Client after schema changes
npm run db:generate

# Reset database (fresh + seed)
npm run db:reset
```

### Other Commands

```bash
# Format Prisma schema file
npm run prisma:format
```

---

## 📁 Project Structure

```
juanride-siargao-hub/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Seeder file
│   └── migrations/            # Migration history (auto-generated)
│       └── YYYYMMDDHHMMSS_migration_name/
│           └── migration.sql
├── src/
│   └── lib/
│       └── prisma.ts          # Prisma Client singleton
└── .env.local                 # Database connection strings
```

---

## 🛠️ Initial Setup Workflow

### 1. **Pull Existing Schema from Supabase**

If your tables already exist in Supabase:

```bash
npm run db:pull
```

This will introspect your database and update `prisma/schema.prisma`.

### 2. **Generate Prisma Client**

```bash
npm run db:generate
```

This creates the TypeScript client based on your schema.

### 3. **Create Initial Migration**

```bash
npm run migrate -- --name init
```

This creates a migration file from your current schema.

### 4. **Seed Test Data**

```bash
npm run db:seed
```

This runs `prisma/seed.ts` to populate test data.

---

## 💻 Usage Examples

### Basic CRUD Operations

```typescript
import prisma from '@/lib/prisma'

// ✅ Create a vehicle
const vehicle = await prisma.vehicle.create({
  data: {
    ownerId: userId,
    type: 'scooter',
    make: 'Honda',
    model: 'Click 150i',
    year: 2023,
    plateNumber: 'ABC-1234',
    pricePerDay: 500,
    status: 'available',
  },
})

// ✅ Find all available vehicles
const vehicles = await prisma.vehicle.findMany({
  where: {
    status: 'available',
    isApproved: true,
  },
  include: {
    owner: {
      select: {
        fullName: true,
        profileImageUrl: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
})

// ✅ Update a vehicle
const updated = await prisma.vehicle.update({
  where: { id: vehicleId },
  data: {
    status: 'rented',
    updatedAt: new Date(),
  },
})

// ✅ Delete a vehicle
await prisma.vehicle.delete({
  where: { id: vehicleId },
})
```

### Advanced Queries

```typescript
// ✅ Search vehicles with filters
const vehicles = await prisma.vehicle.findMany({
  where: {
    type: { in: ['scooter', 'motorcycle'] },
    pricePerDay: { lte: 1000 },
    status: 'available',
    location: { contains: 'Siargao' },
  },
  include: {
    owner: true,
    reviews: {
      select: {
        rating: true,
      },
    },
  },
})

// ✅ Create booking with payment
const booking = await prisma.booking.create({
  data: {
    renterId: userId,
    vehicleId: vehicleId,
    ownerId: ownerId,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-20'),
    totalPrice: 2500,
    status: 'pending',
    payments: {
      create: {
        amount: 2500,
        paymentMethod: 'gcash',
        status: 'pending',
      },
    },
  },
  include: {
    payments: true,
  },
})

// ✅ Aggregate data
const stats = await prisma.vehicle.aggregate({
  where: { ownerId: userId },
  _count: true,
  _avg: { pricePerDay: true },
  _sum: { pricePerDay: true },
})
```

### Transactions

```typescript
// ✅ Multiple operations in one transaction
const result = await prisma.$transaction(async (tx) => {
  // Update vehicle status
  await tx.vehicle.update({
    where: { id: vehicleId },
    data: { status: 'rented' },
  })

  // Create booking
  const booking = await tx.booking.create({
    data: {
      renterId: userId,
      vehicleId: vehicleId,
      ownerId: ownerId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      status: 'confirmed',
    },
  })

  // Create notification
  await tx.notification.create({
    data: {
      userId: ownerId,
      type: 'booking',
      title: 'New Booking',
      message: 'You have a new booking request',
      link: `/owner/bookings/${booking.id}`,
    },
  })

  return booking
})
```

---

## 🔄 Migration Workflow

### Creating a New Migration

1. **Modify `prisma/schema.prisma`** - Add/edit models
2. **Run migration command:**
   ```bash
   npm run migrate -- --name add_vehicle_rating
   ```
3. **Prisma generates:**
   - Migration SQL file in `prisma/migrations/`
   - Updates Prisma Client types automatically

### Example: Adding a New Column

```prisma
// In prisma/schema.prisma
model Vehicle {
  // ... existing fields
  averageRating  Float?  @map("average_rating")  // Add this
}
```

```bash
npm run migrate -- --name add_average_rating
```

Prisma automatically generates:
```sql
-- Migration SQL
ALTER TABLE "vehicles" ADD COLUMN "average_rating" DOUBLE PRECISION;
```

---

## 🎨 Prisma Studio

Visual database editor (like phpMyAdmin for Prisma):

```bash
npm run db:studio
```

Opens at `http://localhost:5555`

Features:
- ✅ Browse all tables
- ✅ Edit records visually
- ✅ Run queries
- ✅ View relationships

---

## 🔐 Best Practices

### 1. Always Use the Singleton Instance

```typescript
// ✅ CORRECT
import prisma from '@/lib/prisma'

// ❌ WRONG - Creates new instances
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### 2. Handle Errors Properly

```typescript
try {
  const vehicle = await prisma.vehicle.create({ data: {...} })
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new Error('Plate number already exists')
  }
  throw error
}
```

### 3. Use Transactions for Related Operations

```typescript
// ✅ Ensures all-or-nothing
await prisma.$transaction([
  prisma.vehicle.update({ ... }),
  prisma.booking.create({ ... }),
  prisma.notification.create({ ... }),
])
```

### 4. Optimize Queries with Select

```typescript
// ❌ Fetches all fields
const users = await prisma.user.findMany()

// ✅ Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true,
  },
})
```

---

## 🆚 Prisma vs. Supabase Client

| Feature | Prisma | Supabase Client |
|---------|--------|-----------------|
| **Type Safety** | ✅ Full TypeScript types | ⚠️ Manual typing |
| **Migrations** | ✅ Built-in | ⚠️ Manual SQL |
| **Query Builder** | ✅ Intuitive API | ⚠️ PostgreSQL syntax |
| **Relations** | ✅ Auto-handled | ⚠️ Manual joins |
| **Real-time** | ❌ Not supported | ✅ Built-in |
| **Auth** | ❌ Not supported | ✅ Built-in |
| **Storage** | ❌ Not supported | ✅ Built-in |

**Recommendation:** Use **Prisma for database operations** and **Supabase for Auth/Storage/Realtime**.

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:** Add to `.env.local`:
```bash
DATABASE_URL="postgresql://postgres.xoushfbwvicjwnippuic:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xoushfbwvicjwnippuic:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Error: "Can't reach database server"

**Solution:** Check your database password is correct in `.env.local`

### Error: "Migration failed"

**Solution:** Run `npm run migrate:fresh` to reset and try again (⚠️ deletes all data!)

### Prisma Client not updating after schema changes

**Solution:** Run `npm run db:generate` to regenerate the client

---

## 📚 Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Prisma with Supabase:** https://supabase.com/docs/guides/integrations/prisma
- **Prisma Best Practices:** https://www.prisma.io/docs/guides/performance-and-optimization

---

## 🎓 Quick Reference

```bash
# Development workflow
npm run migrate              # Run migrations
npm run db:generate         # Update Prisma Client
npm run db:seed             # Seed test data
npm run db:studio           # Open visual editor

# Production workflow
npm run migrate:deploy      # Deploy to production
npm run db:generate         # Generate client

# Troubleshooting
npm run db:pull             # Sync schema from database
npm run migrate:fresh       # Reset database (dev only)
```

---

**Happy coding with Prisma! 🚀**
