import { useRef, useState } from "react";
import { addDays } from "date-fns";
import type { Task } from "../../types";
import { ROW_H } from "./ganttUtils";

type Mode = "move" | "resize-l" | "resize-r";

export interface BarCommit {
  startDate: string | null;
  dueDate: string;
  version: number;
}

interface Props {
  task: Task;
  left: number;
  width: number;
  isMilestone: boolean;
  pxPerDay: number;
  linking: boolean; // hay una dependencia en curso desde otra barra
  linkingFrom: boolean; // esta barra es el origen del link en curso
  onCommit: (taskId: string, commit: BarCommit) => void;
  onStartLink: (taskId: string) => void;
  onPickTarget: (taskId: string) => void;
}

/** Barra de tarea con drag para mover y handles para redimensionar. */
export function GanttBar({
  task,
  left,
  width,
  isMilestone,
  pxPerDay,
  linking,
  linkingFrom,
  onCommit,
  onStartLink,
  onPickTarget,
}: Props) {
  const [delta, setDelta] = useState<{ dx: number; mode: Mode } | null>(null);
  const startX = useRef(0);

  function begin(mode: Mode, e: React.PointerEvent) {
    e.stopPropagation();
    if (linking) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    setDelta({ dx: 0, mode });
  }

  function move(e: React.PointerEvent) {
    if (!delta) return;
    setDelta({ ...delta, dx: e.clientX - startX.current });
  }

  function end() {
    if (!delta) return;
    const days = Math.round(delta.dx / pxPerDay);
    if (days !== 0) {
      const due = new Date(task.dueDate!);
      const start = task.startDate ? new Date(task.startDate) : null;
      let newStart = start;
      let newDue = due;
      if (delta.mode === "move") {
        newDue = addDays(due, days);
        newStart = start ? addDays(start, days) : null;
      } else if (delta.mode === "resize-r") {
        newDue = addDays(due, days);
      } else if (delta.mode === "resize-l" && start) {
        newStart = addDays(start, days);
      }
      // Evita fin < inicio
      if (!newStart || newStart <= newDue) {
        onCommit(task.id, {
          startDate: newStart ? newStart.toISOString() : null,
          dueDate: newDue.toISOString(),
          version: task.version,
        });
      }
    }
    setDelta(null);
  }

  const visualDx =
    delta?.mode === "move" ? delta.dx : 0;
  const visualLeft = left + visualDx + (delta?.mode === "resize-l" ? delta.dx : 0);
  const visualWidth =
    width +
    (delta?.mode === "resize-r" ? delta.dx : 0) -
    (delta?.mode === "resize-l" ? delta.dx : 0);

  const handleW = 6;

  return (
    <div
      onPointerMove={move}
      onPointerUp={end}
      onClick={() => linking && !linkingFrom && onPickTarget(task.id)}
      style={{
        position: "absolute",
        top: (ROW_H - 22) / 2,
        left: Math.max(visualLeft, 0),
        width: Math.max(visualWidth, pxPerDay),
        height: 22,
        display: "flex",
        alignItems: "center",
        borderRadius: "var(--radius-sm)",
        background:
          task.status === "blocked" ? "var(--status-blocked-fg)" : "var(--brand-500)",
        color: "#fff",
        fontSize: "var(--text-xs)",
        boxShadow: delta ? "var(--shadow-md)" : "none",
        cursor: linking ? "crosshair" : "grab",
        outline: linkingFrom ? "2px solid var(--brand-700)" : "none",
        userSelect: "none",
      }}
      title={task.title}
    >
      {/* Handle resize izquierdo */}
      {!isMilestone && !linking && (
        <span
          onPointerDown={(e) => begin("resize-l", e)}
          style={{ width: handleW, height: "100%", cursor: "ew-resize", flex: "0 0 auto" }}
        />
      )}
      <span
        onPointerDown={(e) => begin("move", e)}
        style={{
          flex: 1,
          padding: "0 var(--space-1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: "22px",
        }}
      >
        {task.title}
      </span>
      {/* Handle de dependencia */}
      {!linking && (
        <span
          title="Arrastrar dependencia: click aquí y luego en la tarea bloqueada"
          onClick={(e) => {
            e.stopPropagation();
            onStartLink(task.id);
          }}
          style={{
            width: 12,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        >
          ◦
        </span>
      )}
      {/* Handle resize derecho */}
      {!isMilestone && !linking && (
        <span
          onPointerDown={(e) => begin("resize-r", e)}
          style={{ width: handleW, height: "100%", cursor: "ew-resize", flex: "0 0 auto" }}
        />
      )}
    </div>
  );
}
