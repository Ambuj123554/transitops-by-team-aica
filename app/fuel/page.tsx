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
  const { vehicles, trips, fuelLogs, expenses, maintenance, createFuelLog, createExpense } = useApp();
  const [search, setSearch] = useState('');
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [expVehicle, setExpVehicle] = useState('');
  const [expTrip, setExpTrip] = useState('');
  const [fuelSubmitting, setFuelSubmitting] = useState(false);
  const [expSubmitting, setExpSubmitting] = useState(false);

  const fuelForm = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });
  const expForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

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

  async function onFuelSubmit(data: FuelFormData) {
    setFuelSubmitting(true);
    try {
      await createFuelLog(data);
      toast.success('Fuel log added');
      fuelForm.reset();
      setFuelVehicle('');
      setFuelOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log fuel');
    } finally {
      setFuelSubmitting(false);
    }
  }

  async function onExpenseSubmit(data: ExpenseFormData) {
    setExpSubmitting(true);
    try {
      await createExpense(data);
      toast.success('Expense logged');
      expForm.reset();
      setExpVehicle('');
      setExpTrip('');
      setExpenseOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log expense');
    } finally {
      setExpSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Fuel & Expenses</h1>
            <p className="page-subtitle">Fuel consumption and operational cost tracking</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by vehicle or trip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>

        {/* Fuel Logs */}
        <div className="card-modern">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Fuel Logs</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-lg cursor-pointer" onClick={() => setFuelOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Log Fuel
              </Button>
              <Button size="sm" className="gap-1.5 rounded-lg cursor-pointer" onClick={() => setExpenseOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {['Vehicle', 'Date', 'Liters', 'Cost'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFuel.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium text-slate-700">{vehicleMap[f.vehicleId]?.regNo ?? '—'}</td>
                    <td className="text-xs">{f.date}</td>
                    <td>{f.liters} L</td>
                    <td>${f.cost.toLocaleString()}</td>
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
        <div className="card-modern">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Other Expenses (Toll / Misc)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {['Trip', 'Vehicle', 'Toll', 'Other', 'Maint. Linked', 'Total'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs font-semibold text-slate-700">{e.tripId}</td>
                    <td>{vehicleMap[e.vehicleId]?.regNo ?? '—'}</td>
                    <td>${e.toll}</td>
                    <td>${e.other}</td>
                    <td>
                      <StatusBadge status={e.maintLinked ? 'Active' : 'Completed'} />
                    </td>
                    <td className="font-semibold text-slate-900">${e.total}</td>
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
        <div className="card-modern px-5 py-5">
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
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Log Fuel</DialogTitle></DialogHeader>
          <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Vehicle *</Label>
              <Select value={fuelVehicle} onValueChange={val => { fuelForm.setValue('vehicleId', val); setFuelVehicle(val); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.regNo} — {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date *</Label>
              <Input {...fuelForm.register('date')} type="date" className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Liters *</Label>
                <Input {...fuelForm.register('liters')} type="number" step="0.1" placeholder="100" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Cost ($) *</Label>
                <Input {...fuelForm.register('cost')} type="number" step="0.01" placeholder="180" className="rounded-lg" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFuelOpen(false)} className="rounded-lg cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={fuelSubmitting} className="rounded-lg cursor-pointer">{fuelSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={expForm.handleSubmit(onExpenseSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Trip ID *</Label>
              <Select value={expTrip} onValueChange={val => { expForm.setValue('tripId', val); setExpTrip(val); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select trip" /></SelectTrigger>
                <SelectContent>
                  {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.id} — {t.source} → {t.destination}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Vehicle *</Label>
              <Select value={expVehicle} onValueChange={val => { expForm.setValue('vehicleId', val); setExpVehicle(val); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.regNo} — {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Toll ($)</Label>
                <Input {...expForm.register('toll')} type="number" step="0.01" placeholder="0" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Other ($)</Label>
                <Input {...expForm.register('other')} type="number" step="0.01" placeholder="0" className="rounded-lg" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)} className="rounded-lg cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={expSubmitting} className="rounded-lg cursor-pointer">{expSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
