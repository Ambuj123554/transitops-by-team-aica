// ── Enum Mappers: Frontend title-case ↔ Backend UPPER_CASE ──

export const STATUS_MAP = {
  // Vehicle & Driver shared
  Available: 'AVAILABLE',
  'On Trip': 'ON_TRIP',
  'In Shop': 'IN_SHOP',
  Retired: 'RETIRED',
  // Driver-only
  'Off Duty': 'OFF_DUTY',
  Suspended: 'SUSPENDED',
  // Trip
  Draft: 'DRAFT',
  Dispatched: 'DISPATCHED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  // Maintenance
  Active: 'ACTIVE',
} as const;

export const STATUS_MAP_REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(STATUS_MAP)) {
  STATUS_MAP_REVERSE[v] = k;
}

export const ROLE_MAP: Record<string, string> = {
  'Fleet Manager': 'FLEET_MANAGER',
  Dispatcher: 'DISPATCHER',
  'Safety Officer': 'SAFETY_OFFICER',
  'Financial Analyst': 'FINANCIAL_ANALYST',
};

export const ROLE_MAP_REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(ROLE_MAP)) {
  ROLE_MAP_REVERSE[v] = k;
}

export function mapStatusToApi(status: string): string {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] ?? status;
}

export function mapStatusFromApi(status: string): string {
  return STATUS_MAP_REVERSE[status] ?? status;
}

export function mapRoleToApi(role: string): string {
  return ROLE_MAP[role] ?? role;
}

export function mapRoleFromApi(role: string): string {
  return ROLE_MAP_REVERSE[role] ?? role;
}

// ── Vehicle Mappers ──

const VEHICLE_FIELDS = ['regNo', 'name', 'type', 'capacity', 'odometer', 'acquisitionCost', 'region'] as const;

export interface ApiVehicle {
  id: string;
  regNo: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function mapVehicleFromApi(v: ApiVehicle) {
  return {
    id: v.id,
    regNo: v.regNo,
    name: v.name,
    type: v.type,
    capacity: v.capacity,
    odometer: v.odometer,
    acquisitionCost: v.acquisitionCost,
    region: v.region ?? undefined,
    status: mapStatusFromApi(v.status),
  };
}

export function mapVehicleToApi(data: Record<string, any>) {
  const body: Record<string, any> = {};
  for (const field of VEHICLE_FIELDS) {
    if (data[field] !== undefined) body[field] = data[field];
  }
  if (data.status) body.status = mapStatusToApi(data.status);
  return body;
}

// ── Driver Mappers ──

const DRIVER_FIELDS = ['name', 'licenseNo', 'category', 'expiry', 'contact', 'safetyScore'] as const;

export interface ApiDriver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string;
  tripCompletion: number;
  safetyScore: number;
  status: string;
  licenseExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapDriverFromApi(d: ApiDriver) {
  return {
    id: d.id,
    name: d.name,
    licenseNo: d.licenseNumber,
    category: d.licenseCategory,
    expiry: typeof d.licenseExpiry === 'string' ? d.licenseExpiry.split('T')[0] : d.licenseExpiry,
    contact: d.contactNumber,
    tripCompletion: d.tripCompletion,
    safetyScore: d.safetyScore,
    status: mapStatusFromApi(d.status),
  };
}

export function mapDriverToApi(data: Record<string, any>) {
  const body: Record<string, any> = {};
  for (const field of DRIVER_FIELDS) {
    if (data[field] !== undefined) {
      if (field === 'licenseNo') body.licenseNumber = data[field];
      else if (field === 'category') body.licenseCategory = data[field];
      else if (field === 'expiry') body.licenseExpiry = data[field];
      else if (field === 'contact') body.contactNumber = data[field];
      else body[field] = data[field];
    }
  }
  if (data.status) body.status = mapStatusToApi(data.status);
  return body;
}

// ── Trip Mappers ──

export interface ApiTrip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  revenue: number | null;
  status: string;
  dispatchedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: { id: string; regNo: string; name: string } | null;
  driver?: { id: string; name: string } | null;
}

