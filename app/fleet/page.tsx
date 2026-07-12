'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Info } from 'lucide-react';
import { Vehicle, VehicleStatus } from '@/lib/types';
import { toast } from 'sonner';

const vehicleSchema = z.object({
  regNo: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  capacity: z.coerce.number().positive('Must be positive'),
  odometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().positive('Must be positive'),
  status: z.enum(['Available', 'On Trip', 'In Shop', 'Retired'] as const),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function FleetPage() {
  const { vehicles, setVehicles } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { status: 'Available' },
  });

  const types = Array.from(new Set(vehicles.map(v => v.type)));

  const filtered = vehicles.filter(v => {
    const matchesSearch = v.regNo.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  function openAdd() {
    setEditVehicle(null);
    reset({ status: 'Available' });
    setOpen(true);
  }

  function onSubmit(data: VehicleForm) {
    if (editVehicle) {
      setVehicles(prev => prev.map(v => v.id === editVehicle.id ? { ...editVehicle, ...data } : v));
      toast.success('Vehicle updated');
    } else {
      const duplicate = vehicles.find(v => v.regNo.toLowerCase() === data.regNo.toLowerCase());
      if (duplicate) {
        toast.error('Registration number already exists');
        return;
      }
      const newVehicle: Vehicle = { id: `v${Date.now()}`, ...data };
      setVehicles(prev => [...prev, newVehicle]);
      toast.success('Vehicle added to fleet');
    }
    setOpen(false);
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Fleet</h1>
            <p className="page-subtitle">Vehicle registry and management</p>
          </div>
          <Button onClick={openAdd} className="gap-2 rounded-lg cursor-pointer">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search by reg. no. or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 h-9 text-sm rounded-lg"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 h-9 text-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: All</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9 text-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {['Reg. No.', 'Name / Model', 'Type', 'Capacity (kg)', 'Odometer (km)', 'Acq. Cost', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs font-semibold text-slate-700">{v.regNo}</td>
                    <td className="font-medium text-slate-900">{v.name}</td>
                    <td>{v.type}</td>
                    <td>{v.capacity.toLocaleString()}</td>
                    <td>{v.odometer.toLocaleString()}</td>
                    <td>${v.acquisitionCost.toLocaleString()}</td>
                    <td><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No vehicles match filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">Registration No. must be unique · Retired / In Shop vehicles are hidden from Trip Dispatcher</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Registration Number *</Label>
                <Input {...register('regNo')} placeholder="TRN-XXX" className="rounded-lg" />
                {errors.regNo && <p className="text-xs text-red-600">{errors.regNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Name / Model *</Label>
                <Input {...register('name')} placeholder="Volvo FH16" className="rounded-lg" />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Type *</Label>
                <Input {...register('type')} placeholder="Heavy Truck" className="rounded-lg" />
                {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max Capacity (kg) *</Label>
                <Input {...register('capacity')} type="number" placeholder="20000" className="rounded-lg" />
                {errors.capacity && <p className="text-xs text-red-600">{errors.capacity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Odometer (km)</Label>
                <Input {...register('odometer')} type="number" placeholder="0" className="rounded-lg" />
                {errors.odometer && <p className="text-xs text-red-600">{errors.odometer.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Acquisition Cost ($) *</Label>
                <Input {...register('acquisitionCost')} type="number" placeholder="50000" className="rounded-lg" />
                {errors.acquisitionCost && <p className="text-xs text-red-600">{errors.acquisitionCost.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select defaultValue="Available" onValueChange={val => setValue('status', val as VehicleStatus)}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Trip">On Trip</SelectItem>
                  <SelectItem value="In Shop">In Shop</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg cursor-pointer">Cancel</Button>
              <Button type="submit" className="rounded-lg cursor-pointer">{editVehicle ? 'Update' : 'Add Vehicle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
