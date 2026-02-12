"use client";

import type { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface ScrollableTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string | number;
  emptyState?: ReactNode;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  headerClassName?: string;
  rowBaseClassName?: string;
  headerBaseClassName?: string;
}

export default function ScrollableTable<T>({
  data,
  columns,
  rowKey,
  emptyState,
  className,
  rowClassName,
  headerClassName,
  rowBaseClassName = "table-row",
  headerBaseClassName = "table-row table-head",
}: ScrollableTableProps<T>) {
  const tableClassNames = ["table-core", className].filter(Boolean).join(" ");
  const headerClasses = [headerBaseClassName, headerClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="table-shell">
      <div className={tableClassNames}>
        {data.length === 0 ? (
          emptyState || <p className="muted">No data.</p>
        ) : (
          <>
            <div className={headerClasses}>
              {columns.map((column) => (
                <span key={column.key} className={column.headerClassName}>
                  {column.header}
                </span>
              ))}
            </div>
            {data.map((row, index) => {
              const rowClasses = [
                rowBaseClassName,
                typeof rowClassName === "function"
                  ? rowClassName(row, index)
                  : rowClassName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={rowKey(row)} className={rowClasses}>
                  {columns.map((column) => (
                    <span key={column.key} className={column.cellClassName}>
                      {column.cell(row)}
                    </span>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
