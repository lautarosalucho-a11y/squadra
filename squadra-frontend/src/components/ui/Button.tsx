import { type ButtonHTMLAttributes, type CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  fontWeight: "var(--fw-medium)" as unknown as number,
  borderRadius: "var(--radius-md)",
  border: "1px solid transparent",
  cursor: "pointer",
  transition: "background var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease)",
  whiteSpace: "nowrap",
};

const sizes: Record<Size, CSSProperties> = {
  sm: { fontSize: "var(--text-sm)", padding: "0 var(--space-3)", height: 30 },
  md: { fontSize: "var(--text-md)", padding: "0 var(--space-4)", height: 38 },
};

const variants: Record<Variant, CSSProperties> = {
  primary: { background: "var(--brand-500)", color: "#fff" },
  secondary: { background: "var(--gray-0)", color: "var(--gray-900)", borderColor: "var(--gray-200)" },
  ghost: { background: "transparent", color: "var(--gray-700)" },
  danger: { background: "var(--danger)", color: "#fff" },
};

/**
 * Button — acción primaria/secundaria del sistema.
 * Variantes: primary · secondary · ghost · danger. Estados: hover, active, disabled, loading.
 * A11y: elemento <button> nativo, foco visible por :focus-visible global, aria-busy en loading.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        opacity: isDisabled ? 0.6 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
        ...style,
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
