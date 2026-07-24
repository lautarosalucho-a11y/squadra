import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CREATE_SECTION,
  CREATE_TASK,
  MARK_TASK_COMMENTS_READ,
  MOVE_TASK,
  PROJECT_CF_VALUES,
  PROJECT_CUSTOM_FIELDS,
  PROJECT_LIST,
  PROJECT_MEMBERS,
  PROJECT_TASK_META,
  SET_CF_VALUE,
  UPDATE_TASK,
  UPLOAD_ATTACHMENT,
} from "../../graphql/operations";
import {
  STATUS_ORDER,
  type CustomField,
  type CustomFieldValue,
  type GroupedTasks,
  type ProjectMember,
  type Task,
  type TaskStatus,
} from "../../types";
import { InlineEdit } from "./InlineEdit";
import { InlineDate } from "./InlineDate";
import { StatusSelect } from "./StatusSelect";
import { AssigneeSelect } from "./AssigneeSelect";
import { CustomFieldCell } from "./CustomFieldCell";
import { AddTaskRow } from "./AddTaskRow";
import { ListToolbar, type ColumnDef, type GroupMode } from "./ListToolbar";
import { useProjectRealtime } from "../realtime/useProjectRealtime";
import { taskPanel } from "../comments/taskPanelStore";

interface TaskPatch {
  title?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  description?: { text?: string } | null;
}
type CfMap = Map<string, CustomFieldValue["value"]>;
const cfKey = (taskId: string, fieldId: string) => `${taskId}:${fieldId}`;

const FIXED_COLS: { id: string; label: string; width: string }[] = [
  { id: "status", label: "Estado", width: "132px" },
  { id: "assignee", label: "Responsable", width: "152px" },
  { id: "due", label: "Vence", width: "92px" },
  { id: "description", label: "Descripción", width: "minmax(160px,1fr)" },
];

function patchTree(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) => {
    if (t.id === id) return { ...t, ...patch };
    if (t.subtasks?.length) return { ...t, subtasks: patchTree(t.subtasks, id, patch) };
    return t;
  });
}

