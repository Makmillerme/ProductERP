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
import { authClient } from "@/lib/auth-client";
import type { AdminUser } from "./types";

type UnbanUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuccess: () => void;
};

export function UnbanUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UnbanUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.admin.unbanUser({
        userId: user.id,
      });
      if (res.error) {
        const msg = res.error.message ?? "Помилка розблокування.";
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка розблокування.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Розблокувати користувача</AlertDialogTitle>
          <AlertDialogDescription>
            Користувач {user.email} знову зможе увійти в систему.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "Розблокування…" : "Розблокувати"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
