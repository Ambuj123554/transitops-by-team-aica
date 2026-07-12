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
import { CheckCircle2, Eye, Ban } from 'lucide-react';
import { ROLE_PERMISSIONS, type Role } from '@/lib/types';

const settingsSchema = z.object({
  depotName: z.string().min(1, 'Required'),
  currency: z.string().min(1, 'Required'),
  distanceUnit: z.string().min(1, 'Required'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const MODULE_LABELS: Record<string, { label: string; short: string; desc: string }> = {
  fleet:     { label: 'Fleet',     short: 'Fleet',  desc: 'Vehicle management' },
  drivers:   { label: 'Drivers',   short: 'Driv',   desc: 'Driver records' },
  trips:     { label: 'Trips',     short: 'Trips',  desc: 'Trip operations' },
  fuel:      { label: 'Fuel/Exp',  short: 'Fuel',   desc: 'Fuel & expenses' },
  analytics: { label: 'Analytics', short: 'Analyt', desc: 'Reports & KPIs' },
};

const MODULE_KEYS = Object.keys(MODULE_LABELS);

const RBAC_DATA = (Object.entries(ROLE_PERMISSIONS) as [Role, Record<string, 'full' | 'view' | 'none'>][]).map(
  ([role, perms]) => ({
    role,
    ...perms,
  })
);

const ROLE_ORDER: Role[] = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

function AccessCell({ value }: { value: string }) {
  if (value === 'full') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-sm shadow-emerald-100/30">
          <CheckCircle2 className="w-3 h-3" />
          Full
        </span>
      </div>
    );
  }
  if (value === 'view') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-blue-50 text-blue-600 border border-blue-200/70 shadow-sm shadow-blue-100/30">
          <Eye className="w-3 h-3" />
          View
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-slate-400 bg-slate-50 border border-slate-200/50 select-none">
        <Ban className="w-3 h-3" />
        None
      </span>
    </div>
  );
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="card-modern lg:col-span-2">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Role-Based Access (RBAC)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Access levels by role across modules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern w-full">
                <thead>
                  <tr>
                    <th className="w-36 text-left pl-4">Role</th>
                    {MODULE_KEYS.map(key => {
                      const info = MODULE_LABELS[key];
                      return (
                        <th
                          key={key}
                          className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                          title={info.desc}
                        >
                          <span className="hidden sm:inline">{info.label}</span>
                          <span className="sm:hidden">{info.short}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ROLE_ORDER.map(role => {
                    const row = RBAC_DATA.find(r => r.role === role)!;
                    return (
                      <tr
                        key={role}
                        className="group transition-colors hover:bg-slate-50/60"
                      >
                        <td className="pl-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 text-sm">
                              {role}
                            </span>
                          </div>
                        </td>
                        {MODULE_KEYS.map(key => (
                          <td key={key} className="text-center px-2 py-3">
                            <AccessCell value={(row as any)[key]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full access — create, edit, delete</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View only — read data</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-slate-400" />
                <span>No access — hidden</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 card-modern">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Access Summary</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLE_ORDER.map(role => {
                const perms = ROLE_PERMISSIONS[role];
                const accessible = (Object.entries(perms) as [string, 'full' | 'view' | 'none'][])
                  .filter(([, v]) => v !== 'none')
                  .map(([k, v]) => ({ module: MODULE_LABELS[k]?.label ?? k, level: v }));
                return (
                  <div key={role} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{role}</p>
                        <p className="text-[11px] text-slate-400">{accessible.length} module{accessible.length !== 1 ? 's' : ''} accessible</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {accessible.length === 0 ? (
                        <p className="text-xs text-slate-300 italic">No modules accessible</p>
                      ) : (
                        accessible.map(({ module, level }) => (
                          <div key={module} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{module}</span>
                            <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${
                              level === 'full'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {level === 'full' ? 'Full' : 'View'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