export function mapTripFromApi(t: ApiTrip) {
  return {
    id: t.id,
    vehicleId: t.vehicleId ?? '',
    driverId: t.driverId,
    source: t.source,
    destination: t.destination,
    cargoWeight: t.cargoWeightKg,
    plannedDistance: t.plannedDistanceKm,
    status: mapStatusFromApi(t.status),
    eta: computeEta(t.status, t.dispatchedAt),
    createdAt: typeof t.createdAt === 'string' ? t.createdAt.split('T')[0] : t.createdAt,
  };
}

function computeEta(status: string, dispatchedAt: string | null): string {
  if (status === 'COMPLETED') return '—';
  if (status === 'CANCELLED') return '—';
  if (status === 'DRAFT') return 'TBD';
  if (status === 'DISPATCHED' && dispatchedAt) {
    // Show relative time from dispatch
    const minutes = Math.round((Date.now() - new Date(dispatchedAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  return 'En route';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mapTripCreateToApi(data: Record<string, any>) {
  return {
    source: data.source,
    destination: data.destination,
    cargoWeightKg: data.cargoWeight,
    plannedDistanceKm: data.plannedDistance,
    vehicleId: data.vehicleId || undefined,
    driverId: data.driverId || undefined,
  };
}

// ── Maintenance Mappers ──

export interface ApiMaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: { id: string; regNo: string; name: string };
}

export function mapMaintenanceFromApi(m: ApiMaintenanceRecord) {
  return {
    id: m.id,
    vehicleId: m.vehicleId,
    serviceType: m.serviceType,
    cost: m.cost,
    date: typeof m.date === 'string' ? m.date.split('T')[0] : m.date,
    status: mapStatusFromApi(m.status),
  };
}

const MAINT_FIELDS = ['vehicleId', 'serviceType', 'cost', 'date'] as const;

export function mapMaintenanceToApi(data: Record<string, any>) {
  const body: Record<string, any> = {};
  for (const field of MAINT_FIELDS) {
    if (data[field] !== undefined) body[field] = data[field];
  }
  body.status = data.status ? mapStatusToApi(data.status) : 'ACTIVE';
  // Send date as ISO string
  if (body.date && !body.date.includes('T')) {
    body.date = new Date(body.date).toISOString();
  }
  return body;
}

// ── Fuel Log Mappers ──

export interface ApiFuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  tripId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapFuelLogFromApi(f: ApiFuelLog) {
  return {
    id: f.id,
    vehicleId: f.vehicleId,
    date: typeof f.date === 'string' ? f.date.split('T')[0] : f.date,
    liters: f.liters,
    cost: f.cost,
  };
}

export function mapFuelLogToApi(data: Record<string, any>) {
  const body: Record<string, any> = {
    vehicleId: data.vehicleId,
    liters: data.liters,
    cost: data.cost,
    date: data.date?.includes('T') ? data.date : new Date(data.date).toISOString(),
  };
  if (data.tripId) body.tripId = data.tripId;
  return body;
}

// ── Expense Mappers ──

export interface ApiExpense {
  id: string;
  vehicleId: string;
  tripId: string;
  tollCost: number;
  otherCost: number;
  total: number;
  maintLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapExpenseFromApi(e: ApiExpense) {
  return {
    id: e.id,
    tripId: e.tripId,
    vehicleId: e.vehicleId,
    toll: e.tollCost,
    other: e.otherCost,
    maintLinked: e.maintLinked,
    total: e.total,
  };
}

export function mapExpenseToApi(data: Record<string, any>) {
  return {
    tripId: data.tripId,
    vehicleId: data.vehicleId,
    tollCost: data.toll ?? 0,
    otherCost: data.other ?? 0,
  };
}
