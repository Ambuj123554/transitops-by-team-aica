'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp, RegisteredUser } from '@/lib/app-context';
import { Role } from '@/lib/types';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid work email'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as const),
    company: z.string().min(1, 'Company name is required'),
    phone: z.string().optional(),
    employeeId: z.string().min(1, 'Employee ID or invite code is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'Fleet Manager': 'Full access to fleet, drivers, maintenance, and analytics',
  'Dispatcher': 'Manage trips, view fleet and drivers',
  'Safety Officer': 'Full driver management, view trips',
  'Financial Analyst': 'Fuel & expenses, analytics, view fleet',
};

interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'One special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

export default function SignupPage() {
  const { register: registerUser } = useApp();
  const router = useRouter();
  const [signupError, setSignupError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('Dispatcher');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Dispatcher' },
  });

  const passwordValue = watch('password') ?? '';

  async function onSubmit(data: FormData) {
    setSignupError('');
    const userData: RegisteredUser = {
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      company: data.company,
      phone: data.phone || undefined,
      employeeId: data.employeeId,
    };
    const result = await registerUser(userData);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setSignupError(result.error ?? 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left column — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground/90 p-12 text-background">
        <div>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
          <span className="text-2xl font-semibold tracking-tight block">TransitOps</span>
        </div>

        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Join TransitOps</h2>
              <p className="text-muted-foreground text-sm">Create your operations account</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Get started with<br />your free account
          </h1>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Set up your profile and start managing your fleet, dispatching trips, and tracking operations in real time.
          </p>

          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">What you&apos;ll get:</p>
            <ul className="space-y-3">
              {[
                'Full fleet & driver management',
                'Real-time trip dispatching',
                'Operations analytics & reports',
                'Role-based access controls',
              ].map(text => (
                <li key={text} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-background/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-muted-foreground/60 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* Right column — form */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="card-modern p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h2>
              <p className="text-muted-foreground text-sm mt-1.5">
                Fill in the details below to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {signupError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{signupError}</p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g. John Smith"
                  {...register('fullName')}
                  className={`h-10 rounded-lg ${errors.fullName ? 'border-destructive' : ''}`}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Work Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`h-10 rounded-lg ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-sm font-medium text-foreground">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  defaultValue="Dispatcher"
                  onValueChange={val => {
                    setValue('role', val as Role, { shouldValidate: true });
                    setSelectedRole(val as Role);
                  }}
                >
                  <SelectTrigger id="role" className="h-10 rounded-lg">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as Role[]).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-destructive">{errors.role.message}</p>
                )}
                <p className="text-xs text-muted-foreground italic">{ROLE_DESCRIPTIONS[selectedRole]}</p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...register('password')}
                    className={`h-10 rounded-lg pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}

                {/* Password requirements checklist */}
                <div className="mt-2 space-y-1.5">
                  {PASSWORD_REQUIREMENTS.map(req => {
                    const met = req.test(passwordValue);
                    return (
                      <div key={req.label} className="flex items-center gap-2 text-xs">
                        {met ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={met ? 'text-emerald-600' : 'text-muted-foreground'}>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    {...register('confirmPassword')}
                    className={`h-10 rounded-lg pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Organization / Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-sm font-medium text-foreground">
                  Organization / Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g. ACME Transport Inc."
                  {...register('company')}
                  className={`h-10 rounded-lg ${errors.company ? 'border-destructive' : ''}`}
                />
                {errors.company && (
                  <p className="text-xs text-destructive">{errors.company.message}</p>
                )}
              </div>

              {/* Phone Number (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register('phone')}
                  className="h-10 rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Used for operational alerts and two-factor authentication
                </p>
              </div>

              {/* Employee ID / Invite Code */}
              <div className="space-y-1.5">
                <Label htmlFor="employeeId" className="text-sm font-medium text-foreground">
                  Employee ID or Invite Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="e.g. EMP-12345 or INVITE-CODE"
                  {...register('employeeId')}
                  className={`h-10 rounded-lg ${errors.employeeId ? 'border-destructive' : ''}`}
                />
                {errors.employeeId && (
                  <p className="text-xs text-destructive">{errors.employeeId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Required for verification. Prevents unauthorized signups.
                </p>
              </div>

              <Button type="submit" className="w-full h-10 rounded-lg font-medium" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <span className="text-primary">Terms of Service</span>{' '}
                and{' '}
                <span className="text-primary">Privacy Policy</span>
              </p>

              {/* Mobile sign-in link */}
              <div className="lg:hidden text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
