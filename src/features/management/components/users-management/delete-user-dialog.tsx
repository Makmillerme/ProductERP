"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
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
  const { t, tFormat } = useLocale();
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
        const msg = res.error.message ?? t("errors.deleteFailed");
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("usersDelete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf
              ? t("usersDelete.descriptionSelf")
              : tFormat("usersDelete.descriptionOther", { email: user.email })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("productsConfig.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t("usersDelete.actioning") : t("usersDelete.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
