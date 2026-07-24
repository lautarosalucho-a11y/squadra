import { useDraggable } from "@dnd-kit/core";
import { Avatar, Card, StatusPill } from "../../components/ui";
import type { Task } from "../../types";
import { taskPanel } from "../comments/taskPanelStore";

import { localNoon } from "../../lib/dateOnly";

function formatDue(due: string | null): string | null {
  if (!due) return null;
  return localNoon(due).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

/** Tarjeta de tarea arrastrable dentro del Tablero. */
export function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { sectionId: task.sectionId },
  });

  const due = formatDue(task.dueDate);

  return (
    <Card
      ref={setNodeRef}
      interactive
      dragging={isDragging}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <span style={{ fontSize: "var(--text-md)", color: "var(--gray-900)", fontWeight: 500 }}>
        {task.title}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusPill status={task.status} />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {due && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>{due}</span>
          )}
          <button
            type="button"
            aria-label="Abrir comentarios"
            title="Comentarios"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => taskPanel.open(task.id)}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, color: "var(--gray-400)" }}
          >
            💬
          </button>
          <Avatar name={task.assigneeId ? task.assigneeId.slice(0, 2) : null} size="sm" />
        </div>
      </div>
    </Card>
  );
}
