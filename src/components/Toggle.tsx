"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: ToggleProps) {
  const wrapperClassName = ["toggle", className].filter(Boolean).join(" ");
  const buttonClassName = ["toggle-button", checked ? "active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      {label ? <span className="toggle-label">{label}</span> : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={buttonClassName}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}
