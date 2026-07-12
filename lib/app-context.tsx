'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppUser, Role, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from '@/lib/types';
import * as api from '@/lib/api';
import { mapRoleFromApi } from '@/lib/mappers';

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  company: string;
  phone?: string;
  employeeId: string;
}

interface AppContextType {
  user: AppUser | null;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  register: (data: RegisteredUser) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  failedAttempts: number;
  loading: boolean;
  error: string | null;

  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];

  // Backward-compatible setters (for read-only pages that sort/filter locally)
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLog[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;

  // ── API Mutation Methods ──

  // Vehicles
  createVehicle: (data: Record<string, any>) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Record<string, any>) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;

  // Drivers
  createDriver: (data: Record<string, any>) => Promise<Driver>;
  updateDriver: (id: string, data: Record<string, any>) => Promise<Driver>;
  deleteDriver: (id: string) => Promise<void>;
  refreshDrivers: () => Promise<void>;

  // Trips
  createTrip: (data: Record<string, any>) => Promise<Trip>;
  dispatchTrip: (id: string, data: { vehicleId: string; driverId: string }) => Promise<Trip>;
  completeTrip: (id: string, data: { actualDistanceKm: number; finalOdometer?: number; fuelConsumedLiters?: number; revenue?: number }) => Promise<Trip>;
  cancelTrip: (id: string) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  refreshTrips: () => Promise<void>;

  // Maintenance
  createMaintenance: (data: Record<string, any>) => Promise<MaintenanceRecord>;
  updateMaintenance: (id: string, data: Record<string, any>) => Promise<MaintenanceRecord>;
  deleteMaintenance: (id: string) => Promise<void>;
  refreshMaintenance: () => Promise<void>;

  // Fuel & Expenses
  createFuelLog: (data: Record<string, any>) => Promise<FuelLog>;
  createExpense: (data: Record<string, any>) => Promise<Expense>;
  refreshFuelLogs: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const loadedRef = useRef(false);

  // ── Load data on mount if token exists ──

  useEffect(() => {
    if (loadedRef.current) return;
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    loadedRef.current = true;
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const data = await api.loadAllData();
      setVehicles(data.vehicles);
      setDrivers(data.drivers);
      setTrips(data.trips);
      setMaintenance(data.maintenance);
      setFuelLogs(data.fuelLogs);
      setExpenses(data.expenses);
      if (data.user) setUser(data.user);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      // Token might be expired
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  // ── Refresh helpers ──

  const refreshVehicles = useCallback(async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err: any) {
      console.error('Failed to refresh vehicles:', err);
    }
  }, []);

  const refreshDrivers = useCallback(async () => {
    try {
      const data = await api.getDrivers();
      setDrivers(data);
    } catch (err: any) {
      console.error('Failed to refresh drivers:', err);
    }
  }, []);

  const refreshTrips = useCallback(async () => {
    try {
      const data = await api.getTrips();
      setTrips(data);
    } catch (err: any) {
      console.error('Failed to refresh trips:', err);
    }
  }, []);

  const refreshMaintenance = useCallback(async () => {
    try {
      const data = await api.getMaintenanceLogs();
      setMaintenance(data);
    } catch (err: any) {
      console.error('Failed to refresh maintenance:', err);
    }
  }, []);

  const refreshFuelLogs = useCallback(async () => {
    try {
      const data = await api.getFuelLogs();
      setFuelLogs(data);
    } catch (err: any) {
      console.error('Failed to refresh fuel logs:', err);
    }
  }, []);

  const refreshExpenses = useCallback(async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err: any) {
      console.error('Failed to refresh expenses:', err);
    }
  }, []);

  // ── Auth ──

  const login = useCallback(async (email: string, password: string, role: Role): Promise<boolean> => {
    try {
      setError(null);
      const result = await api.login(email, password);
      api.setToken(result.token);
      setUser({
        name: result.user.name,
        email: result.user.email,
        role: role,
        initials: getInitials(result.user.name),
      });
      setFailedAttempts(0);
      // Load all data after login
      await loadAllData();
      return true;
    } catch (err: any) {
      if (err instanceof api.ApiErrorClass && err.code === 'ACCOUNT_LOCKED') {
        setFailedAttempts(5);
        setError(err.message);
      } else {
        setFailedAttempts(prev => prev + 1);
        setError(err.message || 'Invalid credentials');
      }
      return false;
    }
  }, []);

  const registerFn = useCallback(async (data: RegisteredUser): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const result = await api.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      api.setToken(result.token);
      setUser({
        name: result.user.name,
        email: result.user.email,
        role: data.role,
        initials: getInitials(result.user.name),
      });
      setFailedAttempts(0);
      await loadAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    setFailedAttempts(0);
    setVehicles([]);
    setDrivers([]);
    setTrips([]);
    setMaintenance([]);
    setFuelLogs([]);
    setExpenses([]);
    loadedRef.current = false;
  }, []);

  // ── Vehicle Mutations ──

  const createVehicle = useCallback(async (data: Record<string, any>): Promise<Vehicle> => {
    const vehicle = await api.createVehicle(data);
    setVehicles(prev => [vehicle, ...prev]);
    return vehicle;
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Record<string, any>): Promise<Vehicle> => {
    const vehicle = await api.updateVehicle(id, data);
    setVehicles(prev => prev.map(v => v.id === id ? vehicle : v));
    return vehicle;
  }, []);

  const deleteVehicle = useCallback(async (id: string): Promise<void> => {
    await api.deleteVehicle(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  // ── Driver Mutations ──

  const createDriver = useCallback(async (data: Record<string, any>): Promise<Driver> => {
    const driver = await api.createDriver(data);
    setDrivers(prev => [driver, ...prev]);
    return driver;
  }, []);

  const updateDriver = useCallback(async (id: string, data: Record<string, any>): Promise<Driver> => {
    const driver = await api.updateDriver(id, data);
    setDrivers(prev => prev.map(d => d.id === id ? driver : d));
    return driver;
  }, []);

  const deleteDriver = useCallback(async (id: string): Promise<void> => {
    await api.deleteDriver(id);
    setDrivers(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Trip Mutations ──

  const createTrip = useCallback(async (data: Record<string, any>): Promise<Trip> => {
    const trip = await api.createTrip(data);
    setTrips(prev => [trip, ...prev]);
    return trip;
  }, []);

  const dispatchTrip = useCallback(async (id: string, dispatchData: { vehicleId: string; driverId: string }): Promise<Trip> => {
    const trip = await api.dispatchTrip(id, dispatchData);
    setTrips(prev => prev.map(t => t.id === id ? trip : t));
    // Refresh vehicles and drivers since their statuses changed
    refreshVehicles();
    refreshDrivers();
    return trip;
  }, [refreshVehicles, refreshDrivers]);

  const completeTrip = useCallback(async (id: string, completeData: { actualDistanceKm: number; finalOdometer?: number; fuelConsumedLiters?: number; revenue?: number }): Promise<Trip> => {
    const trip = await api.completeTrip(id, completeData);
    setTrips(prev => prev.map(t => t.id === id ? trip : t));
    refreshVehicles();
    refreshDrivers();
    return trip;
  }, [refreshVehicles, refreshDrivers]);

  const cancelTrip = useCallback(async (id: string): Promise<Trip> => {
    const trip = await api.cancelTrip(id);
    setTrips(prev => prev.map(t => t.id === id ? trip : t));
    refreshVehicles();
    refreshDrivers();
    return trip;
  }, [refreshVehicles, refreshDrivers]);

  const deleteTrip = useCallback(async (id: string): Promise<void> => {
    await api.deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Maintenance Mutations ──

  const createMaintenance = useCallback(async (data: Record<string, any>): Promise<MaintenanceRecord> => {
    const record = await api.createMaintenanceLog(data);
    setMaintenance(prev => [record, ...prev]);
    // Refresh vehicles since status may have changed (IN_SHOP)
    refreshVehicles();
    return record;
  }, [refreshVehicles]);

  const updateMaintenance = useCallback(async (id: string, data: Record<string, any>): Promise<MaintenanceRecord> => {
    const record = await api.updateMaintenanceLog(id, data);
    setMaintenance(prev => prev.map(m => m.id === id ? record : m));
    refreshVehicles();
    return record;
  }, [refreshVehicles]);

  const deleteMaintenance = useCallback(async (id: string): Promise<void> => {
    await api.deleteMaintenanceLog(id);
    setMaintenance(prev => prev.filter(m => m.id !== id));
  }, []);

  // ── Fuel & Expense Mutations ──

  const createFuelLog = useCallback(async (data: Record<string, any>): Promise<FuelLog> => {
    const log = await api.createFuelLog(data);
    setFuelLogs(prev => [log, ...prev]);
    return log;
  }, []);

  const createExpense = useCallback(async (data: Record<string, any>): Promise<Expense> => {
    const expense = await api.createExpense(data);
    setExpenses(prev => [expense, ...prev]);
    return expense;
  }, []);

  return (
    <AppContext.Provider value={{
      user, login: login as any, register: registerFn as any, logout, failedAttempts,
      loading, error,
      vehicles, setVehicles,
      drivers, setDrivers,
      trips, setTrips,
      maintenance, setMaintenance,
      fuelLogs, setFuelLogs,
      expenses, setExpenses,

      createVehicle, updateVehicle, deleteVehicle, refreshVehicles,
      createDriver, updateDriver, deleteDriver, refreshDrivers,
      createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, refreshTrips,
      createMaintenance, updateMaintenance, deleteMaintenance, refreshMaintenance,
      createFuelLog, createExpense, refreshFuelLogs, refreshExpenses,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
