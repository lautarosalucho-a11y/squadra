import { useEffect, useState } from "react";

/** Store mínimo (sin dependencias) para abrir el panel de detalle de una tarea
 *  desde cualquier vista. */
type Listener = (taskId: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

export const taskPanel = {
  open(taskId: string) {
    current = taskId;
    listeners.forEach((l) => l(current));
  },
  close() {
    current = null;
    listeners.forEach((l) => l(current));
  },
};

/** Hook: taskId actualmente abierto (o null). */
export function useOpenTask(): string | null {
  const [id, setId] = useState<string | null>(current);
  useEffect(() => {
    const l: Listener = (v) => setId(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return id;
}
