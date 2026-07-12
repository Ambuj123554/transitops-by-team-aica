export type Role = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
export type TripStatus = 'Draft' | 'Pending Approval' | 'Dispatched' | 'Completed' | 'Cancelled';
export type MaintenanceStatus = 'Active' | 'Completed';

export interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;
  contact: string;
  tripCompletion: number;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string | null;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  eta: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
}

export interface Expense {
  id: string;
  tripId: string;
  vehicleId: string;
  toll: number;
  other: number;
  maintLinked: boolean;
  total: number;
}

export interface AppUser {
  name: string;
  email: string;
  role: Role;
  initials: string;
}

export const ROLE_PERMISSIONS: Record<Role, Record<string, 'full' | 'view' | 'none'>> = {
  'Fleet Manager':      { fleet: 'full', drivers: 'full', trips: 'full', fuel: 'full',  analytics: 'full' },
  'Dispatcher':         { fleet: 'view', drivers: 'none', trips: 'full', fuel: 'none',  analytics: 'none' },
  'Safety Officer':     { fleet: 'none', drivers: 'full', trips: 'view', fuel: 'none',  analytics: 'none' },
  'Financial Analyst':  { fleet: 'view', drivers: 'none', trips: 'none', fuel: 'full',  analytics: 'full' },
};

export const NAV_PERMISSION_MAP: Record<string, keyof typeof ROLE_PERMISSIONS['Fleet Manager']> = {
  '/dashboard': 'trips',
  '/fleet': 'fleet',
  '/drivers': 'drivers',
  '/trips': 'trips',
  '/maintenance': 'fleet',
  '/fuel': 'fuel',
  '/analytics': 'analytics',
  '/settings': 'fleet',
};
