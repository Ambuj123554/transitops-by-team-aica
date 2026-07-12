import {
  mapVehicleFromApi, mapVehicleToApi,
  mapDriverFromApi, mapDriverToApi,
  mapTripFromApi, mapTripCreateToApi,
  mapMaintenanceFromApi, mapMaintenanceToApi,
  mapFuelLogFromApi, mapFuelLogToApi,
  mapExpenseFromApi, mapExpenseToApi,
  mapRoleToApi, mapRoleFromApi,
  type ApiVehicle, type ApiDriver, type ApiTrip,
  type ApiMaintenanceRecord, type ApiFuelLog, type ApiExpense,
} from './mappers';
import type { AppUser, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from './types';

// ── Config ──

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'transitops_token';

// ── Token Management ──

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// ── API Response Types ──

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { message: string; code: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Fetch Wrapper ──

export class ApiErrorClass extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  noAuth = false
): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (!noAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await res.json();

  if (!body.success) {
    throw new ApiErrorClass(body.error.message, body.error.code);
  }

  return body.data;
}

// ── Auth API ──

export interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function login(email: string, password: string) {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, true);
  return result;
}

export async function register(data: { name: string; email: string; password: string; role: string }) {
  const result = await request<LoginResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      role: mapRoleToApi(data.role),
    }),
  }, true);
  return result;
}

export async function logout() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return request<LoginResult['user']>('/users/me');
}

export async function updateMe(name: string) {
  return request<LoginResult['user']>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

// ── Vehicles API ──

export async function getVehicles(params?: { search?: string; type?: string; status?: string; region?: string }): Promise<Vehicle[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.region) query.set('region', params.region);
  const qs = query.toString();
  const data = await request<ApiVehicle[]>(`/vehicles${qs ? `?${qs}` : ''}`);
  return data.map(v => mapVehicleFromApi(v) as Vehicle);
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const data = await request<ApiVehicle>(`/vehicles/${id}`);
  return mapVehicleFromApi(data) as Vehicle;
}

export async function getAvailableVehicles(): Promise<{ id: string; regNo: string; name: string; capacity: number }[]> {
  return request('/vehicles/available');
}

export async function createVehicle(data: Record<string, any>): Promise<Vehicle> {
  const result = await request<ApiVehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(mapVehicleToApi(data)),
  });
  return mapVehicleFromApi(result) as Vehicle;
}

export async function updateVehicle(id: string, data: Record<string, any>): Promise<Vehicle> {
  const result = await request<ApiVehicle>(`/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapVehicleToApi(data)),
  });
  return mapVehicleFromApi(result) as Vehicle;
}

export async function deleteVehicle(id: string): Promise<{ id: string }> {
  return request(`/vehicles/${id}`, { method: 'DELETE' });
}

// ── Drivers API ──

export async function getDrivers(search?: string, status?: string): Promise<Driver[]> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  const qs = query.toString();
  const data = await request<ApiDriver[]>(`/drivers${qs ? `?${qs}` : ''}`);
  return data.map(d => mapDriverFromApi(d) as Driver);
}

export async function getDriverById(id: string): Promise<Driver> {
  const data = await request<ApiDriver>(`/drivers/${id}`);
  return mapDriverFromApi(data) as Driver;
}

export async function getAvailableDrivers(): Promise<{ id: string; name: string; licenseCategory: string }[]> {
  return request('/drivers/available');
}

export async function createDriver(data: Record<string, any>): Promise<Driver> {
  const result = await request<ApiDriver>('/drivers', {
    method: 'POST',
    body: JSON.stringify(mapDriverToApi(data)),
  });
  return mapDriverFromApi(result) as Driver;
}

export async function updateDriver(id: string, data: Record<string, any>): Promise<Driver> {
  const result = await request<ApiDriver>(`/drivers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapDriverToApi(data)),
  });
  return mapDriverFromApi(result) as Driver;
}

export async function deleteDriver(id: string): Promise<{ id: string }> {
  return request(`/drivers/${id}`, { method: 'DELETE' });
}

// ── Trips API ──

export async function getTrips(status?: string): Promise<Trip[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await request<ApiTrip[]>(`/trips${qs}`);
  return data.map(t => mapTripFromApi(t) as Trip);
}

export async function getTripById(id: string): Promise<Trip> {
  const data = await request<ApiTrip>(`/trips/${id}`);
  return mapTripFromApi(data) as Trip;
}

export async function createTrip(data: Record<string, any>): Promise<Trip> {
  const result = await request<ApiTrip>('/trips', {
    method: 'POST',
    body: JSON.stringify(mapTripCreateToApi(data)),
  });
  return mapTripFromApi(result) as Trip;
}

