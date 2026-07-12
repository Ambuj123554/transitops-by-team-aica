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
      <div className="flex items-center gap-1 text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">Full</span>
      </div>
    );
  }
  if (value === 'view') {
    return (
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
        View
      </span>
    );
  }
  return <span className="text-slate-300 text-base font-light select-none">—</span>;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform configuration and access control</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">General</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="depotName">Depot Name *</Label>
                <Input id="depotName" {...register('depotName')} placeholder="Main Depot" />
                {errors.depotName && <p className="text-xs text-red-600">{errors.depotName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  defaultValue="USD"
                  onValueChange={val => { setCurrency(val); }}
                >
                  <SelectTrigger>
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
                <Label>Distance Unit</Label>
                <Select
                  defaultValue="km"
                  onValueChange={val => { setDistUnit(val); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full cursor-pointer">Save Changes</Button>
            </form>
          </div>

          {/* RBAC Table */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Role-Based Access (RBAC)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Access levels by role across modules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Role</th>
                    {['Fleet', 'Drivers', 'Trips', 'Fuel/Exp', 'Analytics'].map(h => (
                      <th key={h} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RBAC_DATA.map(row => (
                    <tr key={row.role} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 text-sm">{row.role}</td>
                      <td className="px-3 py-3 text-center"><AccessCell value={row.fleet} /></td>
                      <td className="px-3 py-3 text-center"><AccessCell value={row.drivers} /></td>
                      <td className="px-3 py-3 text-center"><AccessCell value={row.trips} /></td>
                      <td className="px-3 py-3 text-center"><AccessCell value={row.fuel} /></td>
                      <td className="px-3 py-3 text-center"><AccessCell value={row.analytics} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" /> Full access</span>
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs">View</span>
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
