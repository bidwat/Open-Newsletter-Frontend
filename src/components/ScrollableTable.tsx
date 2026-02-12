"use client";

import type { ReactNode } from "react";

interface ScrollableTableProps {
  children: ReactNode;
  className?: string;
}

export default function ScrollableTable({
  children,
  className,
}: ScrollableTableProps) {
  const classNames = ["table-core", className].filter(Boolean).join(" ");

  return (
    <div className="table-shell">
      <div className={classNames}>{children}</div>
    </div>
  );
}
