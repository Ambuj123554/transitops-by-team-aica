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
import { Plus, AlertTriangle, Info } from 'lucide-react';
import { Driver, DriverStatus } from '@/lib/types';
import { toast } from 'sonner';

const driverSchema = z.object({
  name: z.string().min(1, 'Required'),
  licenseNo: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  expiry: z.string().min(1, 'Required'),
  contact: z.string().min(1, 'Required'),
  safetyScore: z.coerce.number().min(0).max(100),
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended'] as const),
});

type DriverForm = z.infer<typeof driverSchema>;

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

function SafetyBadge({ score }: { score: number }) {
  const style = score >= 85
    ? 'bg-green-100 text-green-800 border-green-200'
    : score >= 70
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {score}
    </span>
  );
}

export default function DriversPage() {
  const { drivers, setDrivers } = useApp();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: { status: 'Available', safetyScore: 80 },
  });

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNo.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    reset({ status: 'Available', safetyScore: 80 });
    setOpen(true);
  }

  function onSubmit(data: DriverForm) {
    const newDriver: Driver = {
      id: `d${Date.now()}`,
      tripCompletion: 0,
      ...data,
    };
    setDrivers(prev => [...prev, newDriver]);
    toast.success('Driver profile created');
    setOpen(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Drivers & Safety</h1>
            <p className="text-sm text-slate-500 mt-0.5">Driver profiles and safety compliance</p>
          </div>
          <Button onClick={openAdd} className="gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Driver
          </Button>
        </div>

        <Input
          placeholder="Search by name or license number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 h-8 text-sm"
        />

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Driver', 'License No.', 'Category', 'Expiry', 'Contact', 'Trip Compl.', 'Safety', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const expired = isExpired(d.expiry);
                  return (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.licenseNo}</td>
                      <td className="px-4 py-3 text-slate-600">{d.category}</td>
                      <td className="px-4 py-3">
                        <span className={expired ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {d.expiry}
                          {expired && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-bold">
                              <AlertTriangle className="w-3 h-3" /> EXPIRED
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.contact}</td>
                      <td className="px-4 py-3 text-slate-600">{d.tripCompletion}%</td>
                      <td className="px-4 py-3"><SafetyBadge score={d.safetyScore} /></td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No drivers found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-4">
            {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <StatusBadge status={s} />
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-100 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              Expired license or Suspended status → blocked from trip assignment
            </p>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name *</Label>
                <Input {...register('name')} placeholder="John Doe" />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>License Number *</Label>
                <Input {...register('licenseNo')} placeholder="DL-XXXXXXXX" />
                {errors.licenseNo && <p className="text-xs text-red-600">{errors.licenseNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>License Category *</Label>
                <Input {...register('category')} placeholder="Class A" />
                {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>License Expiry Date *</Label>
                <Input {...register('expiry')} type="date" />
                {errors.expiry && <p className="text-xs text-red-600">{errors.expiry.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number *</Label>
                <Input {...register('contact')} placeholder="+1-555-0100" />
                {errors.contact && <p className="text-xs text-red-600">{errors.contact.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Safety Score (0–100)</Label>
                <Input {...register('safetyScore')} type="number" min={0} max={100} />
                {errors.safetyScore && <p className="text-xs text-red-600">{errors.safetyScore.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue="Available" onValueChange={val => setValue('status', val as DriverStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" className="cursor-pointer">Add Driver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
