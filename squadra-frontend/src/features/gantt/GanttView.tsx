import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import { addDays, format, startOfDay } from "date-fns";
import {
  ADD_DEPENDENCY,
  PROJECT_DEPENDENCIES,
  PROJECT_GANTT,
  UPDATE_TASK,
} from "../../graphql/operations";
import type { GroupedTasks, Task } from "../../types";
import { Button } from "../../components/ui";
import { useProjectRealtime } from "../realtime/useProjectRealtime";
import {
  barGeometry,
  computeRange,
  dateToX,
  HEADER_H,
  ROW_H,
} from "./ganttUtils";
import { GanttBar, type BarCommit } from "./GanttBar";

interface GanttData {
  projectTasks: GroupedTasks;
}
interface DepData {
  projectDependencies: { blockerTaskId: string; blockedTaskId: string }[];
}
type Row =
  | { type: "group"; label: string }
  | { type: "task"; task: Task };

const LEFT_W = 260;

export function GanttView() {
  const { projectId = "demo" } = useParams();
  const [{ data, fetching, error }, refetch] = useQuery<GanttData>({
    query: PROJECT_GANTT,
    variables: { projectId },
  });
  const [{ data: depData }, refetchDeps] = useQuery<DepData>({
    query: PROJECT_DEPENDENCIES,
    variables: { projectId },
  });
  const [, updateTask] = useMutation(UPDATE_TASK);
  const [, addDependency] = useMutation(ADD_DEPENDENCY);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pxPerDay, setPxPerDay] = useState(32);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);

  // Virtualización vertical: sólo se renderizan las filas visibles.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(600);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) setViewH(el.clientHeight);
  }, []);

  const groups = data?.projectTasks.groups ?? [];
  useEffect(() => {
    setTasks(groups.flatMap((g) => g.tasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useProjectRealtime(projectId, {
    onChange: () => {
      refetch({ requestPolicy: "network-only" });
      refetchDeps({ requestPolicy: "network-only" });
    },
  });

  const range = useMemo(() => computeRange(tasks), [tasks]);
  const deps = depData?.projectDependencies ?? [];

  // Filas ordenadas (headers + tareas) compartidas por ambos paneles.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const g of groups) {
      out.push({ type: "group", label: g.label ?? "Sin sección" });
      for (const t of tasks.filter((x) => g.tasks.some((gt) => gt.id === x.id))) {
        out.push({ type: "task", task: t });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, data]);

  const rowIndexById = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r, i) => r.type === "task" && m.set(r.task.id, i));
    return m;
  }, [rows]);

  async function commitBar(taskId: string, c: BarCommit) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, startDate: c.startDate, dueDate: c.dueDate } : t,
      ),
    );
    const res = await updateTask({
      id: taskId,
      input: { startDate: c.startDate, dueDate: c.dueDate, expectedVersion: c.version },
    });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }

  async function pickTarget(blockedId: string) {
    if (!linkFrom || linkFrom === blockedId) return setLinkFrom(null);
    const res = await addDependency({ blockerId: linkFrom, blockedId });
    setLinkFrom(null);
    if (!res.error) refetchDeps({ requestPolicy: "network-only" });
  }

  if (fetching && !data) return <Centered>Cargando cronograma…</Centered>;
  if (error && !data)
    return (
      <Centered>
        No se pudo cargar el cronograma. Verificá el backend en{" "}
        <code>{import.meta.env.VITE_GRAPHQL_URL}</code>.
      </Centered>
    );

  const timelineW = range.days * pxPerDay;
  const bodyH = rows.length * ROW_H;
  const todayX = dateToX(startOfDay(new Date()), range, pxPerDay);

  // Ventana de filas visibles (con buffer) según el scroll vertical.
  const BUFFER = 6;
  const visStart = Math.max(0, Math.floor((scrollTop - HEADER_H) / ROW_H) - BUFFER);
  const visEnd = Math.min(rows.length, Math.ceil((scrollTop - HEADER_H + viewH) / ROW_H) + BUFFER);
  const visibleIndices: number[] = [];
  for (let i = visStart; i < visEnd; i++) visibleIndices.push(i);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3) var(--space-5)", borderBottom: "1px solid var(--gray-200)" }}>
        <strong style={{ fontSize: "var(--text-lg)" }}>Cronograma</strong>
        {linkFrom && (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--brand-700)" }}>
            Elegí la tarea bloqueada… (Esc para cancelar)
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-1)" }}>
          <Button variant={pxPerDay >= 28 ? "primary" : "secondary"} size="sm" onClick={() => setPxPerDay(32)}>
            Día
          </Button>
          <Button variant={pxPerDay < 28 ? "primary" : "secondary"} size="sm" onClick={() => setPxPerDay(14)}>
            Semana
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{ flex: 1, display: "flex", overflow: "auto" }}
        tabIndex={0}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={(e) => e.key === "Escape" && setLinkFrom(null)}
      >
        {/* Panel izquierdo (virtualizado) */}
        <div style={{ flex: `0 0 ${LEFT_W}px`, position: "sticky", left: 0, zIndex: 3, background: "var(--gray-0)", borderRight: "1px solid var(--gray-200)" }}>
          <div style={{ height: HEADER_H, borderBottom: "1px solid var(--gray-200)" }} />
          <div style={{ position: "relative", height: bodyH }}>
            {visibleIndices.map((i) => {
              const r = rows[i];
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: i * ROW_H,
                    left: 0,
                    right: 0,
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-3)",
                    borderBottom: "1px solid var(--gray-100)",
                    background: r.type === "group" ? "var(--gray-100)" : "var(--gray-0)",
                    fontSize: "var(--text-sm)",
                    fontWeight: r.type === "group" ? 600 : 400,
                    color: r.type === "group" ? "var(--gray-700)" : "var(--gray-900)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.type === "group" ? r.label : r.task.title}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", width: timelineW, flex: "0 0 auto" }}>
          {/* Header de días */}
          <div style={{ display: "flex", height: HEADER_H, borderBottom: "1px solid var(--gray-200)", position: "sticky", top: 0, background: "var(--gray-0)", zIndex: 2 }}>
            {Array.from({ length: range.days }).map((_, d) => {
              const day = addDays(range.start, d);
              const weekend = [0, 6].includes(day.getDay());
              const showLabel = pxPerDay >= 28 || day.getDay() === 1;
              return (
                <div
                  key={d}
                  style={{
                    width: pxPerDay,
                    flex: "0 0 auto",
                    borderLeft: "1px solid var(--gray-100)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: weekend ? "var(--gray-400)" : "var(--gray-600)",
                    background: weekend ? "var(--gray-50)" : "transparent",
                  }}
                >
                  {showLabel && <span>{format(day, "d")}</span>}
                </div>
              );
            })}
          </div>

          {/* Cuerpo */}
          <div style={{ position: "relative", height: bodyH }}>
            {/* Bandas fin de semana */}
            {Array.from({ length: range.days }).map((_, d) => {
              const day = addDays(range.start, d);
              if (![0, 6].includes(day.getDay())) return null;
              return (
                <div key={d} style={{ position: "absolute", top: 0, left: d * pxPerDay, width: pxPerDay, height: bodyH, background: "var(--gray-50)" }} />
              );
            })}

            {/* Marcador hoy */}
            {todayX >= 0 && todayX <= timelineW && (
              <div style={{ position: "absolute", top: 0, left: todayX, width: 2, height: bodyH, background: "var(--brand-500)", zIndex: 1 }} />
            )}

            {/* Flechas de dependencia */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: timelineW, height: bodyH, pointerEvents: "none", overflow: "visible" }}>
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--gray-400)" />
                </marker>
              </defs>
              {deps.map((dep, i) => {
                const bi = rowIndexById.get(dep.blockerTaskId);
                const ki = rowIndexById.get(dep.blockedTaskId);
                const bt = tasks.find((t) => t.id === dep.blockerTaskId);
                const kt = tasks.find((t) => t.id === dep.blockedTaskId);
                if (bi == null || ki == null || !bt || !kt) return null;
                const bg = barGeometry(bt, range, pxPerDay);
                const kg = barGeometry(kt, range, pxPerDay);
                if (!bg || !kg) return null;
                const x1 = bg.left + bg.width;
                const y1 = bi * ROW_H + ROW_H / 2;
                const x2 = kg.left;
                const y2 = ki * ROW_H + ROW_H / 2;
                const mx = x1 + 12;
                return (
                  <path
                    key={i}
                    d={`M${x1},${y1} H${mx} V${y2} H${x2}`}
                    fill="none"
                    stroke="var(--gray-400)"
                    strokeWidth={1.5}
                    markerEnd="url(#arrow)"
                  />
                );
              })}
            </svg>

            {/* Barras (virtualizadas) */}
            {visibleIndices.map((i) => {
              const r = rows[i];
              if (r.type !== "task") return null;
              const geo = barGeometry(r.task, range, pxPerDay);
              return (
                <div key={r.task.id} style={{ position: "absolute", top: i * ROW_H, left: 0, width: timelineW, height: ROW_H, borderBottom: "1px solid var(--gray-100)" }}>
                  {geo ? (
                    <GanttBar
                      task={r.task}
                      left={geo.left}
                      width={geo.width}
                      isMilestone={geo.isMilestone}
                      pxPerDay={pxPerDay}
                      linking={Boolean(linkFrom)}
                      linkingFrom={linkFrom === r.task.id}
                      onCommit={commitBar}
                      onStartLink={setLinkFrom}
                      onPickTarget={pickTarget}
                    />
                  ) : (
                    <span style={{ position: "absolute", left: 4, top: ROW_H / 2 - 8, fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>
                      Sin programar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: "var(--space-8)", color: "var(--gray-600)", textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
