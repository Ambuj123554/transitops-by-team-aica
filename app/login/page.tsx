'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Lock, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
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
    const ok = await login(data.email, data.password, data.role);
    if (ok) {
      router.push('/dashboard');
    } else {
      // Show a clear error — the backend sends specific messages like
      // 'Account is locked. Try again in X minute(s).'
      setLoginError(failedAttempts >= 5
        ? 'Account locked due to too many failed attempts. Try again later.'
        : 'Invalid email or password.');
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left column */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground/90 p-12 text-background">
        <div>
          <span className="text-2xl font-semibold tracking-tight">TransitOps</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Smart Transport<br />Operations Platform
          </h1>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Streamline fleet management, dispatch, compliance, and analytics in one unified platform.
          </p>

          <div>
            <p className="text-sm font-semibold text-background/70 mb-4 uppercase tracking-wider">One login, four roles:</p>
            <ul className="space-y-3">
              {(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as Role[]).map(role => (
                <li key={role} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-background/80">{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-background/50 text-sm">Use demo@transitops.com / demo to sign in</p>
      </div>

      {/* Right column */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="card-modern p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h2>
              <p className="text-muted-foreground text-sm mt-1.5">Enter your credentials below to continue</p>
            </div>

            {locked ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">Account Temporarily Locked</h3>
                <p className="text-muted-foreground text-sm">
                  Too many failed sign-in attempts. Please contact your system administrator to unlock your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {loginError && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{loginError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...register('email')}
                    className={`h-10 rounded-lg ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`h-10 rounded-lg ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-sm font-medium text-foreground">Sign in as</Label>
                  <Select
                    defaultValue="Dispatcher"
                    onValueChange={val => {
                      setValue('role', val as Role);
                      setSelectedRole(val as Role);
                    }}
                  >
                    <SelectTrigger id="role" className="h-10 rounded-lg">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                      <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                      <SelectItem value="Safety Officer">Safety Officer</SelectItem>
                      <SelectItem value="Financial Analyst">Financial Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" onCheckedChange={val => setValue('rememberMe', !!val)} />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">Remember me</Label>
                  </div>
                  <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full h-10 rounded-lg font-medium" disabled={isSubmitting}>
                  Sign In
                </Button>

                <div className="text-center pt-1">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <span>
                      Don&apos;t have an account?{' '}
                      <span className="font-medium text-primary group-hover:underline">Sign up</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  </Link>
                </div>

                {failedAttempts > 0 && failedAttempts < 5 && (
                  <p className="text-xs text-amber-600 text-center">
                    {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining before account lock
                  </p>
                )}
              </form>
            )}
          </div>

          {!locked && (
            <div className="card-modern mt-5 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Role access summary</p>
              <ul className="space-y-1.5">
                {(Object.entries(ROLE_ACCESS) as [Role, string][]).map(([role, access]) => (
                  <li
                    key={role}
                    className={`text-xs flex gap-1.5 ${selectedRole === role ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
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
