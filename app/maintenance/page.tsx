'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Info } from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus } from '@/lib/types';
import { toast } from 'sonner';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceType: z.string().min(1, 'Required'),
  cost: z.coerce.number().positive('Must be > 0'),
  date: z.string().min(1, 'Required'),
  status: z.enum(['Active', 'Completed'] as const),
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;

export default function MaintenancePage() {
  const { vehicles, setVehicles, maintenance, setMaintenance } = useApp();
  const [statusVehicle, setStatusVehicle] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { status: 'Active', date: new Date().toISOString().split('T')[0] },
  });

  const formStatus = watch('status');

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  function onSubmit(data: MaintenanceForm) {
    const record: MaintenanceRecord = { id: `m${Date.now()}`, ...data };
    setMaintenance(prev => [record, ...prev]);

    if (data.status === 'Active') {
      setVehicles(prev => prev.map(v =>
        v.id === data.vehicleId ? { ...v, status: 'In Shop' } : v
      ));
    } else {
      const vehicle = vehicleMap[data.vehicleId];
      if (vehicle?.status === 'In Shop') {
        setVehicles(prev => prev.map(v =>
          v.id === data.vehicleId ? { ...v, status: 'Available' } : v
        ));
      }
    }

    toast.success('Service record saved');
    reset({ status: 'Active', date: new Date().toISOString().split('T')[0] });
    setStatusVehicle('');
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">Service records and vehicle status tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Form */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Log Service Record</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Vehicle *</Label>
                <Select
                  value={statusVehicle}
                  onValueChange={val => { setValue('vehicleId', val); setStatusVehicle(val); }}
                >
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.regNo} — {v.name}
                        <span className={`ml-2 text-xs ${v.status === 'In Shop' ? 'text-amber-600' : 'text-slate-400'}`}>
                          ({v.status})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && <p className="text-xs text-red-600">{errors.vehicleId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Service Type *</Label>
                <Input {...register('serviceType')} placeholder="e.g. Oil Change, Brake Service" className="h-10 rounded-lg" />
                {errors.serviceType && <p className="text-xs text-red-600">{errors.serviceType.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cost ($) *</Label>
                  <Input {...register('cost')} type="number" step="0.01" placeholder="500" className="h-10 rounded-lg" />
                  {errors.cost && <p className="text-xs text-red-600">{errors.cost.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Date *</Label>
                  <Input {...register('date')} type="date" className="h-10 rounded-lg" />
                  {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  defaultValue="Active"
                  onValueChange={val => setValue('status', val as MaintenanceStatus)}
                >
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active (In Shop)</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full h-10 rounded-lg cursor-pointer">Save Service Record</Button>
            </form>

            {/* Status transition rules */}
            <div className="px-5 pb-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Transitions</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">Available</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs">(create active record)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200/60">In Shop</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200/60">In Shop</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs">(close record)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">Available</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400">In Shop vehicles are removed from the dispatch pool</p>
              </div>
            </div>
          </div>

          {/* Service Log */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Service Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    {['Vehicle', 'Service', 'Cost', 'Date', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map(r => {
                    const vehicle = vehicleMap[r.vehicleId];
                    return (
                      <tr key={r.id}>
                        <td className="font-medium text-slate-700">{vehicle?.regNo ?? '—'}</td>
                        <td>{r.serviceType}</td>
                        <td>${r.cost.toLocaleString()}</td>
                        <td className="text-xs">{r.date}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    );
                  })}
                  {maintenance.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No service records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
