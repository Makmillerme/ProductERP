"use client";

import { useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export type PendingMediaItem = { file: File; preview: string };

export type VehicleMediaUploaderRef = { openFileDialog: () => void };

type VehicleMediaUploaderProps = {
  vehicleId: number;
  onUpload: (file: File) => Promise<void>;
  onAddPending: (files: File[]) => void;
  disabled?: boolean;
  /** Не рендерити кнопку — відкриття діалогу через ref.openFileDialog() (наприклад з картки в каруселі). */
  hideButton?: boolean;
};

export const VehicleMediaUploader = forwardRef<VehicleMediaUploaderRef, VehicleMediaUploaderProps>(
  function VehicleMediaUploader(
    { vehicleId, onUpload, onAddPending, disabled, hideButton },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openFileDialog() {
        if (!disabled) inputRef.current?.click();
      },
    }), [disabled]);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        const list: File[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            list.push(file);
          }
        }
        if (vehicleId > 0) {
          list.forEach((file) => onUpload(file).catch(() => {}));
        } else {
          onAddPending(list);
        }
        e.target.value = "";
      },
      [vehicleId, onUpload, onAddPending]
    );

    return (
      <>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        {!hideButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="size-4" />
            Додати фото
          </Button>
        )}
      </>
    );
  }
);
