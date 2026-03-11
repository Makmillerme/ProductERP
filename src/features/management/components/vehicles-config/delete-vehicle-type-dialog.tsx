"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type DeleteVehicleTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleType: { id: string; name: string; vehiclesCount: number } | null;
  onSuccess: () => void;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteVehicleTypeDialog({
  open,
  onOpenChange,
  vehicleType,
  onSuccess,
  onDelete,
}: DeleteVehicleTypeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!vehicleType) return;
    setError(null);
    setLoading(true);
    try {
      await onDelete(vehicleType.id);
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Помилка видалення";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicleType) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Видалити тип товару?</AlertDialogTitle>
          <AlertDialogDescription>
            {vehicleType.vehiclesCount > 0 ? (
              <>
                Тип «{vehicleType.name}» буде видалено. {vehicleType.vehiclesCount} од. залишаться
                без типу. Цю дію не можна скасувати.
              </>
            ) : (
              <>
                Тип «{vehicleType.name}» буде видалено. Цю дію не можна скасувати.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Видалення…" : "Видалити"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
