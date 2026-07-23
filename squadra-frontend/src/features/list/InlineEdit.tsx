import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  strikethrough?: boolean;
}

/**
 * InlineEdit — texto editable en la fila. Click para editar; Enter/blur confirma,
 * Esc cancela. No dispara commit si el valor no cambió. A11y: input con label oculto.
 */
export function InlineEdit({ value, onCommit, placeholder, strikethrough }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        aria-label="Editar título de la tarea"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{
          width: "100%",
          height: 28,
          padding: "0 var(--space-2)",
          fontSize: "var(--text-md)",
          border: "1px solid var(--brand-500)",
          borderRadius: "var(--radius-sm)",
          outline: "none",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click para editar"
      style={{
        all: "unset",
        cursor: "text",
        width: "100%",
        fontSize: "var(--text-md)",
        color: value ? "var(--gray-900)" : "var(--gray-400)",
        textDecoration: strikethrough ? "line-through" : "none",
        opacity: strikethrough ? 0.6 : 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "block",
      }}
    >
      {value || placeholder}
    </button>
  );
}
