"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
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
  const { t, tFormat } = useLocale();
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
        const msg = res.error.message ?? t("errors.unbanFailed");
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unbanFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("usersUnban.title")}
      description={tFormat("usersUnban.description", { email: user.email })}
      errorMessage={error}
      cancelLabel={t("productsConfig.common.cancel")}
      confirmLabel={t("usersUnban.action")}
      confirmPendingLabel={t("usersUnban.actioning")}
      confirmPending={loading}
      confirmTone="default"
      onConfirm={handleConfirm}
    />
  );
}
