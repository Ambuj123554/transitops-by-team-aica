import { Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from './types';

export const mockVehicles: Vehicle[] = [
  { id: 'v1', regNo: 'TRN-001', name: 'Volvo FH16', type: 'Heavy Truck', capacity: 20000, odometer: 145230, acquisitionCost: 120000, status: 'Available' },
  { id: 'v2', regNo: 'TRN-002', name: 'Mercedes Actros', type: 'Heavy Truck', capacity: 18000, odometer: 98450, acquisitionCost: 115000, status: 'On Trip' },
  { id: 'v3', regNo: 'TRN-003', name: 'Isuzu NPR', type: 'Medium Truck', capacity: 5000, odometer: 67800, acquisitionCost: 55000, status: 'In Shop' },
  { id: 'v4', regNo: 'TRN-004', name: 'Toyota Hilux', type: 'Light Van', capacity: 1200, odometer: 34560, acquisitionCost: 38000, status: 'Available' },
  { id: 'v5', regNo: 'TRN-005', name: 'Ford Transit', type: 'Light Van', capacity: 1500, odometer: 52100, acquisitionCost: 42000, status: 'Available' },
  { id: 'v6', regNo: 'TRN-006', name: 'MAN TGX', type: 'Heavy Truck', capacity: 22000, odometer: 201340, acquisitionCost: 130000, status: 'Retired' },
  { id: 'v7', regNo: 'TRN-007', name: 'Scania R450', type: 'Heavy Truck', capacity: 21000, odometer: 176500, acquisitionCost: 125000, status: 'On Trip' },
  { id: 'v8', regNo: 'TRN-008', name: 'DAF XF', type: 'Medium Truck', capacity: 8000, odometer: 89200, acquisitionCost: 75000, status: 'Available' },
];

export const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Marcus Reed', licenseNo: 'DL-20190423', category: 'Class A', expiry: '2025-03-15', contact: '+1-555-0101', tripCompletion: 94, safetyScore: 92, status: 'Available' },
  { id: 'd2', name: 'Elena Vasquez', licenseNo: 'DL-20180876', category: 'Class B', expiry: '2027-08-22', contact: '+1-555-0102', tripCompletion: 87, safetyScore: 78, status: 'On Trip' },
  { id: 'd3', name: 'James Okafor', licenseNo: 'DL-20211234', category: 'Class A', expiry: '2024-11-30', contact: '+1-555-0103', tripCompletion: 91, safetyScore: 85, status: 'Available' },
  { id: 'd4', name: 'Priya Nair', licenseNo: 'DL-20160543', category: 'Class C', expiry: '2023-06-10', contact: '+1-555-0104', tripCompletion: 76, safetyScore: 65, status: 'Suspended' },
  { id: 'd5', name: 'Tom Lindberg', licenseNo: 'DL-20220987', category: 'Class B', expiry: '2028-01-18', contact: '+1-555-0105', tripCompletion: 98, safetyScore: 97, status: 'Off Duty' },
  { id: 'd6', name: 'Sarah Kim', licenseNo: 'DL-20190321', category: 'Class A', expiry: '2026-09-05', contact: '+1-555-0106', tripCompletion: 89, safetyScore: 88, status: 'Available' },
  { id: 'd7', name: 'Carlos Mendes', licenseNo: 'DL-20150789', category: 'Class A', expiry: '2025-12-20', contact: '+1-555-0107', tripCompletion: 82, safetyScore: 80, status: 'On Trip' },
];

export const mockTrips: Trip[] = [
  { id: 'TR-2401', vehicleId: 'v2', driverId: 'd2', source: 'Chicago Depot', destination: 'Detroit Hub', cargoWeight: 12000, plannedDistance: 450, status: 'Dispatched', eta: '14:30', createdAt: '2024-01-15' },
  { id: 'TR-2402', vehicleId: 'v7', driverId: 'd7', source: 'LA Warehouse', destination: 'Phoenix DC', cargoWeight: 18500, plannedDistance: 600, status: 'Dispatched', eta: '18:00', createdAt: '2024-01-15' },
  { id: 'TR-2403', vehicleId: 'v1', driverId: 'd1', source: 'Chicago Depot', destination: 'Milwaukee', cargoWeight: 5000, plannedDistance: 150, status: 'Completed', eta: '10:00', createdAt: '2024-01-14' },
  { id: 'TR-2404', vehicleId: 'v4', driverId: null, source: 'Detroit Hub', destination: 'Cleveland', cargoWeight: 800, plannedDistance: 170, status: 'Draft', eta: 'TBD', createdAt: '2024-01-15' },
  { id: 'TR-2405', vehicleId: 'v5', driverId: 'd6', source: 'Phoenix DC', destination: 'Tucson', cargoWeight: 1200, plannedDistance: 180, status: 'Completed', eta: '12:15', createdAt: '2024-01-14' },
  { id: 'TR-2406', vehicleId: 'v8', driverId: null, source: 'Denver', destination: 'Salt Lake City', cargoWeight: 3000, plannedDistance: 540, status: 'Cancelled', eta: '—', createdAt: '2024-01-13' },
];

export const mockMaintenance: MaintenanceRecord[] = [
  { id: 'm1', vehicleId: 'v3', serviceType: 'Engine Overhaul', cost: 8500, date: '2024-01-10', status: 'Active' },
  { id: 'm2', vehicleId: 'v1', serviceType: 'Tire Replacement', cost: 1200, date: '2024-01-08', status: 'Completed' },
  { id: 'm3', vehicleId: 'v2', serviceType: 'Oil Change', cost: 450, date: '2024-01-05', status: 'Completed' },
  { id: 'm4', vehicleId: 'v7', serviceType: 'Brake Service', cost: 2300, date: '2024-01-12', status: 'Completed' },
  { id: 'm5', vehicleId: 'v8', serviceType: 'Transmission Repair', cost: 5600, date: '2024-01-14', status: 'Completed' },
];

export const mockFuelLogs: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', date: '2024-01-15', liters: 180, cost: 324 },
  { id: 'f2', vehicleId: 'v2', date: '2024-01-14', liters: 220, cost: 396 },
  { id: 'f3', vehicleId: 'v4', date: '2024-01-15', liters: 60, cost: 108 },
  { id: 'f4', vehicleId: 'v5', date: '2024-01-13', liters: 75, cost: 135 },
  { id: 'f5', vehicleId: 'v7', date: '2024-01-15', liters: 250, cost: 450 },
  { id: 'f6', vehicleId: 'v8', date: '2024-01-12', liters: 140, cost: 252 },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', tripId: 'TR-2401', vehicleId: 'v2', toll: 45, other: 80, maintLinked: false, total: 125 },
  { id: 'e2', tripId: 'TR-2402', vehicleId: 'v7', toll: 120, other: 200, maintLinked: true, total: 320 },
  { id: 'e3', tripId: 'TR-2403', vehicleId: 'v1', toll: 30, other: 50, maintLinked: false, total: 80 },
  { id: 'e4', tripId: 'TR-2405', vehicleId: 'v5', toll: 15, other: 25, maintLinked: false, total: 40 },
];

export const monthlyRevenue = [
  { month: 'Jul', revenue: 48000 },
  { month: 'Aug', revenue: 52000 },
  { month: 'Sep', revenue: 47000 },
  { month: 'Oct', revenue: 61000 },
  { month: 'Nov', revenue: 58000 },
  { month: 'Dec', revenue: 65000 },
  { month: 'Jan', revenue: 71000 },
];
