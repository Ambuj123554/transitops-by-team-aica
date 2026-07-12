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
  const formVehicleId = watch('vehicleId');

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  function onSubmit(data: MaintenanceForm) {
    const record: MaintenanceRecord = { id: `m${Date.now()}`, ...data };
    setMaintenance(prev => [record, ...prev]);

    // Update vehicle status based on service record
    if (data.status === 'Active') {
      setVehicles(prev => prev.map(v =>
        v.id === data.vehicleId ? { ...v, status: 'In Shop' } : v
      ));
    } else {
      // Completed — return to Available if it was In Shop
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
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Service records and vehicle status tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Form */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Log Service Record</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Vehicle *</Label>
                <Select
                  value={statusVehicle}
                  onValueChange={val => { setValue('vehicleId', val); setStatusVehicle(val); }}
                >
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
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
                <Label>Service Type *</Label>
                <Input {...register('serviceType')} placeholder="e.g. Oil Change, Brake Service" />
                {errors.serviceType && <p className="text-xs text-red-600">{errors.serviceType.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cost ($) *</Label>
                  <Input {...register('cost')} type="number" step="0.01" placeholder="500" />
                  {errors.cost && <p className="text-xs text-red-600">{errors.cost.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input {...register('date')} type="date" />
                  {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  defaultValue="Active"
                  onValueChange={val => setValue('status', val as MaintenanceStatus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active (In Shop)</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full cursor-pointer">Save Service Record</Button>
            </form>

            {/* Status transition rules */}
            <div className="px-5 pb-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Transitions</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">Available</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs">(create active record)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">In Shop</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">In Shop</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs">(close record)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">Available</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400">In Shop vehicles are removed from the dispatch pool</p>
              </div>
            </div>
          </div>

          {/* Service Log */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Service Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Vehicle', 'Service', 'Cost', 'Date', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map(r => {
                    const vehicle = vehicleMap[r.vehicleId];
                    return (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">{vehicle?.regNo ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{r.serviceType}</td>
                        <td className="px-4 py-3 text-slate-600">${r.cost.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{r.date}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
