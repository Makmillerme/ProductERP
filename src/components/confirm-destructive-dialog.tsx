"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmDestructiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Content between header and footer (forms, custom blocks). */
  children?: React.ReactNode;
  /** Inline error under optional children. */
  errorMessage?: string | null;
  cancelLabel: string;
  confirmLabel: string;
  confirmPendingLabel?: string;
  confirmPending?: boolean;
  cancelDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Primary button style: destructive (default) or default (e.g. unban). */
  confirmTone?: "destructive" | "default";
  contentSize?: React.ComponentProps<typeof AlertDialogContent>["size"];
  contentClassName?: string;
};

/**
 * Standard confirm pattern: AlertDialog + cancel / confirm, optional loading and error line.
 * Confirm uses preventDefault so the dialog stays open until `onOpenChange(false)`.
 */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  errorMessage,
  cancelLabel,
  confirmLabel,
  confirmPendingLabel,
  confirmPending = false,
  cancelDisabled = false,
  onConfirm,
  confirmTone = "destructive",
  contentSize = "default",
  contentClassName,
}: ConfirmDestructiveDialogProps) {
  const confirmBusyLabel = confirmPendingLabel ?? confirmLabel;
  const isDestructive = confirmTone === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size={contentSize} className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && description !== "" && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        {errorMessage ? (
          <AlertDialogBody>
            <p className="text-sm text-destructive">{errorMessage}</p>
          </AlertDialogBody>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelDisabled || confirmPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? "destructive" : "default"}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            disabled={confirmPending}
          >
            {confirmPending ? confirmBusyLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
