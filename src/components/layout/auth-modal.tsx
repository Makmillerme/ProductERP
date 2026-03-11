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

export function AuthModal() {
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
        setErrorMessage(res.error.message ?? "Щось пішло не так.");
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
      setErrorMessage(res.error.message ?? "Щось пішло не так.");
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
          <DialogTitle>Увійти або зареєструватися</DialogTitle>
          <DialogDescription>
            Введіть email — ми надішлемо посилання для входу. Якщо облікового запису немає, він буде створений.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">
              Перевірте пошту: на <strong>{email}</strong> надіслано посилання для входу.
            </p>
          ) : (
            <form id="auth-form" onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === "loading"}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-password">Пароль (необов&apos;язково)</Label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="Якщо є пароль — увійти за паролем"
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
              {status === "loading" ? "Вхід…" : password ? "Увійти" : "Надіслати посилання"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
