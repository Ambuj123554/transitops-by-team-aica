'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search } from 'lucide-react';
import { FuelLog, Expense } from '@/lib/types';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().positive(),
});

const expenseSchema = z.object({
  tripId: z.string().min(1, 'Required'),
  vehicleId: z.string().min(1, 'Required'),
  toll: z.coerce.number().min(0),
  other: z.coerce.number().min(0),
});

type FuelFormData = z.infer<typeof fuelSchema>;
type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function FuelPage() {
  const { vehicles, trips, fuelLogs, setFuelLogs, expenses, setExpenses, maintenance } = useApp();
  const [search, setSearch] = useState('');
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [expVehicle, setExpVehicle] = useState('');
  const [expTrip, setExpTrip] = useState('');

  const fuelForm = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });
  const expForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const tripMap = Object.fromEntries(trips.map(t => [t.id, t]));

  const filteredFuel = fuelLogs.filter(f => {
    const v = vehicleMap[f.vehicleId];
    return !search || v?.regNo.toLowerCase().includes(search.toLowerCase());
  });

  const filteredExpenses = expenses.filter(e => {
    const v = vehicleMap[e.vehicleId];
    return !search || v?.regNo.toLowerCase().includes(search.toLowerCase()) || e.tripId.toLowerCase().includes(search.toLowerCase());
  });

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaint = maintenance.reduce((s, m) => s + m.cost, 0);
  const totalOps = totalFuel + totalMaint;

  function onFuelSubmit(data: FuelFormData) {
    setFuelLogs(prev => [{ id: `f${Date.now()}`, ...data }, ...prev]);
    toast.success('Fuel log added');
    fuelForm.reset();
    setFuelVehicle('');
    setFuelOpen(false);
  }

  function onExpenseSubmit(data: ExpenseFormData) {
    const total = data.toll + data.other;
    setExpenses(prev => [{
      id: `e${Date.now()}`,
      ...data,
      maintLinked: false,
      total,
    }, ...prev]);
    toast.success('Expense logged');
    expForm.reset();
    setExpVehicle('');
    setExpTrip('');
    setExpenseOpen(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Fuel & Expenses</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fuel consumption and operational cost tracking</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by vehicle or trip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Fuel Logs */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Fuel Logs</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer" onClick={() => setFuelOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Log Fuel
              </Button>
              <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => setExpenseOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Vehicle', 'Date', 'Liters', 'Cost'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFuel.map(f => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{vehicleMap[f.vehicleId]?.regNo ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{f.date}</td>
                    <td className="px-4 py-3 text-slate-600">{f.liters} L</td>
                    <td className="px-4 py-3 text-slate-600">${f.cost.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredFuel.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No fuel logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Other Expenses (Toll / Misc)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Trip', 'Vehicle', 'Toll', 'Other', 'Maint. Linked', 'Total'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{e.tripId}</td>
                    <td className="px-4 py-3 text-slate-600">{vehicleMap[e.vehicleId]?.regNo ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">${e.toll}</td>
                    <td className="px-4 py-3 text-slate-600">${e.other}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.maintLinked ? 'Active' : 'Completed'} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">${e.total}</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">No expenses logged</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Row */}
        <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-500">Total Operational Cost (Auto) = Fuel + Maintenance</p>
              <p className="text-xs text-slate-400 mt-0.5">Fuel: ${totalFuel.toLocaleString()} + Maint: ${totalMaint.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-slate-900">${totalOps.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total operational cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Fuel Modal */}
      <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Fuel</DialogTitle></DialogHeader>
          <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={fuelVehicle} onValueChange={val => { fuelForm.setValue('vehicleId', val); setFuelVehicle(val); }}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.regNo} — {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input {...fuelForm.register('date')} type="date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Liters *</Label>
                <Input {...fuelForm.register('liters')} type="number" step="0.1" placeholder="100" />
              </div>
              <div className="space-y-1.5">
                <Label>Cost ($) *</Label>
                <Input {...fuelForm.register('cost')} type="number" step="0.01" placeholder="180" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFuelOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" className="cursor-pointer">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={expForm.handleSubmit(onExpenseSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trip ID *</Label>
              <Select value={expTrip} onValueChange={val => { expForm.setValue('tripId', val); setExpTrip(val); }}>
                <SelectTrigger><SelectValue placeholder="Select trip" /></SelectTrigger>
                <SelectContent>
                  {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.id} — {t.source} → {t.destination}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={expVehicle} onValueChange={val => { expForm.setValue('vehicleId', val); setExpVehicle(val); }}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.regNo} — {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Toll ($)</Label>
                <Input {...expForm.register('toll')} type="number" step="0.01" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Other ($)</Label>
                <Input {...expForm.register('other')} type="number" step="0.01" placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" className="cursor-pointer">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