export function ListView() {
  const { projectId = "demo" } = useParams();
  const [{ data, fetching, error }, refetch] = useQuery<{ projectTasks: GroupedTasks }>({
    query: PROJECT_LIST,
    variables: { projectId, groupBy: "SECTION" },
  });
  const [{ data: memData }] = useQuery<{ projectMembers: ProjectMember[] }>({
    query: PROJECT_MEMBERS,
    variables: { projectId },
  });
  const [{ data: fieldData }] = useQuery<{ projectCustomFields: CustomField[] }>({
    query: PROJECT_CUSTOM_FIELDS,
    variables: { projectId },
  });
  const [{ data: valData }] = useQuery<{ projectCustomFieldValues: CustomFieldValue[] }>({
    query: PROJECT_CF_VALUES,
    variables: { projectId },
  });
  const [{ data: metaData }, refetchMeta] = useQuery<{
    projectTaskMeta: { taskId: string; attachmentCount: number; commentCount: number; unreadCommentCount: number }[];
  }>({ query: PROJECT_TASK_META, variables: { projectId } });
  const [, updateTask] = useMutation(UPDATE_TASK);
  const [, createTask] = useMutation(CREATE_TASK);
  const [, moveTask] = useMutation(MOVE_TASK);
  const [, setCfValue] = useMutation(SET_CF_VALUE);
  const [, createSection] = useMutation(CREATE_SECTION);
  const [, uploadAttachment] = useMutation(UPLOAD_ATTACHMENT);
  const [, markTaskCommentsRead] = useMutation(MARK_TASK_COMMENTS_READ);

  const meta = useMemo(() => {
    const m = new Map<string, { attachmentCount: number; commentCount: number; unreadCommentCount: number }>();
    (metaData?.projectTaskMeta ?? []).forEach((x) =>
      m.set(x.taskId, { attachmentCount: x.attachmentCount, commentCount: x.commentCount, unreadCommentCount: x.unreadCommentCount }),
    );
    return m;
  }, [metaData]);

  async function onAttach(taskId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    await uploadAttachment({ input: { taskId, fileName: file.name, mimeType: file.type || null, base64 } });
    refetchMeta({ requestPolicy: "network-only" });
  }
  function onOpenComments(taskId: string) {
    taskPanel.open(taskId);
    markTaskCommentsRead({ taskId });
    setTimeout(() => refetchMeta({ requestPolicy: "network-only" }), 300);
  }

  const [board, setBoard] = useState<GroupedTasks | null>(null);
  useEffect(() => {
    if (data?.projectTasks) setBoard(data.projectTasks);
  }, [data]);

  const [cfValues, setCfValues] = useState<CfMap>(new Map());
  useEffect(() => {
    const m: CfMap = new Map();
    (valData?.projectCustomFieldValues ?? []).forEach((v) =>
      m.set(cfKey(v.taskId, v.customFieldId), v.value),
    );
    setCfValues(m);
  }, [valData]);

  const members = useMemo(() => memData?.projectMembers ?? [], [memData]);
  const fields = useMemo(
    () => [...(fieldData?.projectCustomFields ?? [])].sort((a, b) => a.position - b.position),
    [fieldData],
  );
  const groups = useMemo(() => board?.groups ?? [], [board]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useProjectRealtime(projectId, { onChange: () => refetch({ requestPolicy: "network-only" }) });

  // Toolbar state
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "">("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<GroupMode>("section");

  // Column visibility (persistida por proyecto)
  const cfCols: ColumnDef[] = fields.map((f) => ({ id: `cf:${f.id}`, label: f.name }));
  const toggleable: ColumnDef[] = [...FIXED_COLS.map((c) => ({ id: c.id, label: c.label })), ...cfCols];
  const storeKey = `squadra.cols.${projectId}`;
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) return new Set(JSON.parse(raw));
    } catch {
      /* noop */
    }
    return new Set(["status", "assignee", "due", "description"]);
  });
  useEffect(() => {
    // Mostrar por defecto los campos personalizados nuevos.
    setVisibleCols((prev) => {
      const next = new Set(prev);
      cfCols.forEach((c) => next.has(c.id) || next.add(c.id));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);
  function toggleCol(id: string) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(storeKey, JSON.stringify([...next]));
      return next;
    });
  }

  const reorderMode = groupBy === "section" && !sortCol && !filterStatus && !filterAssignee;

  // Columnas activas y grid template
  const activeCols = useMemo(() => {
    const cols: { id: string; label: string; width: string }[] = [
      { id: "name", label: "Tarea", width: "minmax(220px,1.6fr)" },
    ];
    FIXED_COLS.forEach((c) => visibleCols.has(c.id) && cols.push(c));
    fields.forEach(
      (f) => visibleCols.has(`cf:${f.id}`) && cols.push({ id: `cf:${f.id}`, label: f.name, width: "150px" }),
    );
    return cols;
  }, [visibleCols, fields]);
  const template = (reorderMode ? "18px " : "") + activeCols.map((c) => c.width).join(" ");

  // ---- pipeline: flatten → filter → sort → group ----
  interface FlatTask {
    task: Task;
    sectionKey: string | null;
    sectionLabel: string;
  }
  const rowsByGroup = useMemo(() => {
    const flat: FlatTask[] = [];
    for (const g of groups) {
      for (const t of g.tasks) {
        flat.push({ task: t, sectionKey: g.key, sectionLabel: g.label ?? "Sin sección" });
      }
    }
    let filtered = flat;
    if (filterStatus) filtered = filtered.filter((f) => f.task.status === filterStatus);
    if (filterAssignee) filtered = filtered.filter((f) => f.task.assigneeId === filterAssignee);

    if (sortCol) {
      const dir = sortDir === "asc" ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        let r = 0;
        if (sortCol === "name") r = a.task.title.localeCompare(b.task.title);
        else if (sortCol === "status") r = STATUS_ORDER.indexOf(a.task.status) - STATUS_ORDER.indexOf(b.task.status);
        else if (sortCol === "due") {
          const av = a.task.dueDate ? Date.parse(a.task.dueDate) : Infinity;
          const bv = b.task.dueDate ? Date.parse(b.task.dueDate) : Infinity;
          r = av - bv;
        }
        return r * dir;
      });
    }

    // group
    const out: { key: string; label: string; sectionKey: string | null; items: FlatTask[] }[] = [];
    const idx = new Map<string, number>();
    const push = (key: string, label: string, sectionKey: string | null, ft: FlatTask) => {
      let i = idx.get(key);
      if (i === undefined) {
        i = out.length;
        idx.set(key, i);
        out.push({ key, label, sectionKey, items: [] });
      }
      out[i].items.push(ft);
    };
    for (const ft of filtered) {
      if (groupBy === "section") push(ft.sectionKey ?? "__none__", ft.sectionLabel, ft.sectionKey, ft);
      else if (groupBy === "assignee") {
        const m = members.find((x) => x.id === ft.task.assigneeId);
        push(ft.task.assigneeId ?? "__none__", m?.fullName ?? "Sin asignar", null, ft);
      } else push("all", "Todas las tareas", null, ft);
    }
    return out;
  }, [groups, filterStatus, filterAssignee, sortCol, sortDir, groupBy, members]);

  // ---- handlers ----
  async function onPatch(task: Task, patch: TaskPatch) {
    setBoard((prev) =>
      prev ? { groups: prev.groups.map((g) => ({ ...g, tasks: patchTree(g.tasks, task.id, patch) })) } : prev,
    );
    const res = await updateTask({ id: task.id, input: { ...patch } });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onSetCf(taskId: string, field: CustomField, value: CustomFieldValue["value"] | null) {
    setCfValues((prev) => {
      const next = new Map(prev);
      next.set(cfKey(taskId, field.id), value ?? undefined);
      return next;
    });
    const res = await setCfValue({ input: { taskId, customFieldId: field.id, value } });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onCreate(sectionId: string | null, title: string) {
    const res = await createTask({ input: { projectId, title, sectionId: sectionId ?? undefined } });
    if (!res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onCreateSection(name: string) {
    const res = await createSection({ input: { projectId, name } });
    if (!res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onReorder(sectionKey: string | null, e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const g = groups.find((x) => x.key === sectionKey);
    if (!g) return;
    const ids = g.tasks.map((t) => t.id);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    const nextTasks = arrayMove(g.tasks, from, to);
    setBoard((prev) =>
      prev ? { groups: prev.groups.map((x) => (x.key === sectionKey ? { ...x, tasks: nextTasks } : x)) } : prev,
    );
    const beforeTaskId = to > 0 ? nextTasks[to - 1].id : undefined;
    const afterTaskId = to < nextTasks.length - 1 ? nextTasks[to + 1].id : undefined;
    const res = await moveTask({ input: { taskId: String(e.active.id), sectionId: sectionKey, beforeTaskId, afterTaskId } });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }

  if (fetching && !board) return <Centered>Cargando lista…</Centered>;
  if (error && !board)
    return (
      <Centered>
        No se pudo cargar la lista. Verificá el backend en <code>{import.meta.env.VITE_GRAPHQL_URL}</code>.
      </Centered>
    );

  const ctx: RowCtx = { activeCols, template, reorderMode, fields, members, cfValues, meta, onPatch, onSetCf, onAttach, onOpenComments };

  return (
    <div style={{ padding: "var(--space-4) var(--space-2)" }}>
      <ListToolbar
        members={members}
        toggleableColumns={toggleable}
        visibleCols={visibleCols}
        onToggleCol={toggleCol}
        filterStatus={filterStatus}
        onFilterStatus={setFilterStatus}
        filterAssignee={filterAssignee}
        onFilterAssignee={setFilterAssignee}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={(c, d) => {
          setSortCol(c);
          setSortDir(d);
        }}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
      />

      <div style={{ overflowX: "auto", padding: "0 var(--space-2)" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: template, gap: "var(--space-2)", padding: "0 var(--space-2) var(--space-2)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: 0.3, minWidth: "fit-content" }}>
          {reorderMode && <span />}
          {activeCols.map((c) => (
            <span key={c.id}>{c.label}</span>
          ))}
        </div>

        {rowsByGroup.map((grp) => (
          <section key={grp.key} style={{ marginBottom: "var(--space-4)", minWidth: "fit-content" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2)", background: "var(--gray-100)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--gray-700)" }}>
              {grp.label}
              <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>{grp.items.length}</span>
            </div>

            {reorderMode ? (
              <DndContext sensors={sensors} onDragEnd={(e) => onReorder(grp.sectionKey, e)}>
                <SortableContext items={grp.items.map((f) => f.task.id)} strategy={verticalListSortingStrategy}>
                  {grp.items.map((f) => (
                    <Row key={f.task.id} task={f.task} depth={0} ctx={ctx} sortable />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              grp.items.map((f) => <Row key={f.task.id} task={f.task} depth={0} ctx={ctx} />)
            )}

            {groupBy === "section" && (
              <AddTaskRow onCreate={(title) => onCreate(grp.sectionKey, title)} />
            )}
          </section>
        ))}

        {groupBy === "section" && <AddSection onCreate={onCreateSection} />}
      </div>
    </div>
  );
}

/** Fila para crear una sección nueva en el proyecto. */
function AddSection({ onCreate }: { onCreate: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  if (!adding)
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2)", color: "var(--gray-600)", fontSize: "var(--text-sm)", fontWeight: 600 }}
      >
        <span style={{ color: "var(--gray-400)" }}>＋</span> Agregar sección
      </button>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim();
        if (n) onCreate(n);
        setName("");
        setAdding(false);
      }}
      style={{ padding: "var(--space-2)" }}
    >
      <input
        autoFocus
        value={name}
        placeholder="Nombre de la sección"
        aria-label="Nombre de la sección"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const n = name.trim();
          if (n) onCreate(n);
          setName("");
          setAdding(false);
        }}
        style={{ height: 32, padding: "0 var(--space-2)", fontSize: "var(--text-sm)", border: "1px solid var(--brand-500)", borderRadius: "var(--radius-sm)", outline: "none", fontFamily: "inherit" }}
      />
    </form>
  );
}

interface RowCtx {
  activeCols: { id: string; label: string; width: string }[];
  template: string;
  reorderMode: boolean;
  fields: CustomField[];
  members: ProjectMember[];
  cfValues: CfMap;
  meta: Map<string, { attachmentCount: number; commentCount: number; unreadCommentCount: number }>;
  onPatch: (task: Task, patch: TaskPatch) => void;
  onSetCf: (taskId: string, field: CustomField, value: CustomFieldValue["value"] | null) => void;
  onAttach: (taskId: string, file: File) => void;
  onOpenComments: (taskId: string) => void;
}

function Row({ task, depth, ctx, sortable }: { task: Task; depth: number; ctx: RowCtx; sortable?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const hasSub = (task.subtasks?.length ?? 0) > 0;
  const done = task.status === "done";
  const s = useSortable({ id: task.id, disabled: !sortable });
  const rowStyle = sortable
    ? { transform: CSS.Transform.toString(s.transform), transition: s.transition, opacity: s.isDragging ? 0.5 : 1 }
    : {};

  const fieldById = (fid: string) => ctx.fields.find((f) => f.id === fid);
  const fileRef = useRef<HTMLInputElement>(null);
  const m = ctx.meta.get(task.id);

  return (
    <>
      <div
        ref={sortable ? s.setNodeRef : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "grid",
          gridTemplateColumns: ctx.template,
          gap: "var(--space-2)",
          alignItems: "center",
          minHeight: 38,
          padding: "0 var(--space-2)",
          borderBottom: "1px solid var(--gray-100)",
          background: hover ? "var(--gray-50)" : "var(--gray-0)",
          ...rowStyle,
        }}
      >
        {ctx.reorderMode && (
          <span {...s.attributes} {...s.listeners} aria-label="Reordenar" style={{ cursor: "grab", color: "var(--gray-300)", fontSize: 13, textAlign: "center", visibility: hover ? "visible" : "hidden", touchAction: "none" }}>
            ⋮⋮
          </span>
        )}
        {ctx.activeCols.map((c) => {
          if (c.id === "name")
            return (
              <div key="name" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0, paddingLeft: depth * 24 }}>
                <button type="button" aria-label={hasSub ? "Expandir" : "Sin subtareas"} onClick={() => hasSub && setExpanded((v) => !v)} style={{ all: "unset", width: 14, cursor: hasSub ? "pointer" : "default", color: "var(--gray-400)", textAlign: "center", visibility: hasSub ? "visible" : "hidden", transform: expanded ? "rotate(90deg)" : "none" }}>
                  ▸
                </button>
                <input type="checkbox" checked={done} aria-label="Completar" onChange={(e) => ctx.onPatch(task, { status: e.target.checked ? "done" : "todo" })} style={{ accentColor: "var(--brand-500)", cursor: "pointer" }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <InlineEdit value={task.title} strikethrough={done} onCommit={(title) => ctx.onPatch(task, { title })} />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) ctx.onAttach(task.id, f);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                />
                <button
                  type="button"
                  aria-label="Adjuntar archivo"
                  title={(m?.attachmentCount ?? 0) > 0 ? `${m?.attachmentCount} archivo(s)` : "Adjuntar archivo"}
                  onClick={() => fileRef.current?.click()}
                  style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, color: (m?.attachmentCount ?? 0) > 0 ? "var(--brand-600)" : "var(--gray-400)", visibility: (m?.attachmentCount ?? 0) > 0 || hover ? "visible" : "hidden" }}
                >
                  📎{(m?.attachmentCount ?? 0) > 0 && <span style={{ fontSize: 11, fontWeight: 600 }}>{m?.attachmentCount}</span>}
                </button>
                <button
                  type="button"
                  aria-label="Comentarios"
                  title="Comentarios"
                  onClick={() => ctx.onOpenComments(task.id)}
                  style={{ all: "unset", cursor: "pointer", position: "relative", fontSize: 13, color: (m?.commentCount ?? 0) > 0 ? "var(--gray-600)" : "var(--gray-400)", visibility: (m?.commentCount ?? 0) > 0 || (m?.unreadCommentCount ?? 0) > 0 || hover ? "visible" : "hidden" }}
                >
                  💬
                  {(m?.unreadCommentCount ?? 0) > 0 && (
                    <span style={{ position: "absolute", top: -6, right: -8, minWidth: 15, height: 15, padding: "0 3px", boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", background: "var(--danger)", borderRadius: "var(--radius-full)" }}>
                      {(m?.unreadCommentCount ?? 0) > 9 ? "9+" : m?.unreadCommentCount}
                    </span>
                  )}
                </button>
              </div>
            );
          if (c.id === "status") return <StatusSelect key="status" status={task.status} onChange={(status) => ctx.onPatch(task, { status })} />;
          if (c.id === "assignee") return <AssigneeSelect key="assignee" assigneeId={task.assigneeId} members={ctx.members} onChange={(assigneeId) => ctx.onPatch(task, { assigneeId })} />;
          if (c.id === "due") return <InlineDate key="due" value={task.dueDate} onCommit={(dueDate) => ctx.onPatch(task, { dueDate })} />;
          if (c.id === "description")
            return (
              <div key="desc" style={{ minWidth: 0 }}>
                <InlineEdit value={task.description?.text ?? ""} placeholder="—" onCommit={(text) => ctx.onPatch(task, { description: { text } })} />
              </div>
            );
          if (c.id.startsWith("cf:")) {
            const f = fieldById(c.id.slice(3));
            if (!f) return <span key={c.id} />;
            return (
              <div key={c.id} style={{ minWidth: 0 }}>
                <CustomFieldCell field={f} value={ctx.cfValues.get(cfKey(task.id, f.id))} onCommit={(v) => ctx.onSetCf(task.id, f, v)} />
              </div>
            );
          }
          return <span key={c.id} />;
        })}
      </div>

      {expanded && task.subtasks?.map((st) => <Row key={st.id} task={st} depth={depth + 1} ctx={ctx} />)}
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: "var(--space-8)", color: "var(--gray-600)", textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
