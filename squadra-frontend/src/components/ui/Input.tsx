import { type InputHTMLAttributes, useId } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input — campo de texto del sistema.
 * Estados: default, focus, disabled, error. A11y: label asociado por htmlFor,
 * aria-invalid + aria-describedby cuando hay error.
 */
export function Input({ label, error, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errId = `${inputId}-err`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--gray-700)" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errId : undefined}
        {...rest}
        style={{
          height: 38,
          padding: "0 var(--space-3)",
          fontSize: "var(--text-md)",
          color: "var(--gray-900)",
          background: "var(--gray-0)",
          border: `1px solid ${error ? "var(--danger)" : "var(--gray-200)"}`,
          borderRadius: "var(--radius-md)",
          outline: "none",
        }}
      />
      {error && (
        <span id={errId} style={{ fontSize: "var(--text-xs)", color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
