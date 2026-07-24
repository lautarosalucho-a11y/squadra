/** Utilidades para fechas "solo día" (dueDate / startDate).
 *  El backend las guarda como @db.Date → medianoche UTC. Para evitar que se
 *  corran un día según la zona horaria del navegador, siempre operamos con la
 *  parte de fecha (YYYY-MM-DD) y formateamos usando el mediodía local. */

/** "2026-07-30T00:00:00.000Z" → "2026-07-30" */
export function dayPart(iso: string): string {
  return iso.slice(0, 10);
}

/** "2026-07-30" (input date) → ISO en medianoche UTC de ese mismo día. */
export function toUtcDateIso(yyyyMmDd: string): string {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`).toISOString();
}

/** ISO "solo día" → Date local al mediodía (seguro para formatear/comparar por día). */
export function localNoon(iso: string): Date {
  return new Date(`${dayPart(iso)}T12:00:00`);
}
