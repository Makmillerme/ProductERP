"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthModalStore } from "@/stores/use-auth-modal";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-provider";

export function AuthModal() {
  const { t } = useLocale();
  const { open, closeAuthModal } = useAuthModalStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatus("loading");
    const emailTrim = email.trim();
    if (password) {
      const res = await authClient.signIn.email({ email: emailTrim, password, callbackURL: typeof window !== "undefined" ? window.location.pathname : "/" });
      if (res.error) {
        setStatus("error");
        setErrorMessage(res.error.message ?? t("auth.somethingWentWrong"));
        return;
      }
      closeAuthModal();
      return;
    }
    const res = await authClient.signIn.magicLink({
      email: emailTrim,
      callbackURL: typeof window !== "undefined" ? window.location.pathname : "/",
    });
    if (res.error) {
      setStatus("error");
        setErrorMessage(res.error.message ?? t("auth.somethingWentWrong"));
      return;
    }
    setStatus("sent");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAuthModal();
      setStatus("idle");
      setErrorMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.modalTitle")}</DialogTitle>
          <DialogDescription>
            {t("auth.modalDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">
              {t("auth.checkEmailPrefix")}
              <strong>{email}</strong>
              {t("auth.checkEmailSuffix")}
            </p>
          ) : (
            <form id="auth-form" onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auth-email">{t("auth.email")}</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === "loading"}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-password">{t("auth.passwordOptional")}</Label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                  autoComplete="current-password"
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </form>
          )}
        </DialogBody>
        {status !== "sent" && (
          <DialogFooter>
            <Button type="submit" form="auth-form" disabled={status === "loading"}>
              {status === "loading" ? t("auth.loading") : password ? t("auth.signIn") : t("auth.sendLink")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