export async function dispatchTrip(id: string, data: { vehicleId: string; driverId: string }): Promise<Trip> {
  const result = await request<ApiTrip>(`/trips/${id}/dispatch`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return mapTripFromApi(result) as Trip;
}

export async function completeTrip(id: string, data: { actualDistanceKm: number; finalOdometer?: number; fuelConsumedLiters?: number; revenue?: number }): Promise<Trip> {
  const result = await request<ApiTrip>(`/trips/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return mapTripFromApi(result) as Trip;
}

export async function cancelTrip(id: string): Promise<Trip> {
  const result = await request<ApiTrip>(`/trips/${id}/cancel`, {
    method: 'PATCH',
  });
  return mapTripFromApi(result) as Trip;
}

export async function deleteTrip(id: string): Promise<{ id: string }> {
  return request(`/trips/${id}`, { method: 'DELETE' });
}

// ── Maintenance API ──

export async function getMaintenanceLogs(params?: { vehicleId?: string; status?: string }): Promise<MaintenanceRecord[]> {
  const query = new URLSearchParams();
  if (params?.vehicleId) query.set('vehicleId', params.vehicleId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const data = await request<ApiMaintenanceRecord[]>(`/maintenance${qs ? `?${qs}` : ''}`);
  return data.map(m => mapMaintenanceFromApi(m) as MaintenanceRecord);
}

export async function createMaintenanceLog(data: Record<string, any>): Promise<MaintenanceRecord> {
  const result = await request<ApiMaintenanceRecord>('/maintenance', {
    method: 'POST',
    body: JSON.stringify(mapMaintenanceToApi(data)),
  });
  return mapMaintenanceFromApi(result) as MaintenanceRecord;
}

export async function updateMaintenanceLog(id: string, data: Record<string, any>): Promise<MaintenanceRecord> {
  const result = await request<ApiMaintenanceRecord>(`/maintenance/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapMaintenanceToApi(data)),
  });
  return mapMaintenanceFromApi(result) as MaintenanceRecord;
}

export async function deleteMaintenanceLog(id: string): Promise<{ id: string }> {
  return request(`/maintenance/${id}`, { method: 'DELETE' });
}

// ── Fuel Logs API ──

export async function getFuelLogs(vehicleId?: string): Promise<FuelLog[]> {
  const qs = vehicleId ? `?vehicleId=${vehicleId}` : '';
  const data = await request<ApiFuelLog[]>(`/fuel-expenses/fuel${qs}`);
  return data.map(mapFuelLogFromApi);
}

export async function createFuelLog(data: Record<string, any>): Promise<FuelLog> {
  const result = await request<ApiFuelLog>('/fuel-expenses/fuel', {
    method: 'POST',
    body: JSON.stringify(mapFuelLogToApi(data)),
  });
  return mapFuelLogFromApi(result);
}

// ── Expenses API ──

export async function getExpenses(vehicleId?: string): Promise<Expense[]> {
  const qs = vehicleId ? `?vehicleId=${vehicleId}` : '';
  const data = await request<ApiExpense[]>(`/fuel-expenses/expenses${qs}`);
  return data.map(mapExpenseFromApi);
}

export async function createExpense(data: Record<string, any>): Promise<Expense> {
  const result = await request<ApiExpense>('/fuel-expenses/expenses', {
    method: 'POST',
    body: JSON.stringify(mapExpenseToApi(data)),
  });
  return mapExpenseFromApi(result);
}

// ── Operational Cost API ──

export async function getOperationalCost(vehicleId?: string) {
  const path = vehicleId ? `/fuel-expenses/operational-cost/${vehicleId}` : '/fuel-expenses/operational-cost';
  return request<{
    fuelTotal: number;
    maintenanceTotal: number;
    expenseTotal: number;
    total: number;
    vehicleId?: string;
  }>(path);
}

// ── Full Data Load (for context initialization) ──

export interface AllData {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  user: AppUser | null;
}

export async function loadAllData(): Promise<AllData> {
  const [vehicles, drivers, trips, maintenance, fuelLogs, expenses] = await Promise.all([
    getVehicles(),
    getDrivers(),
    getTrips(),
    getMaintenanceLogs(),
    getFuelLogs(),
    getExpenses(),
  ]);

  // Try to get current user profile
  let user: AppUser | null = null;
  try {
    const me = await getMe();
    user = {
      name: me.name,
      email: me.email,
      role: mapRoleFromApi(me.role) as any,
      initials: me.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2),
    };
  } catch {
    // Not logged in or token expired
  }

  return { vehicles, drivers, trips, maintenance, fuelLogs, expenses, user };
}
