"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "backdrop:bg-ink/40 w-full max-w-md rounded-md border border-border bg-background p-6 text-foreground shadow-lg",
        className,
      )}
    >
      {title && <h2 className="mb-4 text-h5">{title}</h2>}
      {children}
    </dialog>
  );
}
