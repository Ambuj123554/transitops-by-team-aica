'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, Role, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from '@/lib/types';
import {
  mockVehicles, mockDrivers, mockTrips,
  mockMaintenance, mockFuelLogs, mockExpenses,
} from '@/lib/mock-data';

interface AppContextType {
  user: AppUser | null;
  login: (email: string, password: string, role: Role) => boolean;
  logout: () => void;
  failedAttempts: number;

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

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(mockMaintenance);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(mockFuelLogs);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  const login = useCallback((email: string, password: string, role: Role): boolean => {
    const found = MOCK_USERS[email.toLowerCase()];
    if (found && found.password === password) {
      setUser({ name: found.name, email, role, initials: getInitials(found.name) });
      setFailedAttempts(0);
      return true;
    }
    setFailedAttempts(prev => prev + 1);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setFailedAttempts(0);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout, failedAttempts,
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
