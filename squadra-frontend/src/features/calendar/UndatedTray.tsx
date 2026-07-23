import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../../types";
import { CalendarChip } from "./CalendarChip";

/** Bandeja lateral de tareas sin fecha, arrastrables al calendario.
 *  También es droppable (id "__undated__") para quitarle la fecha a una tarea. */
export function UndatedTray({ tasks }: { tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "__undated__" });

  return (
    <aside
      ref={setNodeRef}
      style={{
        width: 208,
        flex: "0 0 208px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3)",
        border: "1px solid var(--gray-200)",
        borderRadius: "var(--radius-md)",
        background: isOver ? "var(--brand-50)" : "var(--gray-50)",
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--gray-700)" }}>
        Sin fecha <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>
          Arrastrá una tarea aquí para quitarle la fecha.
        </p>
      ) : (
        tasks.map((t) => <CalendarChip key={t.id} task={t} />)
      )}
    </aside>
  );
}
