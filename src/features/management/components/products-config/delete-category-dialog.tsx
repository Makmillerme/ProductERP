"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";

type DeleteCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { id: string; name: string; typesCount: number } | null;
  onSuccess: () => void;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
  onDelete,
}: DeleteCategoryDialogProps) {
  const { t, tFormat } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!category) return;
    setError(null);
    setLoading(true);
    try {
      await onDelete(category.id);
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.deleteFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("productsConfig.deleteCategory.title")}
      description={
        category.typesCount > 0 ? (
          <>
            {tFormat("productsConfig.deleteCategory.descriptionWithTypes", {
              name: category.name,
              count: String(category.typesCount),
            })}{" "}
            {t("productsConfig.common.cannotUndo")}
          </>
        ) : (
          <>
            {tFormat("productsConfig.deleteCategory.descriptionWithout", {
              name: category.name,
            })}{" "}
            {t("productsConfig.common.cannotUndo")}
          </>
        )
      }
      errorMessage={error}
      cancelLabel={t("productsConfig.common.cancel")}
      confirmLabel={t("productsConfig.common.delete")}
      confirmPendingLabel={t("productsConfig.common.deleting")}
      confirmPending={loading}
      onConfirm={handleConfirm}
    />
  );
}
