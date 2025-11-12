# 🚀 Prisma Commands Cheat Sheet

## 📦 Migrations (Laravel: `php artisan migrate`)

```bash
# Run pending migrations
npm run migrate

# Check migration status  
npm run migrate:status

# Reset database + run all migrations (⚠️ DEV ONLY - deletes data!)
npm run migrate:fresh

# Deploy migrations to production
npm run migrate:deploy

# Create a new migration
npm run migrate -- --name add_vehicle_rating
```

---

## 🌱 Database Operations (Laravel: `php artisan db:*`)

```bash
# Seed database with test data
npm run db:seed

# Push schema changes without creating migration
npm run db:push

# Pull schema from database to Prisma
npm run db:pull

# Open Prisma Studio (visual database editor)
npm run db:studio

# Generate Prisma Client after schema changes
npm run db:generate

# Reset database (fresh + migrate + seed)
npm run db:reset
```

---

## 🎨 Prisma Studio

```bash
npm run db:studio
# Opens at: http://localhost:5555
```

**Features:**
- ✅ Browse all tables
- ✅ Edit records visually  
- ✅ Filter and sort
- ✅ View relationships

---

## 💻 Code Examples

### Import Prisma Client

```typescript
import prisma from '@/lib/prisma'
```

### Find All

```typescript
const vehicles = await prisma.vehicle.findMany()
```

### Find with Filter

```typescript
const vehicles = await prisma.vehicle.findMany({
  where: {
    status: 'available',
    type: 'scooter',
  },
})
```

### Find One

```typescript
const vehicle = await prisma.vehicle.findUnique({
  where: { id: vehicleId },
})
```

### Create

```typescript
const vehicle = await prisma.vehicle.create({
  data: {
    ownerId: userId,
    type: 'scooter',
    plateNumber: 'ABC-1234',
    pricePerDay: 500,
  },
})
```

### Update

```typescript
const vehicle = await prisma.vehicle.update({
  where: { id: vehicleId },
  data: { status: 'rented' },
})
```

### Delete

```typescript
await prisma.vehicle.delete({
  where: { id: vehicleId },
})
```

### Include Relations

```typescript
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    vehicle: true,
    renter: true,
    owner: true,
    payments: true,
  },
})
```

### Transactions

```typescript
await prisma.$transaction([
  prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: 'rented' },
  }),
  prisma.booking.create({
    data: { /* ... */ },
  }),
])
```

---

## 🔍 Common Queries

### Search Vehicles

```typescript
const vehicles = await prisma.vehicle.findMany({
  where: {
    OR: [
      { make: { contains: searchTerm } },
      { model: { contains: searchTerm } },
    ],
    status: 'available',
    pricePerDay: { lte: maxPrice },
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
```

### Get User Bookings

```typescript
const bookings = await prisma.booking.findMany({
  where: { renterId: userId },
  include: {
    vehicle: true,
    payments: true,
  },
  orderBy: {
    startDate: 'desc',
  },
})
```

### Calculate Stats

```typescript
const stats = await prisma.vehicle.aggregate({
  where: { ownerId: userId },
  _count: true,
  _avg: { pricePerDay: true },
})
```

---

## 🛡️ Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.vehicle.create({ data: {...} })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Plate number already exists')
    }
  }
  throw error
}
```

---

## 📝 Schema Modifications

### Edit Schema

```prisma
// prisma/schema.prisma
model Vehicle {
  // Add new field
  averageRating  Float?  @map("average_rating")
}
```

### Create Migration

```bash
npm run migrate -- --name add_average_rating
```

### Apply Migration

```bash
npm run migrate
```

---

## 🔄 Workflow

```
1. Edit prisma/schema.prisma
   ↓
2. npm run migrate -- --name description
   ↓
3. npm run db:generate
   ↓
4. Use in code!
```

---

## 🚨 Quick Fixes

### Schema out of sync

```bash
npm run db:pull
npm run db:generate
```

### Client not updating

```bash
npm run db:generate
```

### Migration failed

```bash
npm run migrate:fresh  # ⚠️ Deletes data!
npm run migrate
npm run db:seed
```

---

## 📊 Available Models

- `user`
- `vehicle`
- `booking`
- `payment`
- `review`
- `message`
- `maintenanceLog`
- `notification`
- `blockedDate`
- `favorite`
- `dispute`

---

## 🎯 Pro Tips

1. **Always use the singleton:** `import prisma from '@/lib/prisma'`
2. **Use transactions** for related operations
3. **Select only needed fields** with `select: {}`
4. **Use `include`** instead of manual joins
5. **Run `db:generate`** after schema changes
6. **Use Prisma Studio** for quick data inspection

---

## 📚 More Help

- Full Guide: `docs/guides/PRISMA_GUIDE.md`
- Prisma Docs: https://www.prisma.io/docs
- Setup: `PRISMA_SETUP_COMPLETE.md`
