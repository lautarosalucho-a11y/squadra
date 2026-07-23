import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { MY_PROJECTS, MY_TASKS, UPDATE_TASK } from "../../graphql/operations";
import type { Task, TaskStatus } from "../../types";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface TasksData {
  myTasks: Task[];
}
interface ProjectsData {
  myProjects: { id: string; name: string }[];
}

type Tab = "upcoming" | "overdue" | "done";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function HomeView() {
  const [{ data }] = useQuery<TasksData>({ query: MY_TASKS });
  const [{ data: projData }] = useQuery<ProjectsData>({ query: MY_PROJECTS });
  const [, updateTask] = useMutation(UPDATE_TASK);

  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (data?.myTasks) setTasks(data.myTasks);
  }, [data]);

  const [tab, setTab] = useState<Tab>("upcoming");

  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    (projData?.myProjects ?? []).forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projData]);

  const today = startOfDay(new Date());
  const buckets = useMemo(() => {
    const upcoming: Task[] = [];
    const overdue: Task[] = [];
    const done: Task[] = [];
    for (const t of tasks) {
      if (t.status === "done") done.push(t);
      else if (t.dueDate && startOfDay(new Date(t.dueDate)) < today) overdue.push(t);
      else upcoming.push(t);
    }
    return { upcoming, overdue, done };
  }, [tasks, today]);

  const current = buckets[tab];
  const doneCount = buckets.done.length;

  async function toggleDone(task: Task, done: boolean) {
    const next: "done" | "todo" = done ? "done" : "todo";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    const res = await updateTask({ id: task.id, input: { status: next } });
    const updated = res.data?.updateTask as { id: string; status: TaskStatus; version: number } | undefined;
    if (updated) {
      // Fuente de verdad: lo que devolvió el servidor.
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status, version: updated.version } : t)),
      );
    } else {
      // Falló: revertir al estado previo.
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)", textTransform: "capitalize" }}>
        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
      </div>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-2) 0 var(--space-1)" }}>
        {greeting()} 👋
      </h1>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", marginBottom: "var(--space-6)" }}>
        {doneCount} {doneCount === 1 ? "tarea finalizada" : "tareas finalizadas"} · {tasks.length} asignadas
      </div>

      <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)" }}>
        <div style={{ display: "flex", gap: "var(--space-4)", padding: "0 var(--space-5)", borderBottom: "1px solid var(--gray-200)" }}>
          {([
            ["upcoming", "Próximas", buckets.upcoming.length],
            ["overdue", "Con retraso", buckets.overdue.length],
            ["done", "Finalizadas", buckets.done.length],
          ] as const).map(([key, label, count]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  padding: "var(--space-3) 0",
                  fontSize: "var(--text-sm)",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--gray-900)" : "var(--gray-600)",
                  borderBottom: active ? "2px solid var(--brand-500)" : "2px solid transparent",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ marginLeft: 6, color: key === "overdue" ? "var(--danger)" : "var(--gray-400)" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {current.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>
            {tab === "done" ? "Todavía no completaste tareas." : "Nada por acá 🎉"}
          </div>
        ) : (
          current.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-5)",
                borderBottom: "1px solid var(--gray-100)",
              }}
            >
              <input
                type="checkbox"
                checked={t.status === "done"}
                aria-label="Completar"
                onChange={(e) => toggleDone(t, e.target.checked)}
                style={{ accentColor: "var(--brand-500)", cursor: "pointer" }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "var(--text-md)",
                  color: "var(--gray-900)",
                  textDecoration: t.status === "done" ? "line-through" : "none",
                  opacity: t.status === "done" ? 0.6 : 1,
                }}
              >
                {t.title}
              </span>
              {projectName.get(t.projectId ?? "") && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--brand-700)", background: "var(--brand-50)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}>
                  {projectName.get(t.projectId ?? "")}
                </span>
              )}
              <span style={{ fontSize: "var(--text-sm)", color: tab === "overdue" ? "var(--danger)" : "var(--gray-400)", minWidth: 64, textAlign: "right" }}>
                {t.dueDate ? format(new Date(t.dueDate), "dd MMM", { locale: es }) : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
