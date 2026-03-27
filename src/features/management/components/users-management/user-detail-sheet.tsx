"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/scrollable-tabs-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
import { adminMutationJson } from "@/lib/api/admin/client";
import {
  SHEET_CONTENT_CLASS,
  SHEET_INPUT_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_BODY_CLASS,
  SHEET_FOOTER_CLASS,
  SHEET_TAB_TRIGGER_CLASS,
  SHEET_TABS_GAP,
  SHEET_TABS_CONTENT_MT,
  SHEET_SCROLL_CLASS,
  SHEET_FORM_PADDING,
} from "@/config/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE, getRoleLabel, type RoleCode } from "@/config/roles";
import { authClient } from "@/lib/auth-client";
import type { AdminUser } from "./types";
import { formatDateTimeForDisplay } from "@/features/products/lib/field-utils";

export type RoleOption = { code: string; name: string };

const MIN_PASSWORD_LENGTH = 8;

type SessionRow = {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type UserDetailSheetProps = {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "profile" | "sessions";
  currentUserId: string | undefined;
  currentUserRole: RoleCode | undefined;
  isOwner?: boolean;
  roleOptions: RoleOption[];
  onSuccess: (isCreate?: boolean) => void;
  onRequestBan: (user: AdminUser) => void;
  onRequestUnban: (user: AdminUser) => void;
  onRequestDelete: (user: AdminUser) => void;
  onTransferSuccess?: () => void;
};

function shortenUserAgent(ua: string | null | undefined): string {
  if (!ua) return "—";
  return ua.length <= 50 ? ua : ua.slice(0, 47) + "…";
}

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  initialTab = "profile",
  currentUserId,
  currentUserRole,
  isOwner = false,
  roleOptions,
  onSuccess,
  onRequestBan,
  onRequestUnban,
  onRequestDelete,
  onTransferSuccess,
}: UserDetailSheetProps) {
  const queryClient = useQueryClient();
  const { t, tFormat } = useLocale();
  const [activeTab, setActiveTab] = useState<"profile" | "sessions">(initialTab);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<RoleCode>("user");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [email, setEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | "all" | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const isCreate = user === null;

  useEffect(() => {
    if (!open) return;
    setActiveTab(isCreate ? "profile" : initialTab);
    if (user) {
      setName(user.name ?? "");
      setLastName(user.lastName ?? "");
      setRole((user.role as RoleCode) ?? roleOptions[0]?.code ?? "user");
      setPassword("");
      setRepeatPassword("");
      setEmail(user.email);
    } else {
      setName("");
      setLastName("");
      setRole(roleOptions[0]?.code ?? "user");
      setPassword("");
      setRepeatPassword("");
      setEmail("");
      setCreatePassword("");
    }
    setError(null);
    setSessionsError(null);
  }, [open, user, isCreate, initialTab, roleOptions]);

  useEffect(() => {
    if (!open || !user?.id) {
      setSessions([]);
      return;
    }
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(null);
    authClient.admin
      .listUserSessions({ userId: user.id })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setSessionsError(res.error.message ?? t("errors.sessionsLoadFailed"));
          setSessions([]);
          return;
        }
        const list = (res.data as unknown as { sessions?: SessionRow[] })?.sessions ?? [];
        setSessions(Array.isArray(list) ? list : []);
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user, t]);

  const targetIsOwner = (user?.role as string) === "owner";
  const canChangeRole =
    currentUserId !== user?.id &&
    !targetIsOwner &&
    (isOwner || (currentUserRole === ADMIN_ROLE && (user?.role as RoleCode) !== ADMIN_ROLE));

  const handleSave = async () => {
    setError(null);
    if (isCreate) {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      if (!trimmedEmail || !trimmedName) {
        setError(t("users.fillEmailAndName"));
        return;
      }
      if (createPassword.length < MIN_PASSWORD_LENGTH) {
        setError(tFormat("users.passwordMinLength", { n: String(MIN_PASSWORD_LENGTH) }));
        return;
      }
      setSaving(true);
      try {
        await adminMutationJson("/users", {
          method: "POST",
          body: {
            email: trimmedEmail,
            password: createPassword,
            name: trimmedName,
            role,
            ...(lastName.trim() && { lastName: lastName.trim() }),
          },
          fallbackError: t("errors.createFailed"),
        });
        onSuccess(true);
        onOpenChange(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("errors.createFailed");
        setError(msg);
        toast.error(msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!user) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("users.nameRequired"));
      return;
    }
    const wantPassword = password.length > 0 || repeatPassword.length > 0;
    if (wantPassword) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(tFormat("users.passwordMinLength", { n: String(MIN_PASSWORD_LENGTH) }));
        return;
      }
      if (password !== repeatPassword) {
        setError(t("users.passwordsMismatch"));
        return;
      }
    }
    setSaving(true);
    try {
      const updateRes = await authClient.admin.updateUser({
        userId: user.id,
        data: { name: trimmedName, ...(lastName.trim() && { lastName: lastName.trim() }) },
      });
      if (updateRes.error) {
        setError(updateRes.error.message ?? t("errors.saveFailed"));
        toast.error(updateRes.error.message);
        return;
      }
      if (canChangeRole) {
        await adminMutationJson(`/users/${user.id}/set-role`, {
          method: "POST",
          body: { role },
          fallbackError: t("users.roleChangeFailed"),
        });
      }
      if (wantPassword) {
        const pwdRes = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: password,
        });
        if (pwdRes.error) {
          setError(pwdRes.error.message ?? t("users.passwordChangeFailed"));
          toast.error(pwdRes.error.message);
          return;
        }
      }
      if (user.id === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ["me"] });
      }
      onSuccess(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeOne = async (sessionToken: string) => {
    setRevoking(sessionToken);
    setSessionsError(null);
    try {
      const res = await authClient.admin.revokeUserSession({ sessionToken });
      if (res.error) {
        setSessionsError(res.error.message ?? t("errors.revokeFailed"));
        return;
      }
      setSessions((prev) => prev.filter((s) => s.token !== sessionToken));
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!user) return;
    setRevoking("all");
    setSessionsError(null);
    try {
      const res = await authClient.admin.revokeUserSessions({ userId: user.id });
      if (res.error) {
        setSessionsError(res.error.message ?? t("errors.revokeFailed"));
        return;
      }
      setSessions([]);
      if (user.id === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ["me"] });
      }
      onSuccess();
    } finally {
      setRevoking(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!user) return;
    setTransferLoading(true);
    try {
      await adminMutationJson("/owner/transfer", {
        method: "POST",
        body: { newOwnerUserId: user.id },
        fallbackError: t("errors.transferFailed"),
      });
      onTransferSuccess?.();
      onOpenChange(false);
      setTransferDialogOpen(false);
      toast.success(t("toasts.ownerTransferred"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.transferFailed"));
    } finally {
      setTransferLoading(false);
    }
  };

  const canTransferOwnership =
    isOwner && !isCreate && user && currentUserId !== user.id && !targetIsOwner;

  const title = isCreate ? t("users.addUserTitle") : user?.name ? `${user.name}${user.lastName ? ` ${user.lastName}` : ""}` : user?.email ?? t("users.userLabel");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={SHEET_CONTENT_CLASS}
        aria-describedby={undefined}
      >
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle className="text-base font-semibold sm:text-lg">{title}</SheetTitle>
        </SheetHeader>

        <div className={SHEET_BODY_CLASS}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "profile" | "sessions")}
            className={cn("flex min-h-0 flex-1 flex-col", SHEET_TABS_GAP)}
          >
            <ScrollableTabsList variant="line">
              <TabsTrigger value="profile" className={SHEET_TAB_TRIGGER_CLASS}>
                <span className="min-w-0 truncate">{t("users.profile")}</span>
              </TabsTrigger>
              {!isCreate && (
                <TabsTrigger value="sessions" className={SHEET_TAB_TRIGGER_CLASS}>
                  <span className="min-w-0 truncate">{t("users.sessions")}</span>
                </TabsTrigger>
              )}
            </ScrollableTabsList>

            <TabsContent value="profile" className={cn(SHEET_TABS_CONTENT_MT, "flex-1 min-w-0 p-2 data-[state=inactive]:hidden", SHEET_SCROLL_CLASS)}>
              <div className={cn("grid grid-cols-1 gap-3 sm:gap-4", SHEET_FORM_PADDING)}>
                {isCreate ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="sheet-user-email">{t("users.email")}</Label>
                      <Input
                        id="sheet-user-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("users.emailPlaceholder")}
                        autoComplete="email"
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sheet-user-create-password">{t("users.password")}</Label>
                      <Input
                        id="sheet-user-create-password"
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder={tFormat("users.minPasswordPlaceholder", { n: String(MIN_PASSWORD_LENGTH) })}
                        autoComplete="new-password"
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Label>{t("users.email")}</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="sheet-user-name">{t("users.name")}</Label>
                  <Input
                    id="sheet-user-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("users.namePlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sheet-user-lastName">{t("users.lastName")}</Label>
                  <Input
                    id="sheet-user-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t("users.lastNamePlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sheet-user-role">{t("users.role")}</Label>
                  {canChangeRole ? (
                    <>
                      <Select
                        value={role}
                        onValueChange={(v) => setRole(v as RoleCode)}
                        disabled={saving}
                      >
                        <SelectTrigger id="sheet-user-role" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {isOwner
                          ? t("users.ownerCanAssignAdmin")
                          : t("users.onlyOwnerCanAssignAdmin")}
                      </p>
                    </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground py-2">
                          {user ? getRoleLabel(user.role, roleOptions.find((o) => o.code === user.role)?.name) : "—"}
                        </p>
                        {currentUserId === user?.id && (
                          <p className="text-xs text-muted-foreground">
                            {t("users.ownRoleCannotChange")}
                            {!isOwner && ` ${t("users.onlyOwnerCanAssignAdminSuffix")}`}
                          </p>
                        )}
                      </>
                  )}
                </div>
                {!isCreate && (
                  <div className="grid gap-2 pt-2 border-t">
                    <Label className="text-muted-foreground">{t("users.changePassword")}</Label>
                    <Input
                      id="sheet-user-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tFormat("users.minPasswordPlaceholder", { n: String(MIN_PASSWORD_LENGTH) })}
                      autoComplete="new-password"
                      disabled={saving}
                      className={SHEET_INPUT_CLASS}
                    />
                    <Input
                      id="sheet-user-password-repeat"
                      type="password"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      placeholder={t("users.repeatPassword")}
                      autoComplete="new-password"
                      disabled={saving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </TabsContent>

            {!isCreate && (
              <TabsContent value="sessions" className={cn(SHEET_TABS_CONTENT_MT, "flex-1 min-w-0 p-2 data-[state=inactive]:hidden", SHEET_SCROLL_CLASS)}>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {sessionsError && (
                    <p className="text-sm text-destructive">{sessionsError}</p>
                  )}
                  {sessionsLoading ? (
                    <p className="text-sm text-muted-foreground">{t("users.loading")}</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("users.noSessions")}</p>
                  ) : (
                    <div className={cn("min-h-0 min-w-0 flex-1 rounded-md border", SHEET_SCROLL_CLASS)}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="h-11 px-3 text-left align-middle whitespace-nowrap text-xs">{t("users.createdAt")}</TableHead>
                            <TableHead className="h-11 px-3 text-left align-middle whitespace-nowrap text-xs">{t("users.expiresAt")}</TableHead>
                            <TableHead className="h-11 px-3 text-left align-middle text-xs">{t("users.ip")}</TableHead>
                            <TableHead className="h-11 px-3 text-left align-middle min-w-[100px] text-xs">{t("users.userAgent")}</TableHead>
                            <TableHead className="h-11 px-3 text-left align-middle w-[90px] shrink-0 text-xs">{t("users.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="h-11 px-3 text-left align-middle text-xs whitespace-nowrap">
                                {formatDateTimeForDisplay(s.createdAt)}
                              </TableCell>
                              <TableCell className="h-11 px-3 text-left align-middle text-xs whitespace-nowrap">
                                {formatDateTimeForDisplay(s.expiresAt)}
                              </TableCell>
                              <TableCell className="h-11 px-3 text-left align-middle text-xs">
                                {s.ipAddress ?? "—"}
                              </TableCell>
                              <TableCell className="h-11 px-3 text-left align-middle text-xs max-w-[180px] truncate" title={s.userAgent ?? undefined}>
                                {shortenUserAgent(s.userAgent)}
                              </TableCell>
                              <TableCell className="h-11 px-3 text-left align-middle w-[90px] shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-destructive hover:text-destructive shrink-0 text-xs"
                                  onClick={() => handleRevokeOne(s.token)}
                                  disabled={revoking !== null}
                                >
                                  {revoking === s.token ? t("users.revoking") : t("users.revoke")}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {sessions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeAll}
                      disabled={revoking !== null}
                    >
                      {revoking === "all" ? t("users.revoking") : t("users.revokeAll")}
                    </Button>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <SheetFooter className={SHEET_FOOTER_CLASS}>
          {/* Передати права власника — окремий рядок зверху */}
          {canTransferOwnership && user && (
            <div className="flex w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferDialogOpen(true)}
                disabled={saving}
              >
                {t("users.transferOwner")}
              </Button>
            </div>
          )}
          {/* Нижній рядок: небезпечні дії + Зберегти праворуч */}
          <div className="flex items-center gap-2 w-full">
            {!isCreate && user && (
              <>
                {user.banned ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRequestUnban(user)}
                    disabled={saving}
                  >
                    {t("users.unban")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    onClick={() => onRequestBan(user)}
                    disabled={saving}
                  >
                    {t("users.ban")}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => onRequestDelete(user)}
                  disabled={saving}
                >
                  {t("users.delete")}
                </Button>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto"
            >
              {saving ? (isCreate ? t("users.creating") : t("users.saving")) : isCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
      {canTransferOwnership && user && (
        <ConfirmDestructiveDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          title={t("users.transferOwnerTitle")}
          description={tFormat("users.transferOwnerDesc", { email: user.email })}
          cancelLabel={t("productsConfig.common.cancel")}
          confirmLabel={t("users.transfer")}
          confirmPendingLabel={t("users.transferring")}
          confirmPending={transferLoading}
          cancelDisabled={transferLoading}
          confirmTone="default"
          onConfirm={handleTransferOwnership}
        />
      )}
    </Sheet>
  );
}
