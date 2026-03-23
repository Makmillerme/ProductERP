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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("usersUnban.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tFormat("usersUnban.description", { email: user.email })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("productsConfig.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? t("usersUnban.actioning") : t("usersUnban.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
