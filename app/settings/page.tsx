'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const settingsSchema = z.object({
  depotName: z.string().min(1, 'Required'),
  currency: z.string().min(1, 'Required'),
  distanceUnit: z.string().min(1, 'Required'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const RBAC_DATA = [
  {
    role: 'Fleet Manager',
    fleet: 'full', drivers: 'full', trips: 'none', fuel: 'none', analytics: 'full',
  },
  {
    role: 'Dispatcher',
    fleet: 'view', drivers: 'none', trips: 'full', fuel: 'none', analytics: 'none',
  },
  {
    role: 'Safety Officer',
    fleet: 'none', drivers: 'full', trips: 'view', fuel: 'none', analytics: 'none',
  },
  {
    role: 'Financial Analyst',
    fleet: 'view', drivers: 'none', trips: 'none', fuel: 'full', analytics: 'full',
  },
];

function AccessCell({ value }: { value: string }) {
  if (value === 'full') {
    return (
      <div className="flex items-center justify-center gap-1 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold">Full</span>
      </div>
    );
  }
  if (value === 'view') {
    return (
      <div className="flex justify-center">
        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
          View
        </span>
      </div>
    );
  }
  return <div className="text-center text-slate-300 text-base font-light select-none">—</div>;
}

export default function SettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [distUnit, setDistUnit] = useState('km');

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { depotName: 'Main Depot', currency: 'USD', distanceUnit: 'km' },
  });

  function onSubmit(data: SettingsForm) {
    toast.success('Settings saved', { description: `Depot: ${data.depotName} · ${data.currency} · ${data.distanceUnit}` });
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Platform configuration and access control</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">General</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="depotName" className="text-sm font-medium">Depot Name *</Label>
                <Input id="depotName" {...register('depotName')} placeholder="Main Depot" className="h-10 rounded-lg" />
                {errors.depotName && <p className="text-xs text-red-600">{errors.depotName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Currency</Label>
                <Select defaultValue="USD" onValueChange={val => setCurrency(val)}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                    <SelectItem value="CAD">CAD — Canadian Dollar (C$)</SelectItem>
                    <SelectItem value="AUD">AUD — Australian Dollar (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Distance Unit</Label>
                <Select defaultValue="km" onValueChange={val => setDistUnit(val)}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full h-10 rounded-lg cursor-pointer">Save Changes</Button>
            </form>
          </div>

          {/* RBAC Table */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Role-Based Access (RBAC)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Access levels by role across modules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="w-40">Role</th>
                    {['Fleet', 'Drivers', 'Trips', 'Fuel/Exp', 'Analytics'].map(h => (
                      <th key={h} className="text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RBAC_DATA.map(row => (
                    <tr key={row.role}>
                      <td className="font-medium text-slate-800 text-sm">{row.role}</td>
                      <td className="text-center"><AccessCell value={row.fleet} /></td>
                      <td className="text-center"><AccessCell value={row.drivers} /></td>
                      <td className="text-center"><AccessCell value={row.trips} /></td>
                      <td className="text-center"><AccessCell value={row.fuel} /></td>
                      <td className="text-center"><AccessCell value={row.analytics} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full access</span>
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 text-[11px]">View</span>
                View only
              </span>
              <span className="flex items-center gap-1"><span className="text-slate-300">—</span> No access</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
