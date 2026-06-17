"use client";

import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Löschen",
  cancelLabel = "Abbrechen",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-overlay-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-stroke-subtle bg-surface-elevated p-6 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft">
            <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-content-base">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-content-muted">{description}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-stroke-subtle pt-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
