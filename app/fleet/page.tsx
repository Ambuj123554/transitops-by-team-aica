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
import { Plus, Pencil, FileText, Trash2, Info, Upload, ExternalLink, Truck } from 'lucide-react';
import { Vehicle, VehicleStatus } from '@/lib/types';
import { toast } from 'sonner';
import { TableSkeleton, EmptyState } from '@/components/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const vehicleSchema = z.object({
  regNo: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  capacity: z.coerce.number().positive('Must be positive'),
  odometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().positive('Must be positive'),
  region: z.string().optional(),
  status: z.enum(['Available', 'On Trip', 'In Shop', 'Retired'] as const),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function FleetPage() {
  const { vehicles, createVehicle, updateVehicle, deleteVehicle, loading } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [docVehicle, setDocVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<{ id: string; name: string; fileUrl: string; fileType: string }[]>([]);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; regNo: string } | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('transitops_token') : null;
  }

  async function loadDocuments(vehicleId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/documents?vehicleId=${vehicleId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch {
      // silently fail
    }
  }

  async function addDocument() {
    if (!docName || !docUrl || !docVehicle) return;
    setUploadingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: docVehicle.id, name: docName, fileUrl: docUrl, fileType: docUrl.split('.').pop() || 'pdf' }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => [...prev, data.data]);
        setDocName('');
        setDocUrl('');
        toast.success('Document added');
      } else {
        toast.error(data.error?.message || 'Failed to add document');
      }
    } catch {
      toast.error('Failed to add document');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function removeDocument(docId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        toast.success('Document removed');
      }
    } catch {
      toast.error('Failed to remove document');
    }
  }

  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    reset({ status: 'Available', region: '' });
    setOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditVehicle(v);
    reset({
      regNo: v.regNo, name: v.name, type: v.type,
      capacity: v.capacity, odometer: v.odometer,
      acquisitionCost: v.acquisitionCost,
      region: v.region || '',
      status: v.status,
    });
    setOpen(true);
  }

  async function onSubmit(data: VehicleForm) {
    setSubmitting(true);
    try {
      if (editVehicle) {
        await updateVehicle(editVehicle.id, data);
        toast.success('Vehicle updated');
      } else {
        await createVehicle(data);
        toast.success('Vehicle added to fleet');
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success(`Vehicle ${deleteTarget.regNo} deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vehicle');
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-7 w-24 animate-pulse rounded bg-muted/70" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
          <TableSkeleton rows={6} cols={9} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Fleet</h1>
            <p className="page-subtitle">Vehicle registry and management</p>
          </div>
          <Button onClick={openAdd} className="gap-2 rounded-lg cursor-pointer" aria-label="Add new vehicle">
            <Plus className="w-4 h-4" aria-hidden="true" /> Add Vehicle
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3" role="search" aria-label="Filter vehicles">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search by reg. no. or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64 h-9 pl-9 text-sm rounded-lg"
              aria-label="Search vehicles by registration number or name"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 h-9 text-sm rounded-lg" aria-label="Filter by vehicle type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: All</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9 text-sm rounded-lg" aria-label="Filter by vehicle status">
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
          {filtered.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No vehicles found"
              description={search || typeFilter !== 'all' || statusFilter !== 'all' ? 'No vehicles match your current filters. Try adjusting them.' : 'Get started by adding your first vehicle to the fleet.'}
              action={
                !search && typeFilter === 'all' && statusFilter === 'all' ? (
                  <Button onClick={openAdd} size="sm" className="rounded-lg cursor-pointer">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-modern" role="grid" aria-label="Vehicles table">
                  <thead>
                    <tr>
                      {['Reg. No.', 'Name / Model', 'Type', 'Capacity', 'Odometer', 'Acq. Cost', 'Region', 'Status', 'Actions'].map(h => (
                        <th key={h} scope="col">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <tr key={v.id}>
                        <td className="font-mono text-xs font-semibold text-foreground">{v.regNo}</td>
                        <td className="font-medium text-foreground">{v.name}</td>
                        <td>{v.type}</td>
                        <td>{v.capacity.toLocaleString()} kg</td>
                        <td>{v.odometer.toLocaleString()} km</td>
                        <td>${v.acquisitionCost.toLocaleString()}</td>
                        <td><span className="text-xs text-muted-foreground">{v.region || '—'}</span></td>
                        <td><StatusBadge status={v.status} /></td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(v)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer focus-ring"
                              title="Edit vehicle"
                              aria-label={`Edit vehicle ${v.regNo}`}
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => { setDocVehicle(v); setDocOpen(true); loadDocuments(v.id); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer focus-ring"
                              title="Documents"
                              aria-label={`Manage documents for ${v.regNo}`}
                            >
                              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: v.id, regNo: v.regNo })}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-ring"
                              title="Delete vehicle"
                              aria-label={`Delete vehicle ${v.regNo}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-muted/30 border-t flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">Registration No. must be unique · Click the edit icon to modify vehicle details · Upload documents (registration, insurance) via the document icon</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl" aria-describedby="vehicle-form-description">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2" id="vehicle-form-description">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Registration Number *</Label>
                <Input {...register('regNo')} placeholder="TRN-XXX" className="rounded-lg" aria-required="true" />
                {errors.regNo && <p className="text-xs text-destructive" role="alert">{errors.regNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Name / Model *</Label>
                <Input {...register('name')} placeholder="Volvo FH16" className="rounded-lg" aria-required="true" />
                {errors.name && <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Type *</Label>
                <Input {...register('type')} placeholder="Heavy Truck" className="rounded-lg" aria-required="true" />
                {errors.type && <p className="text-xs text-destructive" role="alert">{errors.type.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max Capacity (kg) *</Label>
                <Input {...register('capacity')} type="number" placeholder="20000" className="rounded-lg" aria-required="true" />
                {errors.capacity && <p className="text-xs text-destructive" role="alert">{errors.capacity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Odometer (km)</Label>
                <Input {...register('odometer')} type="number" placeholder="0" className="rounded-lg" />
                {errors.odometer && <p className="text-xs text-destructive" role="alert">{errors.odometer.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Acquisition Cost ($) *</Label>
                <Input {...register('acquisitionCost')} type="number" placeholder="50000" className="rounded-lg" aria-required="true" />
                {errors.acquisitionCost && <p className="text-xs text-destructive" role="alert">{errors.acquisitionCost.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Region</Label>
                <Input {...register('region')} placeholder="Gujarat, Mumbai..." className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  defaultValue="Available"
                  onValueChange={val => setValue('status', val as VehicleStatus)}
                >
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="On Trip">On Trip</SelectItem>
                    <SelectItem value="In Shop">In Shop</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={submitting} className="rounded-lg cursor-pointer">
                {submitting ? 'Saving...' : (editVehicle ? 'Update' : 'Add Vehicle')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Management Modal */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Documents — {docVehicle?.regNo}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Upload form */}
            <div className="flex gap-2">
              <Input
                placeholder="Document name (e.g. Registration Cert)"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                className="flex-1 h-9 text-sm rounded-lg"
                aria-label="Document name"
              />
              <Input
                placeholder="File URL or paste link"
                value={docUrl}
                onChange={e => setDocUrl(e.target.value)}
                className="flex-1 h-9 text-sm rounded-lg"
                aria-label="Document URL"
              />
              <Button
                size="sm"
                className="h-9 gap-1 rounded-lg cursor-pointer"
                disabled={!docName || !docUrl || uploadingDoc}
                onClick={addDocument}
                aria-label="Upload document"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" /> Add
              </Button>
            </div>

            {/* Document list */}
            {documents.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-slate-500">No documents uploaded yet</p>
                <p className="text-xs text-slate-400 mt-1">Add registration papers, insurance certificates, and permits</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto" role="list" aria-label="Uploaded documents">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50" role="listitem">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                        <p className="text-xs text-slate-400">.{doc.fileType}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus-ring"
                        title="Open document"
                        aria-label={`Open ${doc.name}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-ring"
                        title="Remove document"
                        aria-label={`Remove ${doc.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDocOpen(false)} className="rounded-lg cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${deleteTarget?.regNo}? This action cannot be undone and all associated data will be permanently removed.`}
        variant="danger"
        confirmLabel="Delete Vehicle"
      />
    </AppLayout>
  );
}
