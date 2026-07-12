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
import { AlertTriangle, CheckCircle2, Info, ArrowRight, ShieldCheck, Send, ThumbsUp } from 'lucide-react';
import { TripStatus } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tripSchema = z.object({
  source: z.string().min(1, 'Required'),
  destination: z.string().min(1, 'Required'),
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  cargoWeight: z.coerce.number().positive('Must be > 0'),
  plannedDistance: z.coerce.number().positive('Must be > 0'),
});

type TripForm = z.infer<typeof tripSchema>;

const LIFECYCLE = ['Draft', 'Pending Approval', 'Dispatched', 'Completed', 'Cancelled'] as TripStatus[];

function LifecycleStepper({ current }: { current: TripStatus }) {
  const steps = ['Draft', 'Pending Approval', 'Dispatched', 'Completed'];
  const idx = steps.indexOf(current as string);
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
            i <= idx
              ? step === 'Pending Approval'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-blue-600 text-white border-blue-600'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          )}>
            {i < idx && <CheckCircle2 className="w-3 h-3" />}
            <span>{step === 'Pending Approval' ? 'Approval' : step}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className={cn('w-3.5 h-3.5 mx-1', i < idx ? 'text-blue-400' : 'text-slate-300')} />
          )}
        </div>
      ))}
      <div className="flex items-center">
        <ArrowRight className="w-3.5 h-3.5 mx-1 text-slate-200" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-200/60">
          Cancelled
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, vehicleMap, driverMap, onApprove, currentRole }: {
  trip: { id: string; vehicleId: string; driverId: string | null; source: string; destination: string; status: string; eta: string };
  vehicleMap: Record<string, { regNo: string; name: string }>;
  driverMap: Record<string, { name: string }>;
  onApprove?: (id: string) => void;
  currentRole?: string;
}) {
  const vehicle = vehicleMap[trip.vehicleId];
  const driver = trip.driverId ? driverMap[trip.driverId] : null;
  const isPending = trip.status === 'Pending Approval';
  const isFleetManager = currentRole === 'Fleet Manager';

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all duration-200 space-y-2.5 shadow-sm',
      isPending
        ? 'border-purple-300 bg-purple-50/40 ring-1 ring-purple-200/50'
        : 'border-slate-200/80 bg-white hover:border-slate-300'
    )}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-slate-700">{trip.id}</span>
        <StatusBadge status={trip.status} />
      </div>
      <div className="text-sm text-slate-600">
        <span className="font-medium">{vehicle?.regNo ?? '—'}</span>
        <span className="text-slate-300 mx-1">/</span>
        <span>{driver?.name ?? <span className="text-slate-400">Unassigned</span>}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>{trip.source}</span>
        <ArrowRight className="w-3 h-3 flex-shrink-0" />
        <span>{trip.destination}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">ETA: {trip.eta}</span>
        {isPending && isFleetManager && onApprove && (
          <Button
            size="sm"
            onClick={() => onApprove(trip.id)}
            className="h-7 text-xs gap-1 rounded-lg cursor-pointer bg-purple-600 hover:bg-purple-700"
          >
            <ThumbsUp className="w-3 h-3" />
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TripsPage() {
  const { user, vehicles, drivers, trips, createTrip, requestApproval, approveTrip, dispatchTrip } = useApp();
  const [currentStage] = useState<TripStatus>('Draft');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'dispatch' | 'approval'>('approval');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
  });

  const cargoWeight = watch('cargoWeight');
  const vehicleId = watch('vehicleId');

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => {
    if (d.status !== 'Available') return false;
    if (new Date(d.expiry) < new Date()) return false;
    return true;
  });

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const capacityExceeded = selectedVehicle && cargoWeight > selectedVehicle.capacity;
  const overageKg = capacityExceeded ? cargoWeight - selectedVehicle.capacity : 0;

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

  const isFleetManager = user?.role === 'Fleet Manager';
  const isDispatcher = user?.role === 'Dispatcher';

  async function onSubmit(data: TripForm) {
    setSubmitting(true);
    try {
      // Step 1: Create trip as DRAFT
      const draft = await createTrip(data);

      if (mode === 'dispatch') {
        // Direct dispatch (old flow)
        const dispatched = await dispatchTrip(draft.id, { vehicleId: data.vehicleId, driverId: data.driverId });
        toast.success(`Trip ${dispatched.id} dispatched successfully`);
      } else {
        // Submit for approval (new flow)
        await requestApproval(draft.id, {
          vehicleId: data.vehicleId,
          driverId: data.driverId,
        });
        toast.success(`Trip ${draft.id} submitted for approval`);
      }
      reset();
      setSelectedVehicleId('');
      setSelectedDriverId('');
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(tripId: string) {
    try {
      await approveTrip(tripId);
      toast.success(`Trip ${tripId} approved and dispatched`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve trip');
    }
  }

  const pendingApprovalTrips = trips.filter(t => t.status === 'Pending Approval');

  return (
    <AppLayout>
      <div className="page-container">
        <div>
          <h1 className="page-title">Trip Dispatcher</h1>
          <p className="page-subtitle">Create and manage trip dispatches</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Trip Form */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Create Trip</h2>
                {/* Mode toggle - only for Dispatchers */}
                {isDispatcher && (
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setMode('approval')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                        mode === 'approval' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <Send className="w-3 h-3 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => setMode('dispatch')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                        mode === 'dispatch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <ArrowRight className="w-3 h-3 inline mr-1" />
                      Direct
                    </button>
                  </div>
                )}
              </div>
              <LifecycleStepper current={currentStage} />

              {mode === 'approval' && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-200/60">
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <p className="text-xs text-purple-700">
                    Trip will be created → submitted for approval → {isFleetManager ? 'you can approve it from the board' : 'Fleet Manager approves'}
                  </p>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Source *</Label>
                  <Input {...register('source')} placeholder="Chicago Depot" className="h-10 rounded-lg" />
                  {errors.source && <p className="text-xs text-red-600">{errors.source.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Destination *</Label>
                  <Input {...register('destination')} placeholder="Detroit Hub" className="h-10 rounded-lg" />
                  {errors.destination && <p className="text-xs text-red-600">{errors.destination.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Vehicle * <span className="text-xs text-emerald-600 font-normal">(Available only)</span>
                </Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={val => { setValue('vehicleId', val); setSelectedVehicleId(val); }}
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select available vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.length === 0 && (
                      <SelectItem value="none" disabled>No available vehicles</SelectItem>
                    )}
                    {availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.regNo} — {v.name} ({v.capacity.toLocaleString()} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && <p className="text-xs text-red-600">{errors.vehicleId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Driver * <span className="text-xs text-emerald-600 font-normal">(Available, valid license)</span>
                </Label>
                <Select
                  value={selectedDriverId}
                  onValueChange={val => { setValue('driverId', val); setSelectedDriverId(val); }}
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select available driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 && (
                      <SelectItem value="none" disabled>No available drivers</SelectItem>
                    )}
                    {availableDrivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} — {d.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.driverId && <p className="text-xs text-red-600">{errors.driverId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cargo Weight (kg) *</Label>
                  <Input {...register('cargoWeight')} type="number" placeholder="5000" className="h-10 rounded-lg" />
                  {errors.cargoWeight && <p className="text-xs text-red-600">{errors.cargoWeight.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Planned Distance (km) *</Label>
                  <Input {...register('plannedDistance')} type="number" placeholder="450" className="h-10 rounded-lg" />
                  {errors.plannedDistance && <p className="text-xs text-red-600">{errors.plannedDistance.message}</p>}
                </div>
              </div>

              {/* Capacity Warning */}
              {capacityExceeded && selectedVehicle && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-700">Capacity Exceeded</span>
                  </div>
                  <div className="text-xs text-red-600 space-y-0.5 pl-6">
                    <p>Vehicle Capacity: {selectedVehicle.capacity.toLocaleString()} kg</p>
                    <p>Cargo Weight: {Number(cargoWeight).toLocaleString()} kg</p>
                    <p className="font-semibold">Exceeded by: {overageKg.toLocaleString()} kg</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="rounded-lg cursor-pointer"
                  disabled={!!capacityExceeded || submitting}
                >
                  {submitting
                    ? 'Processing...'
                    : mode === 'dispatch'
                      ? 'Dispatch'
                      : 'Submit for Approval'
                  }
                </Button>
                <Button type="button" variant="outline" onClick={() => { reset(); setSelectedVehicleId(''); setSelectedDriverId(''); }} className="rounded-lg cursor-pointer">
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Live Board */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200/80 bg-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Live Board</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {trips.filter(t => t.status === 'Dispatched').length} active dispatch(es)
                    {pendingApprovalTrips.length > 0 && (
                      <span className="ml-2 text-purple-600 font-medium">
                        · {pendingApprovalTrips.length} pending approval
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Approval Section */}
            {pendingApprovalTrips.length > 0 && isFleetManager && (
              <div className="border-b border-purple-200/60 bg-purple-50/30">
                <div className="px-4 py-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">Awaiting your approval</span>
                </div>
                <div className="p-3 space-y-2">
                  {pendingApprovalTrips.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      vehicleMap={vehicleMap}
                      driverMap={driverMap}
                      onApprove={handleApprove}
                      currentRole={user?.role}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {trips.filter(t => t.status !== 'Pending Approval').map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  vehicleMap={vehicleMap}
                  driverMap={driverMap}
                />
              ))}
              {trips.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No trips yet</p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200/80 bg-white rounded-b-xl flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400">Approval flow: Draft → Pending Approval → Dispatched. Fleet Manager approves. On Complete: odometer → fuel log → expenses → Available.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
