"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogBody,
} from "@/components/ui/alert-dialog";
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

const BAN_DURATIONS = [
  { value: "0", label: "Назавжди" },
  { value: String(60 * 60 * 24 * 7), label: "1 тиждень" },
  { value: String(60 * 60 * 24 * 30), label: "1 місяць" },
] as const;

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
  const [reason, setReason] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>(BAN_DURATIONS[0].value);
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
        const msg = res.error.message ?? "Помилка блокування.";
        setError(msg);
        toast.error(msg);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка блокування.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Заблокувати користувача</AlertDialogTitle>
          <AlertDialogDescription>
            Користувач {user.email} не зможе увійти. Всі його сесії будуть завершені.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody className="gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ban-reason">Причина (необовʼязково)</Label>
            <Textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина блокування"
              rows={2}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ban-expires">Термін</Label>
            <Select
              value={expiresIn}
              onValueChange={setExpiresIn}
              disabled={loading}
            >
              <SelectTrigger id="ban-expires">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAN_DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </AlertDialogBody>
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
            {loading ? "Блокування…" : "Заблокувати"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
