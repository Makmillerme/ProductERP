"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
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
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("usersDelete.title")}
      description={
        isSelf
          ? t("usersDelete.descriptionSelf")
          : tFormat("usersDelete.descriptionOther", { email: user.email })
      }
      errorMessage={error}
      cancelLabel={t("productsConfig.common.cancel")}
      confirmLabel={t("usersDelete.action")}
      confirmPendingLabel={t("usersDelete.actioning")}
      confirmPending={loading}
      onConfirm={handleConfirm}
    />
  );
}
