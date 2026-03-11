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

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  currentUserId: string | undefined;
  onSuccess: () => void;
};

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSuccess,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = user && currentUserId === user.id;

  const handleConfirm = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.admin.removeUser({
        userId: user.id,
      });
      if (res.error) {
        const msg = res.error.message ?? "Помилка видалення.";
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка видалення.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Видалити користувача</AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf
              ? "Ви видаляєте власний обліковий запис. Вас одразу вийде з системи. Цю дію не можна скасувати."
              : `Користувача ${user.email} буде видалено назавжди. Повʼязані сесії також будуть видалені. Цю дію не можна скасувати.`}
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
