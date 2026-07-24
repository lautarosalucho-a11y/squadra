import { useMemo } from "react";
import { useQuery } from "urql";
import { MY_PROJECTS, MY_TASKS } from "../../graphql/operations";
import { STATUS_LABELS, STATUS_ORDER, type Task, type TaskStatus } from "../../types";
import { localNoon } from "../../lib/dateOnly";
import { startOfDay } from "date-fns";

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#1d4ed8",
  in_review: "#b45309",
  done: "#15803d",
  blocked: "#b91c1c",
};

export function DashboardPage() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "var(--space-6)" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-5)" }}>Panel</h1>
      <DashboardBody />
    </div>
  );
}

export function DashboardBody() {
  const [{ data }] = useQuery<{ myTasks: Task[] }>({ query: MY_TASKS });
  const [{ data: projData }] = useQuery<{ myProjects: { id: string; name: string }[] }>({ query: MY_PROJECTS });

  const tasks = useMemo(() => data?.myTasks ?? [], [data]);
  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    (projData?.myProjects ?? []).forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projData]);

  const today = startOfDay(new Date());
  const stats = useMemo(() => {
    let done = 0, overdue = 0;
    const byStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0, blocked: 0 };
    const byProject = new Map<string, number>();
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      if (t.status === "done") done++;
      else if (t.dueDate && startOfDay(localNoon(t.dueDate)) < today) overdue++;
      const pid = t.projectId ?? "—";
      byProject.set(pid, (byProject.get(pid) ?? 0) + 1);
    }
    return { total: tasks.length, done, pending: tasks.length - done, overdue, byStatus, byProject };
  }, [tasks, today]);

  // Donut por estado (conic-gradient)
  const donut = useMemo(() => {
    const segs = STATUS_ORDER.filter((s) => stats.byStatus[s] > 0);
    if (stats.total === 0) return { css: "var(--gray-100)", segs };
    let acc = 0;
    const stops: string[] = [];
    for (const s of segs) {
      const start = (acc / stats.total) * 360;
      acc += stats.byStatus[s];
      const end = (acc / stats.total) * 360;
      stops.push(`${STATUS_COLOR[s]} ${start}deg ${end}deg`);
    }
    return { css: `conic-gradient(${stops.join(", ")})`, segs };
  }, [stats]);

  const projectsRanked = useMemo(
    () => [...stats.byProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    [stats],
  );
  const maxProj = Math.max(1, ...projectsRanked.map(([, n]) => n));

  return (
    <div>
      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        <Metric label="Finalizadas" value={stats.done} color="var(--success)" />
        <Metric label="Sin finalizar" value={stats.pending} color="var(--gray-700)" />
        <Metric label="Con retraso" value={stats.overdue} color="var(--danger)" />
        <Metric label="Tareas en total" value={stats.total} color="var(--brand-600)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
        {/* Donut por estado */}
        <Card title="Tareas por estado">
          {stats.total === 0 ? (
            <Empty />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
              <div style={{ position: "relative", width: 140, height: 140, borderRadius: "50%", background: donut.css, flex: "0 0 auto" }}>
                <div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: "var(--gray-0)", display: "grid", placeItems: "center", fontSize: "var(--text-xl)", fontWeight: 600 }}>
                  {stats.total}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {donut.segs.map((s) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLOR[s], flex: "0 0 auto" }} />
                    <span style={{ color: "var(--gray-700)" }}>{STATUS_LABELS[s]}</span>
                    <span style={{ color: "var(--gray-400)", marginLeft: "auto" }}>{stats.byStatus[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Barras por proyecto */}
        <Card title="Tareas por proyecto">
          {projectsRanked.length === 0 ? (
            <Empty />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {projectsRanked.map(([pid, n]) => (
                <div key={pid} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {projectName.get(pid) ?? "Sin proyecto"}
                  </span>
                  <span style={{ height: 12, background: "var(--gray-100)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${(n / maxProj) * 100}%`, background: "var(--brand-500)", borderRadius: "var(--radius-full)" }} />
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", textAlign: "right" }}>{n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)" }}>{label}</div>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: 600, color, marginTop: "var(--space-1)" }}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)", padding: "var(--space-4)" }}>
      <h2 style={{ fontSize: "var(--text-md)", fontWeight: 600, margin: "0 0 var(--space-4)" }}>{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>Sin datos todavía.</div>;
}
