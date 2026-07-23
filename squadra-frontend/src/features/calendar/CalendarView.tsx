import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { addMonths, differenceInCalendarDays, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { PROJECT_CALENDAR, UPDATE_TASK } from "../../graphql/operations";
import type { GroupedTasks, Task } from "../../types";
import { Button } from "../../components/ui";
import { buildMonthGrid, dayKey, WEEKDAYS } from "./dateUtils";
import { DayCell } from "./DayCell";
import { UndatedTray } from "./UndatedTray";
import { useProjectRealtime } from "../realtime/useProjectRealtime";

interface CalendarData {
  projectTasks: GroupedTasks;
}

export function CalendarView() {
  const { projectId = "demo" } = useParams();
  const [{ data, fetching, error }, refetch] = useQuery<CalendarData>({
    query: PROJECT_CALENDAR,
    variables: { projectId },
  });
  const [, updateTask] = useMutation(UPDATE_TASK);

  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    const flat = data?.projectTasks.groups.flatMap((g) => g.tasks) ?? [];
    setTasks(flat);
  }, [data]);

  useProjectRealtime(projectId, {
    onChange: () => refetch({ requestPolicy: "network-only" }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = dayKey(t.dueDate);
      (map.get(k) ?? map.set(k, []).get(k)!).push(t);
    }
    return map;
  }, [tasks]);
  const undated = useMemo(() => tasks.filter((t) => !t.dueDate), [tasks]);

  async function onDragEnd(e: DragEndEvent) {
    const task = e.active.data.current?.task as Task | undefined;
    const over = e.over ? String(e.over.id) : null;
    if (!task || !over) return;

    const toUndated = over === "__undated__";
    const newDue = toUndated ? null : new Date(over);
    const prevDue = task.dueDate ? new Date(task.dueDate) : null;

    // Preservar duración si la tarea tenía startDate + dueDate.
    let newStart: Date | null | undefined = undefined;
    if (task.startDate && prevDue && newDue) {
      const duration = differenceInCalendarDays(prevDue, new Date(task.startDate));
      newStart = new Date(newDue);
      newStart.setDate(newStart.getDate() - duration);
    } else if (toUndated) {
      newStart = null;
    }

    // Optimista
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              dueDate: newDue ? newDue.toISOString() : null,
              startDate: newStart !== undefined ? (newStart ? newStart.toISOString() : null) : t.startDate,
            }
          : t,
      ),
    );

    const input: Record<string, unknown> = {
      dueDate: newDue ? newDue.toISOString() : null,
      expectedVersion: task.version,
    };
    if (newStart !== undefined) input.startDate = newStart ? newStart.toISOString() : null;

    const res = await updateTask({ id: task.id, input });
    if (res.error) refetch({ requestPolicy: "network-only" }); // rollback
  }

  if (fetching && !data) return <Centered>Cargando calendario…</Centered>;
  if (error && !data)
    return (
      <Centered>
        No se pudo cargar el calendario. Verificá el backend en{" "}
        <code>{import.meta.env.VITE_GRAPHQL_URL}</code>.
      </Centered>
    );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-5)", height: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            <strong style={{ fontSize: "var(--text-lg)", textTransform: "capitalize" }}>
              {format(cursor, "LLLL yyyy", { locale: es })}
            </strong>
            <div style={{ display: "flex", gap: "var(--space-1)", marginLeft: "auto" }}>
              <Button variant="secondary" size="sm" onClick={() => setCursor((c) => subMonths(c, 1))}>
                ‹
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>
                Hoy
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCursor((c) => addMonths(c, 1))}>
                ›
              </Button>
            </div>
          </div>

          {/* Encabezado de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ padding: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--gray-400)", textAlign: "right" }}>
                {w}
              </div>
            ))}
          </div>

          {/* Grilla */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1 }}>
            {grid.map((d) => (
              <DayCell key={d.toISOString()} date={d} cursor={cursor} tasks={byDay.get(dayKey(d)) ?? []} />
            ))}
          </div>
        </div>

        <UndatedTray tasks={undated} />
      </div>
    </DndContext>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: "var(--space-8)", color: "var(--gray-600)", textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
