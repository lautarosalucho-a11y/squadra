import { STATUS_LABELS, STATUS_ORDER, type TaskStatus } from "../../types";

interface Props {
  status: TaskStatus;
  onChange: (next: TaskStatus) => void;
}

/**
 * StatusSelect — cambia el estado de una tarea. Usa un <select> nativo estilizado
 * como pill (accesible por teclado de fábrica), con los tokens de color del estado.
 */
export function StatusSelect({ status, onChange }: Props) {
  return (
    <select
      value={status}
      aria-label="Estado de la tarea"
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      style={{
        appearance: "none",
        height: 22,
        padding: "0 var(--space-2)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        border: "none",
        cursor: "pointer",
        background: `var(--status-${status}-bg)`,
        color: `var(--status-${status}-fg)`,
      }}
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
