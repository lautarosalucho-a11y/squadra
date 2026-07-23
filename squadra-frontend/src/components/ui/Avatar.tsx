interface Props {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md";
}

const px = { sm: 24, md: 32 };

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Avatar — identidad del responsable. Muestra imagen o iniciales como fallback.
 * A11y: alt/title con el nombre; role img cuando son iniciales.
 */
export function Avatar({ name, src, size = "md" }: Props) {
  const d = px[size];
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Responsable"}
        width={d}
        height={d}
        style={{ borderRadius: "var(--radius-full)", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name ?? "Sin responsable"}
      title={name ?? "Sin responsable"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: d,
        height: d,
        borderRadius: "var(--radius-full)",
        background: "var(--brand-100)",
        color: "var(--brand-700)",
        fontSize: size === "sm" ? 10 : 12,
        fontWeight: 600,
      }}
    >
      {initials(name)}
    </span>
  );
}
