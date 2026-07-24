import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { CREATE_TASK, MY_PROJECTS, MY_TASKS, UPDATE_TASK } from "../../graphql/operations";
import type { Task, TaskStatus } from "../../types";
import { InlineDate } from "../list/InlineDate";
import { differenceInCalendarDays, startOfDay } from "date-fns";

interface Project {
  id: string;
  name: string;
}

type BucketKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "recent" | "done";

const SECTIONS: { key: BucketKey; label: string; danger?: boolean }[] = [
  { key: "overdue", label: "Atrasadas", danger: true },
  { key: "today", label: "Para hacer hoy" },
  { key: "tomorrow", label: "Para hacer mañana" },
  { key: "week", label: "Para hacer la próxima semana" },
  { key: "later", label: "Para hacer más tarde" },
  { key: "recent", label: "Asignadas recientemente" },
  { key: "done", label: "Completadas" },
];

export function MyTasksPage() {
  const [{ data }] = useQuery<{ myTasks: Task[] }>({ query: MY_TASKS });
  const [{ data: projData }] = useQuery<{ myProjects: Project[] }>({ query: MY_PROJECTS });
  const [, updateTask] = useMutation(UPDATE_TASK);
  const [, createTask] = useMutation(CREATE_TASK);

  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (data?.myTasks) setTasks(data.myTasks);
  }, [data]);

  const [collapsed, setCollapsed] = useState<Set<BucketKey>>(new Set(["done"]));
  const [quickTitle, setQuickTitle] = useState("");

  const projects = useMemo(() => projData?.myProjects ?? [], [projData]);
  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const today = startOfDay(new Date());
  const grouped = useMemo(() => {
    const g: Record<BucketKey, Task[]> = { overdue: [], today: [], tomorrow: [], week: [], later: [], recent: [], done: [] };
    for (const t of tasks) {
      if (t.status === "done") { g.done.push(t); continue; }
      if (!t.dueDate) { g.recent.push(t); continue; }
      const diff = differenceInCalendarDays(startOfDay(new Date(t.dueDate)), today);
      if (diff < 0) g.overdue.push(t);
      else if (diff === 0) g.today.push(t);
      else if (diff === 1) g.tomorrow.push(t);
      else if (diff <= 7) g.week.push(t);
      else g.later.push(t);
    }
    return g;
  }, [tasks, today]);

  function toggleSection(k: BucketKey) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  async function toggleDone(task: Task, done: boolean) {
    const next: TaskStatus = done ? "done" : "todo";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    await updateTask({ id: task.id, input: { status: next } });
  }
  async function setDue(task: Task, iso: string | null) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, dueDate: iso } : t)));
    await updateTask({ id: task.id, input: { dueDate: iso } });
  }
  async function quickCreate(e: FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || projects.length === 0) return;
    await createTask({ input: { projectId: projects[0].id, title } });
    setQuickTitle("");
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "var(--space-6)" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-4)" }}>Mis tareas</h1>

      {projects.length > 0 && (
        <form onSubmit={quickCreate} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) 0 var(--space-3)", borderBottom: "1px solid var(--gray-200)" }}>
          <span style={{ color: "var(--brand-600)", fontWeight: 600, fontSize: "var(--text-sm)" }}>＋ Agregar tarea</span>
          <input
            value={quickTitle}
            placeholder="…y presioná Enter"
            aria-label="Agregar tarea"
            onChange={(e) => setQuickTitle(e.target.value)}
            style={{ flex: 1, height: 30, border: "none", outline: "none", background: "transparent", fontSize: "var(--text-md)", fontFamily: "inherit" }}
          />
        </form>
      )}

      {/* Encabezado de columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 96px", gap: "var(--space-3)", padding: "var(--space-3) var(--space-2) var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: 0.3 }}>
        <span>Nombre</span>
        <span>Proyecto</span>
        <span style={{ textAlign: "right" }}>Vence</span>
      </div>

      {SECTIONS.map((s) => {
        const items = grouped[s.key];
        if (items.length === 0) return null;
        const isCollapsed = collapsed.has(s.key);
        return (
          <section key={s.key} style={{ marginBottom: "var(--space-2)" }}>
            <button
              type="button"
              onClick={() => toggleSection(s.key)}
              style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2)", width: "100%", boxSizing: "border-box" }}
            >
              <span style={{ color: "var(--gray-400)", transform: isCollapsed ? "none" : "rotate(90deg)", transition: "transform var(--motion-fast) var(--ease)" }}>▸</span>
              <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: s.danger ? "var(--danger)" : "var(--gray-900)" }}>{s.label}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)" }}>{items.length}</span>
            </button>

            {!isCollapsed &&
              items.map((t) => {
                const done = t.status === "done";
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 96px", gap: "var(--space-3)", alignItems: "center", padding: "var(--space-2)", paddingLeft: "var(--space-6)", borderTop: "1px solid var(--gray-100)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                      <input type="checkbox" checked={done} aria-label="Completar" onChange={(e) => toggleDone(t, e.target.checked)} style={{ accentColor: "var(--brand-500)", cursor: "pointer" }} />
                      <span style={{ fontSize: "var(--text-md)", color: "var(--gray-900)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    </div>
                    <span style={{ minWidth: 0 }}>
                      {projectName.get(t.projectId ?? "") && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--brand-700)", background: "var(--brand-50)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}>
                          {projectName.get(t.projectId ?? "")}
                        </span>
                      )}
                    </span>
                    <span style={{ textAlign: "right" }} title="Fecha de entrega">
                      <InlineDate value={t.dueDate} onCommit={(iso) => setDue(t, iso)} />
                    </span>
                  </div>
                );
              })}
          </section>
        );
      })}

      {tasks.length === 0 && (
        <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>
          No tenés tareas asignadas. Creá una arriba.
        </div>
      )}
    </div>
  );
}
