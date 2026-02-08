"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
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
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
