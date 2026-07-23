import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProjectMember, Task, TaskStatus } from "../../types";
import { InlineEdit } from "./InlineEdit";
import { InlineDate } from "./InlineDate";
import { StatusSelect } from "./StatusSelect";
import { AssigneeSelect } from "./AssigneeSelect";
import { taskPanel } from "../comments/taskPanelStore";

export interface TaskPatch {
  title?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

interface Props {
  task: Task;
  members: ProjectMember[];
  depth?: number;
  sortable?: boolean; // solo las filas de nivel superior son reordenables
  onPatch: (task: Task, patch: TaskPatch) => void;
}

/** Fila de tarea con edición inline + subtareas anidadas (recursiva). */
export function ListRow({ task, members, depth = 0, sortable = false, onPatch }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
  const done = task.status === "done";

  const s = useSortable({ id: task.id, disabled: !sortable });
  const rowStyle = sortable
    ? { transform: CSS.Transform.toString(s.transform), transition: s.transition, opacity: s.isDragging ? 0.5 : 1 }
    : {};

  return (
    <>
      <div
        ref={sortable ? s.setNodeRef : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="row"
        style={{
          display: "grid",
          gridTemplateColumns: "16px 1fr 132px 140px 96px",
          alignItems: "center",
          gap: "var(--space-2)",
          minHeight: 40,
          padding: "0 var(--space-4)",
          paddingLeft: `calc(var(--space-4) + ${depth} * var(--space-6))`,
          borderBottom: "1px solid var(--gray-200)",
          background: hover ? "var(--gray-100)" : "var(--gray-0)",
          ...rowStyle,
        }}
      >
        {/* Handle de arrastre */}
        <span
          {...(sortable ? { ...s.attributes, ...s.listeners } : {})}
          aria-label="Reordenar"
          style={{
            cursor: sortable ? "grab" : "default",
            color: "var(--gray-300)",
            fontSize: 14,
            textAlign: "center",
            visibility: sortable && hover ? "visible" : "hidden",
            touchAction: "none",
          }}
        >
          ⋮⋮
        </span>

        {/* Título: caret + checkbox + texto editable */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
          <button
            type="button"
            aria-label={hasSubtasks ? (expanded ? "Colapsar subtareas" : "Expandir subtareas") : "Sin subtareas"}
            onClick={() => hasSubtasks && setExpanded((v) => !v)}
            style={{
              all: "unset",
              width: 16,
              cursor: hasSubtasks ? "pointer" : "default",
              color: "var(--gray-400)",
              textAlign: "center",
              visibility: hasSubtasks ? "visible" : "hidden",
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform var(--motion-fast) var(--ease)",
            }}
          >
            ▸
          </button>
          <input
            type="checkbox"
            checked={done}
            aria-label="Marcar como completada"
            onChange={(e) => onPatch(task, { status: e.target.checked ? "done" : "todo" })}
            style={{ accentColor: "var(--brand-500)", cursor: "pointer" }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <InlineEdit
              value={task.title}
              strikethrough={done}
              onCommit={(title) => onPatch(task, { title })}
            />
          </div>
          <button
            type="button"
            aria-label="Abrir comentarios"
            title="Comentarios"
            onClick={() => taskPanel.open(task.id)}
            style={{
              all: "unset",
              cursor: "pointer",
              fontSize: 14,
              padding: "0 var(--space-1)",
              color: "var(--gray-400)",
              visibility: hover ? "visible" : "hidden",
            }}
          >
            💬
          </button>
        </div>

        <StatusSelect status={task.status} onChange={(status) => onPatch(task, { status })} />

        <AssigneeSelect
          assigneeId={task.assigneeId}
          members={members}
          onChange={(assigneeId) => onPatch(task, { assigneeId })}
        />

        <InlineDate value={task.dueDate} onCommit={(dueDate) => onPatch(task, { dueDate })} />
      </div>

      {expanded &&
        task.subtasks?.map((st) => (
          <ListRow key={st.id} task={st} members={members} depth={depth + 1} onPatch={onPatch} />
        ))}
    </>
  );
}
