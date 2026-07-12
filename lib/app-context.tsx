'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, Role, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from '@/lib/types';
import {
  mockVehicles, mockDrivers, mockTrips,
  mockMaintenance, mockFuelLogs, mockExpenses,
} from '@/lib/mock-data';

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
  login: (email: string, password: string, role: Role) => boolean;
  register: (data: RegisteredUser) => { success: boolean; error?: string };
  logout: () => void;
  failedAttempts: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;

  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;

  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;

  maintenance: MaintenanceRecord[];
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;

  fuelLogs: FuelLog[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLog[]>>;

  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

const MOCK_USERS: Record<string, { name: string; password: string }> = {
  'manager@transitops.com': { name: 'Alex Morgan', password: 'password' },
  'dispatch@transitops.com': { name: 'Raven K.', password: 'password' },
  'safety@transitops.com': { name: 'Sam Chen', password: 'password' },
  'finance@transitops.com': { name: 'Jordan Lee', password: 'password' },
  'demo@transitops.com': { name: 'Demo User', password: 'demo' },
};

const STORAGE_KEY = 'transitops_registered_users';

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function loadRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: RegisteredUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(mockMaintenance);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(mockFuelLogs);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  const login = useCallback((email: string, password: string, role: Role): boolean => {
    const normalizedEmail = email.toLowerCase();

    // Check mock demo users first
    const found = MOCK_USERS[normalizedEmail];
    if (found && found.password === password) {
      setUser({ name: found.name, email: normalizedEmail, role, initials: getInitials(found.name) });
      setFailedAttempts(0);
      return true;
    }

    // Check registered users
    const registered = loadRegisteredUsers();
    const registeredUser = registered.find(u => u.email.toLowerCase() === normalizedEmail);
    if (registeredUser && registeredUser.password === password) {
      setUser({ name: registeredUser.name, email: normalizedEmail, role, initials: getInitials(registeredUser.name) });
      setFailedAttempts(0);
      return true;
    }

    setFailedAttempts(prev => prev + 1);
    return false;
  }, []);

  const register = useCallback((data: RegisteredUser): { success: boolean; error?: string } => {
    const normalizedEmail = data.email.toLowerCase();

    // Check if email already exists in mock users
    if (MOCK_USERS[normalizedEmail]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Check if email already exists in registered users
    const existing = loadRegisteredUsers();
    if (existing.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const updated = [...existing, { ...data, email: normalizedEmail }];
    saveRegisteredUsers(updated);

    // Auto sign in after registration
    setUser({
      name: data.name,
      email: normalizedEmail,
      role: data.role,
      initials: getInitials(data.name),
    });
    setFailedAttempts(0);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setFailedAttempts(0);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, register, logout, failedAttempts, sidebarCollapsed, setSidebarCollapsed,
      vehicles, setVehicles,
      drivers, setDrivers,
      trips, setTrips,
      maintenance, setMaintenance,
      fuelLogs, setFuelLogs,
      expenses, setExpenses,
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
