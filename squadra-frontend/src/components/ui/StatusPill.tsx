import { STATUS_LABELS, type TaskStatus } from "../../types";

/**
 * StatusPill — indicador visual del estado de una tarea.
 * Consume los tokens --status-<estado>-bg/fg, alineados con el enum TaskStatus del backend.
 * A11y: texto legible (no solo color) para no depender del daltonismo.
 */
export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 var(--space-2)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        background: `var(--status-${status}-bg)`,
        color: `var(--status-${status}-fg)`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
