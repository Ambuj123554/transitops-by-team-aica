import type { Vehicle, Driver, Trip, MaintenanceRecord, FuelLog } from '@/lib/types';

export interface Insight {
  id: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  title: string;
  description: string;
  priority: number; // higher = show first
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function computeInsights(
  vehicles: Vehicle[],
  drivers: Driver[],
  trips: Trip[],
  maintenance: MaintenanceRecord[],
  fuelLogs: FuelLog[]
): Insight[] {
  const insights: Insight[] = [];

  // ── 1. License expiring soon ─────────────────────────────────────────
  const expiringDrivers = drivers
    .filter(d => {
      const days = daysUntil(d.expiry);
      return days > 0 && days <= 30;
    })
    .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))
    .slice(0, 3);

  for (const driver of expiringDrivers) {
    const days = daysUntil(driver.expiry);
    const type = days <= 7 ? 'alert' : 'warning';      insights.push({
        id: `license-${driver.id}`,
        type,
        title: `License expiring ${days <= 7 ? 'soon' : 'this month'}`,
        description: `${driver.name}'s license (${driver.licenseNo}) expires in ${days} day${days !== 1 ? 's' : ''}. Expiry: ${driver.expiry}`,
        priority: 100 - days,
      });
  }

  // ── 2. Highest maintenance cost vehicle ──────────────────────────────
  if (maintenance.length > 0) {
    const maintCostByVehicle = new Map<string, number>();
    for (const m of maintenance) {
      maintCostByVehicle.set(m.vehicleId, (maintCostByVehicle.get(m.vehicleId) ?? 0) + m.cost);
    }

    let topVehicleId = '';
    let topCost = 0;
    Array.from(maintCostByVehicle.entries()).forEach(([vid, cost]) => {
      if (cost > topCost) {
        topCost = cost;
        topVehicleId = vid;
      }
    });

    const topVehicle = vehicles.find(v => v.id === topVehicleId);
    if (topVehicle && topCost > 1000) {
      insights.push({
        id: 'maint-top',
        type: 'warning',
        title: 'Highest maintenance cost',
        description: `${topVehicle.regNo} (${topVehicle.name}) has accumulated $${topCost.toLocaleString()} in maintenance costs — the highest in the fleet.`,
        priority: 90,
      });
    }

    // Active maintenance items
    const activeMaint = maintenance.filter(m => m.status === 'Active');
    if (activeMaint.length > 0) {
      insights.push({
        id: 'maint-active',
        type: 'info',
        title: `${activeMaint.length} vehicle${activeMaint.length > 1 ? 's' : ''} in maintenance`,
        description: `${activeMaint.length} vehicle${activeMaint.length > 1 ? 's are' : ' is'} currently in the shop. Total estimated cost: $${activeMaint.reduce((s, m) => s + m.cost, 0).toLocaleString()}.`,
        priority: 75,
      });
    }
  }

  // ── 3. Fleet utilization ────────────────────────────────────────────
  const nonRetired = vehicles.filter(v => v.status !== 'Retired').length;
  const activeOnTrip = vehicles.filter(v => v.status === 'On Trip').length;
  const utilizationPct = nonRetired > 0 ? Math.round((activeOnTrip / nonRetired) * 100) : 0;

  const availableVehicles = vehicles.filter(v => v.status === 'Available');

  if (utilizationPct < 40) {      insights.push({
        id: 'utilization-low',
        type: 'warning',
        title: `Fleet utilization at ${utilizationPct}%`,
      description: `Only ${activeOnTrip} of ${nonRetired} vehicles are active. ${availableVehicles.length} vehicle${availableVehicles.length !== 1 ? 's are' : ' is'} available for dispatch.`,
      priority: 80,
    });
  } else if (utilizationPct > 85) {      insights.push({
        id: 'utilization-high',
        type: 'info',
        title: `Fleet utilization at ${utilizationPct}%`,
      description: `Fleet is highly utilized with ${activeOnTrip} of ${nonRetired} vehicles on the road. Monitor for maintenance scheduling.`,
      priority: 60,
    });
  }

  // ── 4. Suggest best vehicle for next trip ────────────────────────────
  if (availableVehicles.length > 0) {
    const lowestUtilized = availableVehicles
      .map(v => {
        const tripCount = trips.filter(t => t.vehicleId === v.id).length;
        return { ...v, tripCount };
      })
      .sort((a, b) => a.tripCount - b.tripCount)
      .slice(0, 2);

    for (const v of lowestUtilized) {
      insights.push({
        id: `suggest-${v.id}`,
        type: 'success',
        title: 'Underutilized vehicle available',
        description: `${v.regNo} (${v.name}, ${v.capacity.toLocaleString()} kg capacity) has only been used on a few trips. Consider assigning for next dispatch to balance fleet usage.`,
        priority: 50,
      });
    }
  }

  // ── 5. Fuel consumption anomaly ──────────────────────────────────────
  if (fuelLogs.length >= 3) {
    const avgCostPerLiter =
      fuelLogs.reduce((s, f) => s + f.cost, 0) / fuelLogs.reduce((s, f) => s + f.liters, 0) || 0;

    // Find vehicles with above-average fuel cost per trip
    const fuelByVehicle = new Map<string, { liters: number; cost: number }>();
    for (const f of fuelLogs) {
      const cur = fuelByVehicle.get(f.vehicleId) ?? { liters: 0, cost: 0 };
      cur.liters += f.liters;
      cur.cost += f.cost;
      fuelByVehicle.set(f.vehicleId, cur);
    }

    Array.from(fuelByVehicle.entries()).forEach(([vid, data]) => {
      if (data.liters > 0) {
        const vehicleCostPerL = data.cost / data.liters;
        if (vehicleCostPerL > avgCostPerLiter * 1.15 && avgCostPerLiter > 0) {
          const vehicle = vehicles.find(v => v.id === vid);
          if (vehicle) {
            const pctAbove = Math.round(((vehicleCostPerL / avgCostPerLiter) - 1) * 100);
            insights.push({
              id: `fuel-${vid}`,
              type: 'warning',
              title: `Fuel cost ${pctAbove}% above fleet average`,
              description: `${vehicle.regNo}'s fuel cost per liter is ${pctAbove}% higher than the fleet average ($${avgCostPerLiter.toFixed(2)}/L). Consider maintenance check.`,
              priority: 70,
            });
          }
        }
      }
    });
  }

  // ── 6. Maintenance overdue / upcoming ────────────────────────────────
  if (maintenance.length > 0) {
    const upcomingMaint = maintenance
      .filter(m => m.status === 'Completed' && daysUntil(m.date) < -60)
      .slice(0, 3);

    for (const m of upcomingMaint) {
      const vehicle = vehicles.find(v => v.id === m.vehicleId);
      if (vehicle) {
        insights.push({
          id: `maint-due-${m.id}`,
          type: 'alert',
          title: 'Maintenance follow-up recommended',
          description: `${vehicle.regNo} had a "${m.serviceType}" ${Math.abs(daysUntil(m.date))} days ago. Schedule a follow-up check.`,
          priority: 65,
        });
      }
    }
  }

  // ── 7. Drivers available vs needed ───────────────────────────────────
  const availableDrivers = drivers.filter(d => d.status === 'Available').length;
  const pendingTrips = trips.filter(t => t.status === 'Draft' || t.status === 'Pending Approval').length;

  if (availableDrivers === 0 && pendingTrips > 0) {      insights.push({
        id: 'no-drivers',
        type: 'alert',
        title: 'No available drivers',
      description: `There ${pendingTrips > 1 ? 'are' : 'is'} ${pendingTrips} pending trip${pendingTrips > 1 ? 's' : ''} but no drivers available. Check driver schedules for availability.`,
      priority: 95,
    });
  }

  // Sort by priority (highest first)
  insights.sort((a, b) => b.priority - a.priority);

  // Limit to top 8
  return insights.slice(0, 8);
}
