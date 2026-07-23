import { useDroppable } from "@dnd-kit/core";
import { isSameMonth, isToday } from "date-fns";
import type { Task } from "../../types";
import { dayKey } from "./dateUtils";
import { CalendarChip } from "./CalendarChip";

interface Props {
  date: Date;
  cursor: Date;
  tasks: Task[];
}

const MAX_VISIBLE = 3;

/** Celda-día: zona droppable identificada por su clave yyyy-MM-dd. */
export function DayCell({ date, cursor, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(date) });
  const outside = !isSameMonth(date, cursor);
  const today = isToday(date);
  const visible = tasks.slice(0, MAX_VISIBLE);
  const extra = tasks.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 104,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "var(--space-1)",
        border: "1px solid var(--gray-200)",
        background: isOver ? "var(--brand-50)" : outside ? "var(--gray-50)" : "var(--gray-0)",
        transition: "background var(--motion-fast) var(--ease)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 2px" }}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: today ? 700 : 400,
            color: today ? "#fff" : outside ? "var(--gray-400)" : "var(--gray-600)",
            background: today ? "var(--brand-500)" : "transparent",
            borderRadius: "var(--radius-full)",
            minWidth: 18,
            height: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {date.getDate()}
        </span>
      </div>
      {visible.map((t) => (
        <CalendarChip key={t.id} task={t} />
      ))}
      {extra > 0 && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", paddingLeft: 2 }}>
          +{extra} más
        </span>
      )}
    </div>
  );
}
