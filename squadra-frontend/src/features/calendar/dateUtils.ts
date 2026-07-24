import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Clave de día estable (yyyy-MM-dd) usada como id de celda droppable.
 *  Para strings ISO "solo día" toma la parte de fecha (evita corrimiento por zona horaria). */
export function dayKey(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return format(d, "yyyy-MM-dd");
}

/** Matriz de días (semanas Lun–Dom) que cubre el mes de `cursor`. */
export function buildMonthGrid(cursor: Date): Date[] {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export { addDays, format };
