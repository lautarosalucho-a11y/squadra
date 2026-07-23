import { useState } from "react";
import type { CustomField, CustomFieldValue } from "../../types";

interface Props {
  field: CustomField;
  value?: CustomFieldValue["value"];
  onCommit: (value: CustomFieldValue["value"] | null) => void;
}

/** Celda editable de un campo personalizado (text | number | dropdown). */
export function CustomFieldCell({ field, value, onCommit }: Props) {
  const [editing, setEditing] = useState(false);

  if (field.type === "dropdown") {
    const opts = field.options ?? [];
    const current = opts.find((o) => o.id === value?.optionId);
    return (
      <select
        value={value?.optionId ?? ""}
        aria-label={field.name}
        onChange={(e) => onCommit(e.target.value ? { optionId: e.target.value } : null)}
        style={{
          appearance: "none",
          border: "none",
          background: current?.color ? `${current.color}22` : "transparent",
          color: current?.color ?? "var(--gray-600)",
          borderRadius: "var(--radius-full)",
          padding: "2px var(--space-2)",
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          cursor: "pointer",
          maxWidth: "100%",
        }}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const display = field.type === "number" ? value?.number : value?.text;

  if (editing) {
    return (
      <input
        type={field.type === "number" ? "number" : "text"}
        autoFocus
        defaultValue={display ?? ""}
        aria-label={field.name}
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value.trim();
          if (field.type === "number") onCommit(v === "" ? null : { number: Number(v) });
          else onCommit(v === "" ? null : { text: v });
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        style={{
          width: "100%",
          height: 26,
          border: "1px solid var(--brand-500)",
          borderRadius: "var(--radius-sm)",
          padding: "0 var(--space-1)",
          fontSize: "var(--text-sm)",
          fontFamily: "inherit",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{
        all: "unset",
        cursor: "text",
        fontSize: "var(--text-sm)",
        color: display != null && display !== "" ? "var(--gray-900)" : "var(--gray-400)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "block",
        width: "100%",
      }}
    >
      {display != null && display !== "" ? String(display) : "—"}
    </button>
  );
}
