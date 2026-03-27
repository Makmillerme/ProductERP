"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import {
  AlertDialogBody,
} from "@/components/ui/alert-dialog";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { AdminUser } from "./types";

const BAN_DURATION_VALUES = ["0", String(60 * 60 * 24 * 7), String(60 * 60 * 24 * 30)] as const;

type BanUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuccess: () => void;
};

export function BanUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: BanUserDialogProps) {
  const { t, tFormat } = useLocale();
  const [reason, setReason] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>(BAN_DURATION_VALUES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.admin.banUser({
        userId: user.id,
        banReason: reason.trim() || undefined,
        banExpiresIn: expiresIn === "0" ? undefined : Number(expiresIn),
      });
      if (res.error) {
        const msg = res.error.message ?? t("errors.banFailed");
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.banFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("usersBan.title")}
      description={tFormat("usersBan.description", { email: user.email })}
      cancelLabel={t("productsConfig.common.cancel")}
      confirmLabel={t("usersBan.action")}
      confirmPendingLabel={t("usersBan.actioning")}
      confirmPending={loading}
      onConfirm={handleConfirm}
    >
      <AlertDialogBody className="gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ban-reason">{t("usersBan.reason")}</Label>
          <Textarea
            id="ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("usersBan.reasonPlaceholder")}
            rows={2}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ban-expires">{t("usersBan.expires")}</Label>
          <Select
            value={expiresIn}
            onValueChange={setExpiresIn}
            disabled={loading}
          >
            <SelectTrigger id="ban-expires">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BAN_DURATION_VALUES[0]}>{t("usersBan.forever")}</SelectItem>
              <SelectItem value={BAN_DURATION_VALUES[1]}>{t("usersBan.week")}</SelectItem>
              <SelectItem value={BAN_DURATION_VALUES[2]}>{t("usersBan.month")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </AlertDialogBody>
    </ConfirmDestructiveDialog>
  );
}
