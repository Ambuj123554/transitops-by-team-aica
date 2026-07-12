import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────

function date(year: number, month: number, day: number, hour = 0, min = 0) {
  return new Date(year, month - 1, day, hour, min);
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database with extensive data...\n');

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
        name: 'Alex Chen',
        email: 'manager@transitops.com',
        passwordHash,
        role: 'FLEET_MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-3',
        name: 'Sarah Johnson',
        email: 'dispatch@transitops.com',
        passwordHash,
        role: 'DISPATCHER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-4',
        name: 'Mike Rodriguez',
        email: 'safety@transitops.com',
        passwordHash,
        role: 'SAFETY_OFFICER',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-5',
        name: 'Lisa Patel',
        email: 'finance@transitops.com',
        passwordHash,
        role: 'FINANCIAL_ANALYST',
      },
    }),
  ]);
  console.log(`  ✅ ${users.length} users created`);

  // ── Vehicles (20) ─────────────────────────────────────────────────────────
  const vehicleData = [
    // id, regNo, name, type, capacity, odometer, acquisitionCost, region, status
    ['v1', 'TRN-001', 'Volvo FH16', 'Heavy Truck', 20000, 145230, 120000, 'Gujarat', 'AVAILABLE'],
    ['v2', 'TRN-002', 'Mercedes Actros', 'Heavy Truck', 18000, 98450, 115000, 'Gujarat', 'ON_TRIP'],
    ['v3', 'TRN-003', 'Isuzu NPR', 'Medium Truck', 5000, 67800, 55000, 'Ahmedabad', 'IN_SHOP'],
    ['v4', 'TRN-004', 'Toyota Hilux', 'Light Van', 1200, 34560, 38000, 'Ahmedabad', 'AVAILABLE'],
    ['v5', 'TRN-005', 'Ford Transit', 'Light Van', 1500, 52100, 42000, 'Gujarat', 'AVAILABLE'],
    ['v6', 'TRN-006', 'MAN TGX', 'Heavy Truck', 22000, 201340, 130000, 'Rajasthan', 'RETIRED'],
    ['v7', 'TRN-007', 'Scania R450', 'Heavy Truck', 21000, 176500, 125000, 'Ahmedabad', 'ON_TRIP'],
    ['v8', 'TRN-008', 'DAF XF', 'Medium Truck', 8000, 89200, 75000, 'Gujarat', 'AVAILABLE'],
    ['v9', 'TRN-009', 'Volvo FH13', 'Heavy Truck', 19000, 112300, 110000, 'Mumbai', 'AVAILABLE'],
    ['v10', 'TRN-010', 'Tata LPT 1618', 'Medium Truck', 7000, 75500, 48000, 'Mumbai', 'ON_TRIP'],
    ['v11', 'TRN-011', 'Ashok Leyland 4218', 'Heavy Truck', 25000, 189000, 95000, 'Delhi', 'AVAILABLE'],
    ['v12', 'TRN-012', 'Eicher Pro 3015', 'Medium Truck', 5500, 62300, 42000, 'Delhi', 'AVAILABLE'],
    ['v13', 'TRN-013', 'Mahindra Bolero', 'Light Van', 900, 28400, 22000, 'Gujarat', 'AVAILABLE'],
    ['v14', 'TRN-014', 'BharatBenz 1923', 'Heavy Truck', 16000, 87300, 88000, 'Rajasthan', 'ON_TRIP'],
    ['v15', 'TRN-015', 'Scania R500', 'Heavy Truck', 24000, 134500, 140000, 'Mumbai', 'AVAILABLE'],
    ['v16', 'TRN-016', 'Mercedes Atego', 'Medium Truck', 6500, 54300, 62000, 'Ahmedabad', 'IN_SHOP'],
    ['v17', 'TRN-017', 'Isuzu D-Max', 'Light Van', 1000, 32100, 32000, 'Delhi', 'AVAILABLE'],
    ['v18', 'TRN-018', 'MAN TGS 26.440', 'Heavy Truck', 26000, 223400, 145000, 'Gujarat', 'AVAILABLE'],
    ['v19', 'TRN-019', 'DAF LF 260', 'Medium Truck', 9000, 76100, 68000, 'Mumbai', 'AVAILABLE'],
    ['v20', 'TRN-020', 'Volvo FMX 460', 'Heavy Truck', 23000, 156700, 135000, 'Rajasthan', 'AVAILABLE'],
  ];

  const vehicles = await Promise.all(
    vehicleData.map(([id, regNo, name, type, capacity, odometer, cost, region, status]) =>
      prisma.vehicle.create({
        data: {
          id: id as string,
          regNo: regNo as string,
          name: name as string,
          type: type as string,
          capacity: capacity as number,
          odometer: odometer as number,
          acquisitionCost: cost as number,
          region: region as string,
          status: status as any,
        },
      })
    )
  );
  console.log(`  ✅ ${vehicles.length} vehicles created`);

  // ── Drivers (15) ──────────────────────────────────────────────────────────
  const driverData = [
    // id, name, licenseNo, category, expiry, contact, tripCompletion, safetyScore, status
    ['d1', 'Marcus Reed', 'DL-20190423', 'Class A', '2025-03-15', '+1-555-0101', 94, 92, 'AVAILABLE'],
    ['d2', 'Elena Vasquez', 'DL-20180876', 'Class B', '2027-08-22', '+1-555-0102', 87, 78, 'ON_TRIP'],
    ['d3', 'James Okafor', 'DL-20211234', 'Class A', '2024-11-30', '+1-555-0103', 91, 85, 'AVAILABLE'],
    ['d4', 'Priya Nair', 'DL-20160543', 'Class C', '2023-06-10', '+1-555-0104', 76, 65, 'SUSPENDED'],
    ['d5', 'Tom Lindberg', 'DL-20220987', 'Class B', '2028-01-18', '+1-555-0105', 98, 97, 'OFF_DUTY'],
    ['d6', 'Sarah Kim', 'DL-20190321', 'Class A', '2026-09-05', '+1-555-0106', 89, 88, 'AVAILABLE'],
    ['d7', 'Carlos Mendes', 'DL-20150789', 'Class A', '2025-12-20', '+1-555-0107', 82, 80, 'ON_TRIP'],
    ['d8', 'Aisha Sharma', 'DL-20200123', 'Class A', '2027-03-10', '+1-555-0108', 96, 95, 'AVAILABLE'],
    ['d9', 'Wei Zhang', 'DL-20210145', 'Class B', '2026-07-18', '+1-555-0109', 84, 82, 'AVAILABLE'],
    ['d10', 'Fatima Hassan', 'DL-20180267', 'Class A', '2026-11-25', '+1-555-0110', 92, 90, 'AVAILABLE'],
    ['d11', 'Raj Patel', 'DL-20220389', 'Class C', '2025-05-30', '+1-555-0111', 71, 68, 'SUSPENDED'],
    ['d12', 'Emily Watson', 'DL-20190567', 'Class B', '2028-01-14', '+1-555-0112', 88, 86, 'OFF_DUTY'],
    ['d13', 'Olga Petrov', 'DL-20201234', 'Class A', '2027-09-22', '+1-555-0113', 93, 91, 'AVAILABLE'],
    ['d14', 'David Kim', 'DL-20210456', 'Class A', '2026-04-05', '+1-555-0114', 79, 75, 'AVAILABLE'],
    ['d15', 'Maria Santos', 'DL-20230321', 'Class B', '2029-02-28', '+1-555-0115', 85, 83, 'AVAILABLE'],
  ];

  const drivers = await Promise.all(
    driverData.map(([id, name, licenseNo, category, expiry, contact, tripCompletion, safetyScore, status]) =>
      prisma.driver.create({
        data: {
          id: id as string,
          name: name as string,
          licenseNo: licenseNo as string,
          category: category as string,
          expiry: new Date(expiry as string),
          contact: contact as string,
          tripCompletion: tripCompletion as number,
          safetyScore: safetyScore as number,
          status: status as any,
        },
      })
    )
  );
  console.log(`  ✅ ${drivers.length} drivers created`);

  // ── Trip Route Templates ─────────────────────────────────────────────────
  const routes = [
    { source: 'Chicago Depot', destination: 'Detroit Hub', distance: 450, baseCargo: 12000 },
    { source: 'LA Warehouse', destination: 'Phoenix DC', distance: 600, baseCargo: 18000 },
    { source: 'Chicago Depot', destination: 'Milwaukee', distance: 150, baseCargo: 5000 },
    { source: 'Detroit Hub', destination: 'Cleveland', distance: 170, baseCargo: 800 },
    { source: 'Phoenix DC', destination: 'Tucson', distance: 180, baseCargo: 1200 },
    { source: 'Denver', destination: 'Salt Lake City', distance: 540, baseCargo: 3000 },
    { source: 'Mumbai Depot', destination: 'Pune Warehouse', distance: 150, baseCargo: 8000 },
    { source: 'Delhi Hub', destination: 'Jaipur DC', distance: 280, baseCargo: 10000 },
    { source: 'Ahmedabad', destination: 'Surat', distance: 210, baseCargo: 6500 },
    { source: 'Bangalore', destination: 'Chennai', distance: 350, baseCargo: 9000 },
    { source: 'Mumbai Depot', destination: 'Ahmedabad', distance: 530, baseCargo: 14000 },
    { source: 'Delhi Hub', destination: 'Chandigarh', distance: 250, baseCargo: 7000 },
    { source: 'Chennai', destination: 'Bangalore', distance: 350, baseCargo: 8500 },
    { source: 'Kolkata', destination: 'Bhubaneswar', distance: 440, baseCargo: 11000 },
    { source: 'Hyderabad', destination: 'Bangalore', distance: 570, baseCargo: 13000 },
  ];

  // ── Trips (50+ spanning Aug 2023 – Jan 2024) ──────────────────────────────
  const trips: any[] = [];
  let tripCounter = 2401;

  const availableVehicleIds = ['v1','v4','v5','v8','v9','v11','v12','v13','v15','v17','v18','v19','v20'];
  const onTripVehicleIds = ['v2','v7','v10','v14'];
  const inShopVehicleIds = ['v3','v16'];
  const retiredVehicleIds = ['v6'];

  // Generate trips across 6 months (Aug 2023 - Jan 2024)
  for (let month = 8; month <= 12; month++) {
    const tripsPerMonth = month === 8 ? 6 : month === 9 ? 7 : month === 10 ? 8 : month === 11 ? 9 : 10;
    for (let i = 0; i < tripsPerMonth; i++) {
      const route = routes[i % routes.length];
      const day = Math.min(1 + (i * 3) % 28, 28);
      const completedDay = Math.min(day + (i % 3 === 0 ? 1 : 2), 28);
      const status = i % 6 === 0 ? 'DRAFT' : i % 7 === 0 ? 'CANCELLED' : 'COMPLETED';
      const vehicleId = status === 'COMPLETED' ? pick(availableVehicleIds) : status === 'DRAFT' ? pick(['v4','v5','v13','v17']) : null;
      const driverId = status === 'COMPLETED' ? pick(['d1','d3','d6','d8','d9','d10','d13','d14','d15']) : null;
      const cargoWeight = route.baseCargo + randomBetween(-2000, 2000);
      const actualDist = route.distance + randomBetween(-20, 30);
      const revenue = status === 'COMPLETED' ? Math.round(cargoWeight * randomBetween(0.12, 0.22)) : null;

      trips.push({
        id: `TR-${tripCounter}`,
        source: route.source,
        destination: route.destination,
        cargoWeightKg: Math.max(100, Math.round(cargoWeight)),
        plannedDistanceKm: route.distance,
        actualDistanceKm: status === 'COMPLETED' ? Math.max(1, Math.round(actualDist)) : null,
        revenue,
        status,
        vehicleId: vehicleId ?? null,
        driverId: driverId ?? null,
        dispatchedAt: status !== 'DRAFT' ? date(2023, month, day, 6 + (i % 8), i * 7 % 60) : null,
        completedAt: status === 'COMPLETED' ? date(2023, month, completedDay, 12 + (i % 6), i * 11 % 60) : null,
        cancelledAt: status === 'CANCELLED' ? date(2023, month, completedDay, 8, 0) : null,
      });
      tripCounter++;
    }
  }

  // Jan 2024 trips
  for (let i = 0; i < 8; i++) {
    const route = routes[i % routes.length];
    const day = Math.min(2 + (i * 2) % 26, 26);
    const status = i < 2 ? 'DISPATCHED' : i < 4 ? 'DRAFT' : i === 4 ? 'PENDING_APPROVAL' : i === 5 ? 'PENDING_APPROVAL' : i === 6 ? 'CANCELLED' : 'COMPLETED';
    const vehicleId = status === 'DISPATCHED' ? pick(onTripVehicleIds) : status === 'PENDING_APPROVAL' ? pick(availableVehicleIds) : status === 'COMPLETED' ? pick(availableVehicleIds) : status === 'DRAFT' ? pick(['v4','v5']) : null;
    const driverId = status === 'DISPATCHED' ? pick(['d2','d7']) : status === 'PENDING_APPROVAL' ? pick(['d3','d10']) : status === 'COMPLETED' ? pick(['d1','d6','d13']) : null;
    const cargoWeight = route.baseCargo + randomBetween(-1500, 1500);
    const actualDist = route.distance + randomBetween(-15, 25);
    const revenue = status === 'COMPLETED' ? Math.round(cargoWeight * randomBetween(0.12, 0.22)) : null;

    trips.push({
      id: `TR-${tripCounter}`,
      source: route.source,
      destination: route.destination,
      cargoWeightKg: Math.max(100, Math.round(cargoWeight)),
      plannedDistanceKm: route.distance,
      actualDistanceKm: (status === 'COMPLETED' || status === 'DISPATCHED') ? Math.max(1, Math.round(actualDist)) : null,
      revenue,
      status,
      vehicleId: vehicleId ?? null,
      driverId: driverId ?? null,
      dispatchedAt: status === 'DISPATCHED' || status === 'COMPLETED' || status === 'CANCELLED' ? date(2024, 1, day, 7 + (i % 10), i * 9 % 60) : null,
      completedAt: status === 'COMPLETED' ? date(2024, 1, day + 1, 14 + (i % 5), i * 13 % 60) : null,
      cancelledAt: status === 'CANCELLED' ? date(2024, 1, day, 10, 0) : null,
    });
    tripCounter++;
  }

  const createdTrips = await Promise.all(
    trips.map(t =>
      prisma.trip.create({
        data: {
          id: t.id,
          source: t.source,
          destination: t.destination,
          cargoWeightKg: t.cargoWeightKg,
          plannedDistanceKm: t.plannedDistanceKm,
          actualDistanceKm: t.actualDistanceKm,
          revenue: t.revenue,
          status: t.status as any,
          vehicleId: t.vehicleId,
          driverId: t.driverId,
          dispatchedAt: t.dispatchedAt,
          completedAt: t.completedAt,
          cancelledAt: t.cancelledAt,
          createdAt: t.dispatchedAt ?? t.completedAt ?? t.cancelledAt ?? new Date(2023, 7, 1),
        },
      })
    )
  );
  console.log(`  ✅ ${createdTrips.length} trips created`);

  // ── Maintenance Records (25) ──────────────────────────────────────────────
  const maintenanceData = [
    ['m1', 'v3', 'Engine Overhaul', 8500, '2023-12-10', 'ACTIVE'],
    ['m2', 'v1', 'Tire Replacement', 1200, '2023-08-08', 'COMPLETED'],
    ['m3', 'v2', 'Oil Change', 450, '2023-09-05', 'COMPLETED'],
    ['m4', 'v7', 'Brake Service', 2300, '2023-10-12', 'COMPLETED'],
    ['m5', 'v8', 'Transmission Repair', 5600, '2023-11-14', 'COMPLETED'],
    ['m6', 'v4', 'Oil Change', 380, '2023-08-20', 'COMPLETED'],
    ['m7', 'v9', 'AC Repair', 1200, '2023-09-15', 'COMPLETED'],
    ['m8', 'v5', 'Brake Pad Replacement', 900, '2023-10-05', 'COMPLETED'],
    ['m9', 'v10', 'Clutch Replacement', 3200, '2023-11-20', 'COMPLETED'],
    ['m10', 'v11', 'Battery Replacement', 600, '2023-08-25', 'COMPLETED'],
    ['m11', 'v12', 'Wheel Alignment', 350, '2023-09-30', 'COMPLETED'],
    ['m12', 'v14', 'Engine Tuning', 1800, '2023-10-22', 'COMPLETED'],
    ['m13', 'v15', 'Oil Change', 500, '2023-11-08', 'COMPLETED'],
    ['m14', 'v16', 'Suspension Repair', 4200, '2023-12-05', 'ACTIVE'],
    ['m15', 'v18', 'Brake System Overhaul', 3500, '2023-12-15', 'ACTIVE'],
    ['m16', 'v19', 'Transmission Service', 2800, '2023-09-12', 'COMPLETED'],
    ['m17', 'v20', 'Coolant System Flush', 450, '2023-10-18', 'COMPLETED'],
    ['m18', 'v13', 'Oil Change', 250, '2023-11-25', 'COMPLETED'],
    ['m19', 'v17', 'Brake Inspection', 400, '2023-12-20', 'ACTIVE'],
    ['m20', 'v2', 'Fuel Injector Cleaning', 750, '2023-08-15', 'COMPLETED'],
    ['m21', 'v7', 'Tire Rotation', 350, '2023-09-22', 'COMPLETED'],
    ['m22', 'v9', 'Timing Belt Replacement', 2400, '2023-11-30', 'COMPLETED'],
    ['m23', 'v10', 'AC Compressor', 2200, '2023-12-08', 'COMPLETED'],
    ['m24', 'v15', 'Brake Fluid Change', 300, '2023-10-28', 'COMPLETED'],
    ['m25', 'v1', 'Full Service', 6000, '2023-12-22', 'ACTIVE'],
  ];

  const maintenance = await Promise.all(
    maintenanceData.map(([id, vehicleId, serviceType, cost, date, status]) =>
      prisma.maintenanceRecord.create({
        data: {
          id: id as string,
          vehicleId: vehicleId as string,
          serviceType: serviceType as string,
          cost: cost as number,
          date: new Date(date as string),
          status: status as any,
        },
      })
    )
  );
  console.log(`  ✅ ${maintenance.length} maintenance records created`);

  // ── Fuel Logs (35) ────────────────────────────────────────────────────────
  const fuelLogData = [
    // id, vehicleId, liters, cost, date, tripId
    ['f1', 'v1', 180, 324, '2023-08-08', 'TR-2401'],
    ['f2', 'v2', 220, 396, '2023-08-14', 'TR-2402'],
    ['f3', 'v4', 60, 108, '2023-08-20', null],
    ['f4', 'v5', 75, 135, '2023-08-25', null],
    ['f5', 'v7', 250, 450, '2023-09-02', null],
    ['f6', 'v8', 140, 252, '2023-09-08', null],
    ['f7', 'v9', 210, 378, '2023-09-15', null],
    ['f8', 'v10', 160, 288, '2023-09-20', null],
    ['f9', 'v11', 240, 432, '2023-09-28', null],
    ['f10', 'v12', 130, 234, '2023-10-05', null],
    ['f11', 'v14', 260, 468, '2023-10-12', null],
    ['f12', 'v15', 200, 360, '2023-10-18', null],
    ['f13', 'v18', 280, 504, '2023-10-22', null],
    ['f14', 'v19', 170, 306, '2023-10-28', null],
    ['f15', 'v20', 230, 414, '2023-11-02', null],
    ['f16', 'v1', 190, 342, '2023-11-08', null],
    ['f17', 'v2', 210, 378, '2023-11-14', null],
    ['f18', 'v4', 55, 99, '2023-11-20', null],
    ['f19', 'v5', 80, 144, '2023-11-25', null],
    ['f20', 'v7', 245, 441, '2023-11-30', null],
    ['f21', 'v8', 145, 261, '2023-12-05', null],
    ['f22', 'v9', 205, 369, '2023-12-10', null],
    ['f23', 'v10', 155, 279, '2023-12-12', null],
    ['f24', 'v11', 235, 423, '2023-12-15', null],
    ['f25', 'v12', 125, 225, '2023-12-18', null],
    ['f26', 'v14', 255, 459, '2023-12-20', null],
    ['f27', 'v15', 195, 351, '2023-12-22', null],
    ['f28', 'v18', 275, 495, '2023-12-25', null],
    ['f29', 'v19', 165, 297, '2023-12-28', null],
    ['f30', 'v20', 225, 405, '2024-01-02', null],
    ['f31', 'v1', 185, 333, '2024-01-05', null],
    ['f32', 'v2', 215, 387, '2024-01-08', null],
    ['f33', 'v9', 200, 360, '2024-01-10', null],
    ['f34', 'v15', 190, 342, '2024-01-12', null],
    ['f35', 'v18', 270, 486, '2024-01-14', null],
  ];

  const fuelLogs = await Promise.all(
    fuelLogData.map(([id, vehicleId, liters, cost, date, tripId]) =>
      prisma.fuelLog.create({
        data: {
          id: id as string,
          vehicleId: vehicleId as string,
          liters: liters as number,
          cost: cost as number,
          date: new Date(date as string),
          tripId: tripId as string | null,
        },
      })
    )
  );
  console.log(`  ✅ ${fuelLogs.length} fuel logs created`);

  // ── Expenses (25) ─────────────────────────────────────────────────────────
  const completedTripIds = createdTrips.filter(t => t.status === 'COMPLETED').map(t => t.id);
  const shuffledTrips = [...completedTripIds].sort(() => Math.random() - 0.5).slice(0, 25);

  const expenses = await Promise.all(
    shuffledTrips.map((tripId, i) => {
      const trip = createdTrips.find(t => t.id === tripId)!;
      const toll = Math.round(randomBetween(15, 150));
      const other = Math.round(randomBetween(10, 250));
      const total = toll + other;
      return prisma.expense.create({
        data: {
          id: `e${i + 1}`,
          tripId: trip.id,
          vehicleId: trip.vehicleId!,
          toll,
          other,
          total,
          maintLinked: i % 5 === 0,
        },
      });
    })
  );
  console.log(`  ✅ ${expenses.length} expenses created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const completedCount = createdTrips.filter(t => t.status === 'COMPLETED').length;
  const dispatchedCount = createdTrips.filter(t => t.status === 'DISPATCHED').length;
  const draftCount = createdTrips.filter(t => t.status === 'DRAFT').length;
  const cancelledCount = createdTrips.filter(t => t.status === 'CANCELLED').length;

  console.log('\n📊 Seed Summary:');
  console.log(`   ${users.length} users`);
  console.log(`   ${vehicles.length} vehicles`);
  console.log(`   ${drivers.length} drivers`);
  console.log(`   ${createdTrips.length} trips (${completedCount} completed, ${dispatchedCount} dispatched, ${draftCount} draft, ${cancelledCount} cancelled)`);
  console.log(`   ${maintenance.length} maintenance records`);
  console.log(`   ${fuelLogs.length} fuel logs`);
  console.log(`   ${expenses.length} expenses`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   demo@transitops.com / demo         → Dispatcher');
  console.log('   manager@transitops.com / password123 → Fleet Manager (full access)');
  console.log('   dispatch@transitops.com / password123 → Dispatcher');
  console.log('   safety@transitops.com / password123  → Safety Officer');
  console.log('   finance@transitops.com / password123 → Financial Analyst');
  console.log('\n💡 Tip: Use manager@transitops.com for full access to all modules');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
