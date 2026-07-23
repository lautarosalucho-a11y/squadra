import type { Notification } from "../../types";

/** Traduce un tipo de notificación + payload a icono y texto legible. */
export function notificationCopy(n: Notification): { icon: string; text: string } {
  const title = n.payload?.title ?? "una tarea";
  switch (n.type) {
    case "assignment":
      return { icon: "👤", text: `Te asignaron “${title}”` };
    case "status_changed":
      return { icon: "🔄", text: `Cambió el estado de “${title}”` };
    case "comment":
      return { icon: "💬", text: `Nuevo comentario en “${title}”` };
    case "mention":
      return { icon: "@", text: `Te mencionaron en “${title}”` };
    case "due_soon":
      return { icon: "⏰", text: `“${title}” vence pronto` };
    case "dependency":
      return { icon: "🔗", text: `Una dependencia de “${title}” se actualizó` };
    default:
      return { icon: "🔔", text: `Actualización en “${title}”` };
  }
}

/** Tiempo relativo compacto en español. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}
