import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../../types";

/** Chip de tarea arrastrable dentro del calendario (o desde la bandeja sin fecha). */
export function CalendarChip({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={task.title}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px var(--space-2)",
        borderRadius: "var(--radius-sm)",
        background: `var(--status-${task.status}-bg)`,
        color: `var(--status-${task.status}-fg)`,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        cursor: "grab",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--radius-full)",
          background: "currentColor",
          flex: "0 0 auto",
        }}
      />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
    </div>
  );
}
