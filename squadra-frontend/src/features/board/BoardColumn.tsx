import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import type { TaskGroup } from "../../types";

/** Columna del Tablero = una sección. Zona droppable para el drag de tareas. */
export function BoardColumn({ group }: { group: TaskGroup }) {
  const droppableId = group.key ?? "__none__";
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 288,
        flex: "0 0 288px",
        maxHeight: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--space-2) var(--space-2)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--gray-700)" }}>
          {group.label ?? "Sin sección"}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>
          {group.tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          padding: "var(--space-2)",
          background: isOver ? "var(--brand-50)" : "var(--gray-100)",
          borderRadius: "var(--radius-lg)",
          minHeight: 120,
          overflowY: "auto",
          transition: "background var(--motion-fast) var(--ease)",
        }}
      >
        {group.tasks.length === 0 ? (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)", padding: "var(--space-3)", textAlign: "center" }}>
            Sin tareas
          </div>
        ) : (
          group.tasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}
