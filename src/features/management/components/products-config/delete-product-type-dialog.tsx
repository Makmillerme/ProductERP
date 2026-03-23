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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("productsConfig.deleteProductType.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {productType.productsCount > 0 ? (
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
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("productsConfig.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t("productsConfig.common.deleting") : t("productsConfig.common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
