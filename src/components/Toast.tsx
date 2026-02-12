"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  tone?: "success" | "warning" | "error" | "info";
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  tone = "success",
  onDismiss,
  durationMs = 2400,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
