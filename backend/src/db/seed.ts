import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Clean existing data ──────────────────────────────────────────────────
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoHash = await bcrypt.hash('demo', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-1',
        name: 'Demo User',
        email: 'demo@transitops.com',
        passwordHash: demoHash,
        role: 'DISPATCHER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-2',
        name: 'Fleet Manager',
        email: 'manager@transitops.com',
        passwordHash,
        role: 'FLEET_MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-3',
        name: 'Dispatcher One',
        email: 'dispatch@transitops.com',
        passwordHash,
        role: 'DISPATCHER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-4',
        name: 'Safety Officer',
        email: 'safety@transitops.com',
        passwordHash,
        role: 'SAFETY_OFFICER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-5',
        name: 'Financial Analyst',
        email: 'finance@transitops.com',
        passwordHash,
        role: 'FINANCIAL_ANALYST',
      },
    }),
  ]);
  console.log(`  ✅ ${users.length} users created`);

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        id: 'v1', regNo: 'TRN-001', name: 'Volvo FH16', type: 'Heavy Truck',
        capacity: 20000, odometer: 145230, acquisitionCost: 120000,
        region: 'Gujarat', status: 'AVAILABLE',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v2', regNo: 'TRN-002', name: 'Mercedes Actros', type: 'Heavy Truck',
        capacity: 18000, odometer: 98450, acquisitionCost: 115000,
        region: 'Gujarat', status: 'ON_TRIP',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v3', regNo: 'TRN-003', name: 'Isuzu NPR', type: 'Medium Truck',
        capacity: 5000, odometer: 67800, acquisitionCost: 55000,
        region: 'Ahmedabad', status: 'IN_SHOP',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v4', regNo: 'TRN-004', name: 'Toyota Hilux', type: 'Light Van',
        capacity: 1200, odometer: 34560, acquisitionCost: 38000,
        region: 'Ahmedabad', status: 'AVAILABLE',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v5', regNo: 'TRN-005', name: 'Ford Transit', type: 'Light Van',
        capacity: 1500, odometer: 52100, acquisitionCost: 42000,
        region: 'Gujarat', status: 'AVAILABLE',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v6', regNo: 'TRN-006', name: 'MAN TGX', type: 'Heavy Truck',
        capacity: 22000, odometer: 201340, acquisitionCost: 130000,
        region: null, status: 'RETIRED',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v7', regNo: 'TRN-007', name: 'Scania R450', type: 'Heavy Truck',
        capacity: 21000, odometer: 176500, acquisitionCost: 125000,
        region: 'Ahmedabad', status: 'ON_TRIP',
      },
    }),
    prisma.vehicle.create({
      data: {
        id: 'v8', regNo: 'TRN-008', name: 'DAF XF', type: 'Medium Truck',
        capacity: 8000, odometer: 89200, acquisitionCost: 75000,
        region: 'Gujarat', status: 'AVAILABLE',
      },
    }),
  ]);
  console.log(`  ✅ ${vehicles.length} vehicles created`);

  // ── Drivers ───────────────────────────────────────────────────────────────
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        id: 'd1', name: 'Marcus Reed', licenseNo: 'DL-20190423', category: 'Class A',
        expiry: new Date('2025-03-15'), contact: '+1-555-0101',
        tripCompletion: 94, safetyScore: 92, status: 'AVAILABLE',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd2', name: 'Elena Vasquez', licenseNo: 'DL-20180876', category: 'Class B',
        expiry: new Date('2027-08-22'), contact: '+1-555-0102',
        tripCompletion: 87, safetyScore: 78, status: 'ON_TRIP',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd3', name: 'James Okafor', licenseNo: 'DL-20211234', category: 'Class A',
        expiry: new Date('2024-11-30'), contact: '+1-555-0103',
        tripCompletion: 91, safetyScore: 85, status: 'AVAILABLE',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd4', name: 'Priya Nair', licenseNo: 'DL-20160543', category: 'Class C',
        expiry: new Date('2023-06-10'), contact: '+1-555-0104',
        tripCompletion: 76, safetyScore: 65, status: 'SUSPENDED',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd5', name: 'Tom Lindberg', licenseNo: 'DL-20220987', category: 'Class B',
        expiry: new Date('2028-01-18'), contact: '+1-555-0105',
        tripCompletion: 98, safetyScore: 97, status: 'OFF_DUTY',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd6', name: 'Sarah Kim', licenseNo: 'DL-20190321', category: 'Class A',
        expiry: new Date('2026-09-05'), contact: '+1-555-0106',
        tripCompletion: 89, safetyScore: 88, status: 'AVAILABLE',
      },
    }),
    prisma.driver.create({
      data: {
        id: 'd7', name: 'Carlos Mendes', licenseNo: 'DL-20150789', category: 'Class A',
        expiry: new Date('2025-12-20'), contact: '+1-555-0107',
        tripCompletion: 82, safetyScore: 80, status: 'ON_TRIP',
      },
    }),
  ]);
  console.log(`  ✅ ${drivers.length} drivers created`);

  // ── Trips ─────────────────────────────────────────────────────────────────
  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        id: 'TR-2401', source: 'Chicago Depot', destination: 'Detroit Hub',
        cargoWeightKg: 12000, plannedDistanceKm: 450,
        vehicleId: 'v2', driverId: 'd2', status: 'DISPATCHED',
        dispatchedAt: new Date('2024-01-15T08:00:00Z'),
      },
    }),
    prisma.trip.create({
      data: {
        id: 'TR-2402', source: 'LA Warehouse', destination: 'Phoenix DC',
        cargoWeightKg: 18500, plannedDistanceKm: 600,
        vehicleId: 'v7', driverId: 'd7', status: 'DISPATCHED',
        dispatchedAt: new Date('2024-01-15T09:00:00Z'),
      },
    }),
    prisma.trip.create({
      data: {
        id: 'TR-2403', source: 'Chicago Depot', destination: 'Milwaukee',
        cargoWeightKg: 5000, plannedDistanceKm: 150, actualDistanceKm: 155,
        vehicleId: 'v1', driverId: 'd1', status: 'COMPLETED',
        dispatchedAt: new Date('2024-01-14T07:00:00Z'),
        completedAt: new Date('2024-01-14T11:00:00Z'),
        revenue: 2500,
      },
    }),
    prisma.trip.create({
      data: {
        id: 'TR-2404', source: 'Detroit Hub', destination: 'Cleveland',
        cargoWeightKg: 800, plannedDistanceKm: 170,
        status: 'DRAFT',
      },
    }),
    prisma.trip.create({
      data: {
        id: 'TR-2405', source: 'Phoenix DC', destination: 'Tucson',
        cargoWeightKg: 1200, plannedDistanceKm: 180, actualDistanceKm: 175,
        vehicleId: 'v5', driverId: 'd6', status: 'COMPLETED',
        dispatchedAt: new Date('2024-01-14T06:00:00Z'),
        completedAt: new Date('2024-01-14T13:00:00Z'),
        revenue: 1800,
      },
    }),
    prisma.trip.create({
      data: {
        id: 'TR-2406', source: 'Denver', destination: 'Salt Lake City',
        cargoWeightKg: 3000, plannedDistanceKm: 540,
        vehicleId: 'v8', status: 'CANCELLED',
        cancelledAt: new Date('2024-01-13T16:00:00Z'),
      },
    }),
  ]);
  console.log(`  ✅ ${trips.length} trips created`);

  // ── Maintenance Records ───────────────────────────────────────────────────
  const maintenance = await Promise.all([
    prisma.maintenanceRecord.create({
      data: {
        id: 'm1', vehicleId: 'v3', serviceType: 'Engine Overhaul',
        cost: 8500, date: new Date('2024-01-10'), status: 'ACTIVE',
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        id: 'm2', vehicleId: 'v1', serviceType: 'Tire Replacement',
        cost: 1200, date: new Date('2024-01-08'), status: 'COMPLETED',
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        id: 'm3', vehicleId: 'v2', serviceType: 'Oil Change',
        cost: 450, date: new Date('2024-01-05'), status: 'COMPLETED',
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        id: 'm4', vehicleId: 'v7', serviceType: 'Brake Service',
        cost: 2300, date: new Date('2024-01-12'), status: 'COMPLETED',
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        id: 'm5', vehicleId: 'v8', serviceType: 'Transmission Repair',
        cost: 5600, date: new Date('2024-01-14'), status: 'COMPLETED',
      },
    }),
  ]);
  console.log(`  ✅ ${maintenance.length} maintenance records created`);

  // ── Fuel Logs ─────────────────────────────────────────────────────────────
  const fuelLogs = await Promise.all([
    prisma.fuelLog.create({
      data: {
        id: 'f1', vehicleId: 'v1', liters: 180, cost: 324,
        date: new Date('2024-01-15'),
      },
    }),
    prisma.fuelLog.create({
      data: {
        id: 'f2', vehicleId: 'v2', liters: 220, cost: 396,
        date: new Date('2024-01-14'),
      },
    }),
    prisma.fuelLog.create({
      data: {
        id: 'f3', vehicleId: 'v4', liters: 60, cost: 108,
        date: new Date('2024-01-15'),
      },
    }),
    prisma.fuelLog.create({
      data: {
        id: 'f4', vehicleId: 'v5', liters: 75, cost: 135,
        date: new Date('2024-01-13'),
      },
    }),
    prisma.fuelLog.create({
      data: {
        id: 'f5', vehicleId: 'v7', liters: 250, cost: 450,
        date: new Date('2024-01-15'),
      },
    }),
    prisma.fuelLog.create({
      data: {
        id: 'f6', vehicleId: 'v8', liters: 140, cost: 252,
        date: new Date('2024-01-12'),
      },
    }),
  ]);
  console.log(`  ✅ ${fuelLogs.length} fuel logs created`);

  // ── Expenses ──────────────────────────────────────────────────────────────
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        id: 'e1', tripId: 'TR-2401', vehicleId: 'v2', toll: 45, other: 80, total: 125,
      },
    }),
    prisma.expense.create({
      data: {
        id: 'e2', tripId: 'TR-2402', vehicleId: 'v7', toll: 120, other: 200, total: 320, maintLinked: true,
      },
    }),
    prisma.expense.create({
      data: {
        id: 'e3', tripId: 'TR-2403', vehicleId: 'v1', toll: 30, other: 50, total: 80,
      },
    }),
    prisma.expense.create({
      data: {
        id: 'e4', tripId: 'TR-2405', vehicleId: 'v5', toll: 15, other: 25, total: 40,
      },
    }),
  ]);
  console.log(`  ✅ ${expenses.length} expenses created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   demo@transitops.com / demo         → Dispatcher');
  console.log('   manager@transitops.com / password123 → Fleet Manager');
  console.log('   dispatch@transitops.com / password123 → Dispatcher');
  console.log('   safety@transitops.com / password123  → Safety Officer');
  console.log('   finance@transitops.com / password123 → Financial Analyst');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
