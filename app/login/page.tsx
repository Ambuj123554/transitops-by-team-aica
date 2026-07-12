'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bus, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/lib/app-context';
import { Role } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as const),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_ACCESS: Record<Role, string> = {
  'Fleet Manager': 'Fleet, Drivers, Maintenance, Analytics',
  'Dispatcher': 'Dashboard, Trips (full), Fleet & Drivers (view)',
  'Safety Officer': 'Drivers (full), Trips (view)',
  'Financial Analyst': 'Fuel & Expenses, Analytics, Fleet & Analytics (view)',
};

export default function LoginPage() {
  const { login, failedAttempts } = useApp();
  const router = useRouter();
  const [loginError, setLoginError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Dispatcher');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Dispatcher', rememberMe: false },
  });

  const locked = failedAttempts >= 5;

  async function onSubmit(data: FormData) {
    setLoginError('');
    const ok = login(data.email, data.password, data.role);
    if (ok) {
      router.push('/dashboard');
    } else {
      setLoginError('Invalid credentials. Please check your email and password.');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left column */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TransitOps</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Smart Transport<br />Operations Platform
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Streamline fleet management, dispatch, compliance, and analytics in one unified platform.
          </p>

          <div>
            <p className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">One login, four roles:</p>
            <ul className="space-y-3">
              {(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as Role[]).map(role => (
                <li key={role} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span className="text-slate-300">{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-slate-600 text-sm">Use demo@transitops.com / demo to sign in</p>
      </div>

      {/* Right column */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials below to continue</p>
          </div>

          {locked ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Account Temporarily Locked</h3>
              <p className="text-slate-500 text-sm">
                Too many failed sign-in attempts. Please contact your system administrator to unlock your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {loginError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-400' : ''}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-red-400' : ''}
                />
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Sign in as</Label>
                <Select
                  defaultValue="Dispatcher"
                  onValueChange={val => {
                    setValue('role', val as Role);
                    setSelectedRole(val as Role);
                  }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                    <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="Safety Officer">Safety Officer</SelectItem>
                    <SelectItem value="Financial Analyst">Financial Analyst</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" onCheckedChange={val => setValue('rememberMe', !!val)} />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                </div>
                <button type="button" className="text-sm text-blue-600 hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Sign In
              </Button>

              {failedAttempts > 0 && failedAttempts < 5 && (
                <p className="text-xs text-amber-600 text-center">
                  {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining before account lock
                </p>
              )}
            </form>
          )}

          {!locked && (
            <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Role access summary</p>
              <ul className="space-y-1.5">
                {(Object.entries(ROLE_ACCESS) as [Role, string][]).map(([role, access]) => (
                  <li
                    key={role}
                    className={`text-xs flex gap-1.5 ${selectedRole === role ? 'text-slate-900 font-medium' : 'text-slate-500'}`}
                  >
                    <span className="font-semibold">{role}:</span>
                    <span>{access}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
