import { useState } from "react";
import { format } from "date-fns";

interface Props {
  value: string | null;
  onCommit: (iso: string | null) => void;
}

/** Celda de fecha editable. Muestra la fecha o "—"; al hacer click abre un date input. */
export function InlineDate({ value, onCommit }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={value ? format(new Date(value), "yyyy-MM-dd") : ""}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const v = e.target.value;
          onCommit(v ? new Date(v + "T00:00:00").toISOString() : null);
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
      {value ? format(new Date(value), "dd MMM") : "—"}
    </button>
  );
}
