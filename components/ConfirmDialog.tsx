'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog closes */
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms the action */
  onConfirm: () => Promise<void> | void;
  /** Dialog title */
  title: string;
  /** Dialog description / message */
  message: string;
  /** Visual variant */
  variant?: Variant;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
}

const VARIANT_CONFIG: Record<Variant, {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  buttonClass: string;
}> = {
  danger: {
    icon: Trash2,
    iconColor: 'bg-destructive/10 text-destructive',
    buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'bg-amber-50 text-amber-600',
    buttonClass: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  info: {
    icon: Info,
    iconColor: 'bg-blue-50 text-blue-600',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
};

/**
 * A reusable confirmation dialog for destructive or important actions.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={deleteOpen}
 *   onOpenChange={setDeleteOpen}
 *   onConfirm={handleDelete}
 *   title="Delete Vehicle"
 *   message="Are you sure you want to delete this vehicle? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconColor}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {message}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:gap-3">
          <AlertDialogCancel
            className="rounded-lg cursor-pointer"
            disabled={loading}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-lg cursor-pointer ${config.buttonClass}`}
          >
            {loading ? `${confirmLabel}...` : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
