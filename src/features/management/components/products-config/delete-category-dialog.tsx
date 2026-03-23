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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("productsConfig.deleteCategory.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {category.typesCount > 0 ? (
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
