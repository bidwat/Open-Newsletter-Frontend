"use client";

import { useRef } from "react";

interface ImportFileActionsProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onImport?: () => void;
  importLabel?: string;
  selectLabel?: string;
  emptyLabel?: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
  showImportButton?: boolean;
}

export default function ImportFileActions({
  file,
  onFileChange,
  onImport,
  importLabel = "Import",
  selectLabel = "Select file",
  emptyLabel = "No file selected",
  accept = ".csv",
  disabled = false,
  className,
  showImportButton = true,
}: ImportFileActionsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const actionClassName = ["file-actions", className].filter(Boolean).join(" ");

  return (
    <>
      <div className={actionClassName}>
        <span className="file-name">{file ? file.name : emptyLabel}</span>
        <button
          type="button"
          className="button secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {selectLabel}
        </button>
        {showImportButton ? (
          <button type="button" onClick={onImport} disabled={disabled}>
            {importLabel}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="visually-hidden"
        onChange={(event) =>
          onFileChange(event.target.files ? event.target.files[0] : null)
        }
      />
    </>
  );
}
