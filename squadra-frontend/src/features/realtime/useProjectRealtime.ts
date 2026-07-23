import { useEffect, useRef, useState } from "react";
import { getSocket } from "../../lib/socket";
import { auth } from "../../lib/auth";
import type { TaskChangedEvent } from "./events";

interface Options {
  /** Se invoca (debounced) cuando llega un cambio relevante del proyecto. */
  onChange: () => void;
  /** Ignorar los ecos de mis propias acciones (ya aplicadas de forma optimista). */
  ignoreSelf?: boolean;
}

/**
 * useProjectRealtime — une el socket al room `project:{id}`, escucha `taskChanged`
 * y dispara `onChange` con debounce para coalescer ráfagas. Devuelve el estado de
 * conexión para pintar el indicador "En vivo".
 */
export function useProjectRealtime(projectId: string, { onChange, ignoreSelf = true }: Options) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const socket = getSocket();
    const myId = auth.getUserId();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), 250);
    };

    const onConnect = () => {
      setConnected(true);
      socket.emit("joinProject", projectId);
    };
    const onDisconnect = () => setConnected(false);

    const onTaskChanged = (event: TaskChangedEvent) => {
      if (event.projectId !== projectId) return;
      if (ignoreSelf && event.source === "user" && event.actorId === myId) return;
      scheduleRefetch();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("taskChanged", onTaskChanged);

    if (socket.connected) onConnect();

    return () => {
      if (timer) clearTimeout(timer);
      socket.emit("leaveProject", projectId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("taskChanged", onTaskChanged);
    };
  }, [projectId, ignoreSelf]);

  return { connected };
}
