/**
 * Prisma Seed File
 * 
 * Laravel-style database seeding for JuanRide
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...');
  await prisma.dispute.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create test users
  console.log('👤 Creating test users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: 'admin@juanride.com',
        fullName: 'Admin User',
        phoneNumber: '+639171234567',
        role: 'admin',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: 'owner1@juanride.com',
        fullName: 'Juan Dela Cruz',
        phoneNumber: '+639171234568',
        role: 'owner',
        isVerified: true,
        isActive: true,
        address: 'General Luna, Siargao Island',
      },
    }),
    prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: 'owner2@juanride.com',
        fullName: 'Maria Santos',
        phoneNumber: '+639171234569',
        role: 'owner',
        isVerified: true,
        isActive: true,
        address: 'Cloud 9, Siargao Island',
      },
    }),
    prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: 'renter1@juanride.com',
        fullName: 'John Smith',
        phoneNumber: '+639171234570',
        role: 'renter',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: 'renter2@juanride.com',
        fullName: 'Sarah Johnson',
        phoneNumber: '+639171234571',
        role: 'renter',
        isVerified: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} test users\n`);

  const [admin, owner1, owner2, renter1, renter2] = users;

  // Create test vehicles
  console.log('🏍️  Creating test vehicles...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        ownerId: owner1.id,
        type: 'scooter',
        make: 'Honda',
        model: 'Click 150i',
        year: 2023,
        plateNumber: 'ABC-1234',
        description: 'Perfect scooter for island hopping and beach trips',
        pricePerDay: 500,
        pricePerWeek: 3000,
        pricePerMonth: 10000,
        status: 'available',
        location: 'General Luna',
        transmission: 'automatic',
        fuelType: 'gasoline',
        isApproved: true,
        features: {
          helmet: true,
          raincoat: true,
          delivery: true,
        },
      },
    }),
    prisma.vehicle.create({
      data: {
        ownerId: owner1.id,
        type: 'motorcycle',
        make: 'Yamaha',
        model: 'NMAX 155',
        year: 2024,
        plateNumber: 'XYZ-5678',
        description: 'Comfortable motorcycle with under-seat storage',
        pricePerDay: 700,
        pricePerWeek: 4200,
        pricePerMonth: 14000,
        status: 'available',
        location: 'General Luna',
        transmission: 'automatic',
        fuelType: 'gasoline',
        isApproved: true,
        features: {
          helmet: true,
          usbCharger: true,
          delivery: true,
        },
      },
    }),
    prisma.vehicle.create({
      data: {
        ownerId: owner2.id,
        type: 'car',
        make: 'Toyota',
        model: 'Wigo',
        year: 2022,
        plateNumber: 'DEF-9012',
        description: 'Compact car perfect for families or groups',
        pricePerDay: 2500,
        pricePerWeek: 15000,
        pricePerMonth: 50000,
        status: 'available',
        location: 'Cloud 9',
        transmission: 'manual',
        fuelType: 'gasoline',
        isApproved: true,
        features: {
          aircon: true,
          gps: false,
          bluetooth: true,
        },
      },
    }),
    prisma.vehicle.create({
      data: {
        ownerId: owner2.id,
        type: 'van',
        make: 'Toyota',
        model: 'Hiace',
        year: 2021,
        plateNumber: 'GHI-3456',
        description: 'Spacious van for large groups and surfboards',
        pricePerDay: 4000,
        pricePerWeek: 24000,
        pricePerMonth: 80000,
        status: 'available',
        location: 'Cloud 9',
        transmission: 'manual',
        fuelType: 'diesel',
        isApproved: true,
        features: {
          aircon: true,
          seats: 12,
          surfboardRack: true,
        },
      },
    }),
  ]);
  console.log(`✅ Created ${vehicles.length} test vehicles\n`);

  // Create test bookings
  console.log('📅 Creating test bookings...');
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        renterId: renter1.id,
        vehicleId: vehicles[0].id,
        ownerId: owner1.id,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
        totalPrice: 2500,
        status: 'confirmed',
        pickupLocation: 'General Luna Beach',
      },
    }),
    prisma.booking.create({
      data: {
        renterId: renter2.id,
        vehicleId: vehicles[1].id,
        ownerId: owner1.id,
        startDate: new Date('2025-01-18'),
        endDate: new Date('2025-01-25'),
        totalPrice: 4900,
        status: 'pending',
        pickupLocation: 'Cloud 9 Parking',
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} test bookings\n`);

  // Create test payments
  console.log('💳 Creating test payments...');
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        bookingId: bookings[0].id,
        amount: 2500,
        paymentMethod: 'gcash',
        status: 'paid',
        transactionId: 'GCASH-' + faker.string.alphanumeric(12).toUpperCase(),
        platformFee: 125,
        ownerPayout: 2375,
        paidAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${payments.length} test payments\n`);

  // Create test notifications
  console.log('🔔 Creating test notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: renter1.id,
        type: 'booking',
        title: 'Booking Confirmed',
        message: 'Your booking for Honda Click 150i has been confirmed!',
        link: '/bookings/' + bookings[0].id,
      },
      {
        userId: owner1.id,
        type: 'booking',
        title: 'New Booking Request',
        message: 'You have a new booking request for Yamaha NMAX 155',
        link: '/owner/bookings/' + bookings[1].id,
      },
    ],
  });
  console.log('✅ Created test notifications\n');

  console.log('✨ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Vehicles: ${vehicles.length}`);
  console.log(`   Bookings: ${bookings.length}`);
  console.log(`   Payments: ${payments.length}`);
  console.log(`   Notifications: 2\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
