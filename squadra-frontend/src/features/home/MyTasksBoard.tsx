import { useMemo } from "react";
import { useQuery } from "urql";
import { MY_PROJECTS, MY_TASKS } from "../../graphql/operations";
import { STATUS_LABELS, STATUS_ORDER, type Task } from "../../types";
import { taskPanel } from "../comments/taskPanelStore";
import { localNoon } from "../../lib/dateOnly";
import { useIsMobile } from "../../lib/useIsMobile";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Tablero de "Mis tareas": columnas por estado (verticales y apiladas en mobile). */
export function MyTasksBoard() {
  const [{ data }] = useQuery<{ myTasks: Task[] }>({ query: MY_TASKS });
  const [{ data: projData }] = useQuery<{ myProjects: { id: string; name: string }[] }>({ query: MY_PROJECTS });
  const isMobile = useIsMobile();

  const tasks = useMemo(() => data?.myTasks ?? [], [data]);
  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    (projData?.myProjects ?? []).forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projData]);

  const byStatus = useMemo(() => {
    const g = new Map<string, Task[]>();
    STATUS_ORDER.forEach((s) => g.set(s, []));
    for (const t of tasks) g.get(t.status)?.push(t);
    return g;
  }, [tasks]);

  return (
    <div
      style={
        isMobile
          ? { display: "flex", flexDirection: "column", gap: "var(--space-4)" }
          : { display: "flex", gap: "var(--space-3)", overflowX: "auto", paddingBottom: "var(--space-2)" }
      }
    >
      {STATUS_ORDER.map((s) => {
        const items = byStatus.get(s) ?? [];
        return (
          <div key={s} style={isMobile ? { width: "100%" } : { width: 260, flex: "0 0 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "0 var(--space-2) var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, padding: "2px var(--space-2)", borderRadius: "var(--radius-full)", background: `var(--status-${s}-bg)`, color: `var(--status-${s}-fg)` }}>
                {STATUS_LABELS[s]}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>{items.length}</span>
            </div>
            <div style={{ background: "var(--gray-100)", borderRadius: "var(--radius-lg)", padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-2)", minHeight: 80 }}>
              {items.length === 0 ? (
                <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)", textAlign: "center", padding: "var(--space-3)" }}>—</div>
              ) : (
                items.map((t) => (
                  <button key={t.id} type="button" onClick={() => taskPanel.open(t.id)} style={{ all: "unset", cursor: "pointer", background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--gray-900)" }}>{t.title}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      {projectName.get(t.projectId ?? "") && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--brand-700)", background: "var(--brand-50)", padding: "1px var(--space-2)", borderRadius: "var(--radius-full)" }}>
                          {projectName.get(t.projectId ?? "")}
                        </span>
                      )}
                      {t.dueDate && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", marginLeft: "auto" }}>
                          {format(localNoon(t.dueDate), "dd MMM", { locale: es })}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
