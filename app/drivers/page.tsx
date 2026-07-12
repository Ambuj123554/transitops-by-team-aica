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
import { DriverStatus } from '@/lib/types';
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
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    : score >= 70
    ? 'bg-amber-50 text-amber-700 border-amber-200/60'
    : 'bg-red-50 text-red-700 border-red-200/60';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${style}`}>
      {score}
    </span>
  );
}

export default function DriversPage() {
  const { drivers, createDriver } = useApp();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function onSubmit(data: DriverForm) {
    setSubmitting(true);
    try {
      await createDriver(data);
      toast.success('Driver profile created');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Drivers & Safety</h1>
            <p className="page-subtitle">Driver profiles and safety compliance</p>
          </div>
          <Button onClick={openAdd} className="gap-2 rounded-lg cursor-pointer">
            <Plus className="w-4 h-4" /> Add Driver
          </Button>
        </div>

        <Input
          placeholder="Search by name or license number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 h-9 text-sm rounded-lg"
        />

        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {['Driver', 'License No.', 'Category', 'Expiry', 'Contact', 'Trip Compl.', 'Safety', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const expired = isExpired(d.expiry);
                  return (
                    <tr key={d.id}>
                      <td className="font-medium text-slate-900">{d.name}</td>
                      <td className="font-mono text-xs text-slate-600">{d.licenseNo}</td>
                      <td>{d.category}</td>
                      <td>
                        <span className={expired ? 'text-red-600 font-medium' : ''}>
                          {d.expiry}
                          {expired && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-semibold border border-red-200/60">
                              <AlertTriangle className="w-3 h-3" /> EXPIRED
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{d.contact}</td>
                      <td>{d.tripCompletion}%</td>
                      <td><SafetyBadge score={d.safetyScore} /></td>
                      <td><StatusBadge status={d.status} /></td>
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
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center gap-4">
            {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <StatusBadge status={s} />
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-start gap-2 bg-slate-50/30">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">Expired license or Suspended status → blocked from trip assignment</p>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-sm font-medium">Full Name *</Label>
                <Input {...register('name')} placeholder="John Doe" className="rounded-lg" />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">License Number *</Label>
                <Input {...register('licenseNo')} placeholder="DL-XXXXXXXX" className="rounded-lg" />
                {errors.licenseNo && <p className="text-xs text-red-600">{errors.licenseNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">License Category *</Label>
                <Input {...register('category')} placeholder="Class A" className="rounded-lg" />
                {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">License Expiry Date *</Label>
                <Input {...register('expiry')} type="date" className="rounded-lg" />
                {errors.expiry && <p className="text-xs text-red-600">{errors.expiry.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Contact Number *</Label>
                <Input {...register('contact')} placeholder="+1-555-0100" className="rounded-lg" />
                {errors.contact && <p className="text-xs text-red-600">{errors.contact.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Safety Score (0–100)</Label>
                <Input {...register('safetyScore')} type="number" min={0} max={100} className="rounded-lg" />
                {errors.safetyScore && <p className="text-xs text-red-600">{errors.safetyScore.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select defaultValue="Available" onValueChange={val => setValue('status', val as DriverStatus)}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={submitting} className="rounded-lg cursor-pointer">Add Driver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
