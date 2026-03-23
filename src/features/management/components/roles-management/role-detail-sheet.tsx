"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PERMISSION_SECTIONS,
  type RolePermissionsMap,
  type PermissionSectionId,
} from "@/config/permissions";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_FOOTER_CLASS, SHEET_SCROLL_CLASS, SHEET_FORM_PADDING } from "@/config/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE } from "@/config/roles";
import { slugify } from "@/lib/slugify";
import type { ApiRoleDetail } from "./types";

export type RoleDetailSheetProps = {
  role: ApiRoleDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Показувати стан завантаження замість форми, коли очікуємо деталі ролі з API */
  detailLoading?: boolean;
  loadError?: string | null;
  onSaveCreate: (data: { name: string; code: string; description?: string | null; permissions: RolePermissionsMap }) => Promise<void>;
  onSaveEdit: (roleId: string, data: { name?: string; description?: string | null; permissions: RolePermissionsMap }) => Promise<void>;
};

function getSectionPermissions(
  permissions: RolePermissionsMap,
  sectionId: PermissionSectionId
): Record<string, boolean> {
  return permissions[sectionId] ?? {};
}

export function RoleDetailSheet({
  role,
  open,
  onOpenChange,
  detailLoading = false,
  loadError,
  onSaveCreate,
  onSaveEdit,
}: RoleDetailSheetProps) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [localPermissions, setLocalPermissions] = useState<RolePermissionsMap>({});
  const [saving, setSaving] = useState(false);

  const isCreate = role === null && !detailLoading;
  const isSystemAdmin = role?.code === ADMIN_ROLE;
  const isLoadFailed = !isCreate && role === null && !detailLoading && !!loadError;
  const showLoading = role === null && detailLoading;

  useEffect(() => {
    if (!open) return;
    if (role) {
      setName(role.name);
      setCode(role.code);
      setDescription(role.description ?? "");
      setLocalPermissions(role.permissions ?? {});
    } else {
      setName("");
      setCode("");
      setCodeManuallyEdited(false);
      setDescription("");
      setLocalPermissions({});
    }
  }, [open, role, isCreate]);

  useEffect(() => {
    if (isCreate && !codeManuallyEdited) setCode(slugify(name));
  }, [name, isCreate, codeManuallyEdited]);

  const setAction = (sectionId: PermissionSectionId, actionId: string, value: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? {}),
        [actionId]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (isCreate) {
      const trimmedName = name.trim();
      const trimmedCode = slugify(code.trim());
      if (!trimmedName || !trimmedCode) {
        toast.error(t("validationRequired.roleNameAndCode"));
        return;
      }
      setSaving(true);
      try {
        await onSaveCreate({
          name: trimmedName,
          code: trimmedCode,
          description: description.trim() || null,
          permissions: localPermissions,
        });
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("errors.createFailed"));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!role) return;
    setSaving(true);
    try {
      await onSaveEdit(role.id, {
        name: name.trim() || undefined,
        description: description.trim() || null,
        permissions: localPermissions,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const title = showLoading ? t("roles.loading") : isCreate ? t("roles.newRole") : (role?.name ?? t("roles.permissionsTitle"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={SHEET_CONTENT_CLASS}
        aria-describedby={undefined}
      >
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle className="text-base font-semibold sm:text-lg">
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className={SHEET_BODY_CLASS}>
          <div className={cn("flex min-w-0 flex-1 flex-col gap-4 p-2", SHEET_SCROLL_CLASS)}>
            {showLoading && (
              <p className="text-sm text-muted-foreground py-6 text-center">{t("roles.loadingRole")}</p>
            )}
            {isLoadFailed && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                {loadError}
              </p>
            )}
            {!showLoading && (
              <>
                <div className={cn("grid gap-3", SHEET_FORM_PADDING)}>
              <div className="grid gap-2">
                <Label htmlFor="role-name">{t("roles.name")}</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("roles.namePlaceholder")}
                  disabled={saving || isSystemAdmin}
                  className={SHEET_INPUT_CLASS}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-code">{t("roles.code")}</Label>
                <Input
                  id="role-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (isCreate) setCodeManuallyEdited(true);
                  }}
                  placeholder={t("roles.codePlaceholder")}
                  disabled={saving || !isCreate || isSystemAdmin}
                  className={SHEET_INPUT_CLASS}
                />
                {isCreate && (
                  <p className="text-xs text-muted-foreground">{t("roles.codeAutoGenerated")}</p>
                )}
                {!isCreate && (
                  <p className="text-xs text-muted-foreground">{t("roles.codeCannotChange")}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-desc">{t("roles.descLabel")}</Label>
                <Input
                  id="role-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("roles.descPlaceholder")}
                  disabled={saving || isSystemAdmin}
                  className={SHEET_INPUT_CLASS}
                />
              </div>
            </div>

            <h3 className="text-sm font-medium text-foreground pt-2">{t("roles.permissionsTitle")}</h3>
            {PERMISSION_SECTIONS.map((section) => {
              const sectionPerms = getSectionPermissions(localPermissions, section.id);
              return (
                <div
                  key={section.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-3"
                >
                  <h4 className="text-sm font-medium text-foreground">
                    {t(`permissions.${section.id}`)}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {section.actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`${section.id}-${action.id}`}
                          checked={sectionPerms[action.id] ?? false}
                          onCheckedChange={(checked) =>
                            setAction(section.id, action.id, checked === true)
                          }
                          disabled={isSystemAdmin}
                        />
                        <Label
                          htmlFor={`${section.id}-${action.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {t(`permissions.${section.id}_${action.id}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
              </>
            )}
          </div>
        </div>

        <SheetFooter className={SHEET_FOOTER_CLASS}>
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {isSystemAdmin ? t("roles.close") : t("productsConfig.common.cancel")}
            </Button>
            {!isSystemAdmin && !isLoadFailed && !showLoading && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("users.saving") : t("productsConfig.common.save")}
              </Button>
            )}
          </div>
          {isSystemAdmin && (
            <p className="text-xs text-muted-foreground w-full text-center">
              {t("roles.systemRoleDefault")}
            </p>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
