import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  CREATE_TASK,
  MY_PROJECTS,
  MY_TASKS,
  UPDATE_TASK,
  WORKSPACE_MEMBERS,
} from "../../graphql/operations";
import type { Task, TaskStatus } from "../../types";
import { Avatar } from "../../components/ui";
import { InlineDate } from "../list/InlineDate";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface TasksData {
  myTasks: Task[];
}
interface Project {
  id: string;
  name: string;
  defaultView: string;
}
interface Member {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}
const VIEW_SLUG: Record<string, string> = { list: "list", board: "board", calendar: "calendar", gantt: "timeline" };

type Tab = "upcoming" | "overdue" | "done";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function HomeView() {
  const navigate = useNavigate();
  const [{ data }] = useQuery<TasksData>({ query: MY_TASKS });
  const [{ data: projData }] = useQuery<{ myProjects: Project[] }>({ query: MY_PROJECTS });
  const [{ data: memData }] = useQuery<{ workspaceMembers: Member[] }>({ query: WORKSPACE_MEMBERS });
  const [, updateTask] = useMutation(UPDATE_TASK);
  const [, createTask] = useMutation(CREATE_TASK);

  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (data?.myTasks) setTasks(data.myTasks);
  }, [data]);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [quickTitle, setQuickTitle] = useState("");

  const projects = useMemo(() => projData?.myProjects ?? [], [projData]);
  const members = useMemo(() => memData?.workspaceMembers ?? [], [memData]);
  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  async function onQuickCreate(e: FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || projects.length === 0) return;
    await createTask({ input: { projectId: projects[0].id, title } });
    setQuickTitle("");
  }

  async function onSetDue(task: Task, iso: string | null) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, dueDate: iso } : t)));
    await updateTask({ id: task.id, input: { dueDate: iso } });
  }

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

        {projects.length > 0 && (
          <form onSubmit={onQuickCreate} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-5)", borderBottom: "1px solid var(--gray-100)" }}>
            <span style={{ color: "var(--gray-400)" }}>＋</span>
            <input
              value={quickTitle}
              placeholder="Crear tarea"
              aria-label="Crear tarea"
              onChange={(e) => setQuickTitle(e.target.value)}
              style={{ flex: 1, height: 30, border: "none", outline: "none", background: "transparent", fontSize: "var(--text-md)", fontFamily: "inherit", color: "var(--gray-900)" }}
            />
          </form>
        )}

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
              <span style={{ minWidth: 72, textAlign: "right" }} title="Agregar fecha de entrega">
                <InlineDate value={t.dueDate} onCommit={(iso) => onSetDue(t, iso)} />
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bloques inferiores: Proyectos + Personas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
        <Panel title="Proyectos">
          <button type="button" onClick={() => navigate("/projects")} style={rowBtn}>
            <span style={tileIcon}>＋</span>
            <span style={{ fontWeight: 500 }}>Crear proyecto</span>
          </button>
          {projects.slice(0, 5).map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/projects/${p.id}/${VIEW_SLUG[p.defaultView] ?? "board"}`)} style={rowBtn}>
              <span style={{ ...tileIcon, background: "var(--brand-50)", color: "var(--brand-700)" }}>▦</span>
              <span>{p.name}</span>
            </button>
          ))}
        </Panel>

        <Panel title="Personas">
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2)" }}>
              <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.fullName}</span>
            </div>
          ))}
          <button type="button" onClick={() => navigate("/team")} style={rowBtn}>
            <span style={tileIcon}>＋</span>
            <span style={{ fontWeight: 500 }}>Invitar compañero</span>
          </button>
        </Panel>
      </div>
    </div>
  );
}

const rowBtn: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  padding: "var(--space-2)",
  borderRadius: "var(--radius-sm)",
  fontSize: "var(--text-sm)",
  color: "var(--gray-900)",
  width: "100%",
  boxSizing: "border-box",
};
const tileIcon: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "var(--radius-sm)",
  background: "var(--gray-100)",
  color: "var(--gray-600)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)", padding: "var(--space-4)" }}>
      <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-3)" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>
    </div>
  );
}
