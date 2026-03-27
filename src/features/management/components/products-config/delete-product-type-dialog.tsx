"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";

type DeleteProductTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: { id: string; name: string; productsCount: number } | null;
  onSuccess: () => void;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteProductTypeDialog({
  open,
  onOpenChange,
  productType,
  onSuccess,
  onDelete,
}: DeleteProductTypeDialogProps) {
  const { t, tFormat } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!productType) return;
    setError(null);
    setLoading(true);
    try {
      await onDelete(productType.id);
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

  if (!productType) return null;

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("productsConfig.deleteProductType.title")}
      description={
        productType.productsCount > 0 ? (
          <>
            {tFormat("productsConfig.deleteProductType.descriptionWithProducts", {
              name: productType.name,
              count: String(productType.productsCount),
            })}{" "}
            {t("productsConfig.common.cannotUndo")}
          </>
        ) : (
          <>
            {tFormat("productsConfig.deleteProductType.descriptionWithout", {
              name: productType.name,
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
