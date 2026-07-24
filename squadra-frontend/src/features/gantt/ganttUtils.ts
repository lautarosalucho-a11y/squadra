import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { Task } from "../../types";
import { localNoon } from "../../lib/dateOnly";

/** Parseo tz-safe: strings ISO "solo día" via mediodía local; Date tal cual. */
const asDay = (d: Date | string): Date => (typeof d === "string" ? localNoon(d) : d);

export const ROW_H = 36;
export const HEADER_H = 40;

export interface Range {
  start: Date; // día 0 del timeline
  days: number; // cantidad de días visibles
}

/** Rango temporal que cubre todas las tareas con fechas (con padding). */
export function computeRange(tasks: Task[]): Range {
  const dates: Date[] = [];
  for (const t of tasks) {
    if (t.startDate) dates.push(startOfDay(asDay(t.startDate)));
    if (t.dueDate) dates.push(startOfDay(asDay(t.dueDate)));
  }
  if (dates.length === 0) {
    const today = startOfDay(new Date());
    return { start: addDays(today, -7), days: 30 };
  }
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  const start = addDays(min, -3);
  const days = differenceInCalendarDays(max, start) + 4;
  return { start, days: Math.max(days, 14) };
}

/** X (px) del inicio de un día dado respecto al rango. */
export function dateToX(date: Date | string, range: Range, pxPerDay: number): number {
  return differenceInCalendarDays(startOfDay(asDay(date)), range.start) * pxPerDay;
}

/** Geometría de la barra de una tarea. `null` si no tiene dueDate. */
export function barGeometry(task: Task, range: Range, pxPerDay: number) {
  if (!task.dueDate) return null;
  const due = startOfDay(asDay(task.dueDate));
  const start = task.startDate ? startOfDay(asDay(task.startDate)) : due;
  const left = dateToX(start, range, pxPerDay);
  const spanDays = Math.max(differenceInCalendarDays(due, start) + 1, 1);
  return { left, width: spanDays * pxPerDay, isMilestone: !task.startDate };
}

export { addDays, differenceInCalendarDays, startOfDay };
