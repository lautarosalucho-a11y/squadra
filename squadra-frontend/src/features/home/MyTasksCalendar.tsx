import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { MY_TASKS } from "../../graphql/operations";
import type { Task } from "../../types";
import { taskPanel } from "../comments/taskPanelStore";
import { buildMonthGrid, dayKey, WEEKDAYS } from "../calendar/dateUtils";
import { Button } from "../../components/ui";
import { addMonths, format, isSameMonth, isToday, subMonths } from "date-fns";
import { es } from "date-fns/locale";

/** Calendario de "Mis tareas": tus tareas ubicadas por fecha de vencimiento. */
export function MyTasksCalendar() {
  const [{ data }] = useQuery<{ myTasks: Task[] }>({ query: MY_TASKS });
  const [cursor, setCursor] = useState(new Date());

  const tasks = useMemo(() => data?.myTasks ?? [], [data]);
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = dayKey(t.dueDate);
      (m.get(k) ?? m.set(k, []).get(k)!).push(t);
    }
    return m;
  }, [tasks]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        <strong style={{ fontSize: "var(--text-lg)", textTransform: "capitalize" }}>
          {format(cursor, "LLLL yyyy", { locale: es })}
        </strong>
        <div style={{ display: "flex", gap: "var(--space-1)", marginLeft: "auto" }}>
          <Button variant="secondary" size="sm" onClick={() => setCursor((c) => subMonths(c, 1))}>‹</Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>Hoy</Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor((c) => addMonths(c, 1))}>›</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ padding: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--gray-400)", textAlign: "right" }}>{w}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "112px" }}>
        {grid.map((d) => {
          const items = byDay.get(dayKey(d)) ?? [];
          const outside = !isSameMonth(d, cursor);
          const today = isToday(d);
          return (
            <div key={d.toISOString()} style={{ height: "100%", display: "flex", flexDirection: "column", gap: 3, padding: "var(--space-1)", border: "1px solid var(--gray-200)", background: outside ? "var(--gray-50)" : "var(--gray-0)", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: today ? 700 : 400, color: today ? "#fff" : outside ? "var(--gray-400)" : "var(--gray-600)", background: today ? "var(--brand-500)" : "transparent", borderRadius: "var(--radius-full)", minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {d.getDate()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0, overflowY: "auto" }}>
                {items.slice(0, 3).map((t) => (
                  <button key={t.id} type="button" onClick={() => taskPanel.open(t.id)} title={t.title} style={{ all: "unset", cursor: "pointer", fontSize: "var(--text-xs)", padding: "2px var(--space-2)", borderRadius: "var(--radius-sm)", background: `var(--status-${t.status}-bg)`, color: `var(--status-${t.status}-fg)`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </button>
                ))}
                {items.length > 3 && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", paddingLeft: 2 }}>+{items.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
