import { useState } from "react";
import { format } from "date-fns";
import { dayPart, localNoon, toUtcDateIso } from "../../lib/dateOnly";

interface Props {
  value: string | null;
  onCommit: (iso: string | null) => void;
  /** Si está vacío, muestra un ícono de calendario en vez de "—" (estilo Asana). */
  emptyIcon?: boolean;
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** Celda de fecha editable. Al hacer click abre un date input. */
export function InlineDate({ value, onCommit, emptyIcon }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={value ? dayPart(value) : ""}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const v = e.target.value;
          onCommit(v ? toUtcDateIso(v) : null);
          setEditing(false);
        }}
        style={{
          height: 26,
          fontSize: "var(--text-sm)",
          border: "1px solid var(--brand-500)",
          borderRadius: "var(--radius-sm)",
          padding: "0 var(--space-1)",
          fontFamily: "inherit",
        }}
      />
    );
  }

  if (!value && emptyIcon) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Agregar fecha de entrega"
        aria-label="Agregar fecha de entrega"
        style={{
          all: "unset",
          cursor: "pointer",
          width: 28,
          height: 28,
          borderRadius: "var(--radius-full)",
          border: "1px dashed var(--gray-300)",
          color: "var(--gray-400)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CalendarIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Editar fecha"
      style={{
        all: "unset",
        cursor: "pointer",
        fontSize: "var(--text-sm)",
        color: value ? "var(--gray-600)" : "var(--gray-400)",
      }}
    >
      {value ? format(localNoon(value), "dd MMM") : "—"}
    </button>
  );
}
