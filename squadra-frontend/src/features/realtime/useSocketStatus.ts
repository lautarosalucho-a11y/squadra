import { useEffect, useState } from "react";
import { getSocket } from "../../lib/socket";

/** Estado de conexión del socket (para el indicador global "En vivo"). */
export function useSocketStatus(): boolean {
  const [connected, setConnected] = useState(() => getSocket().connected);
  useEffect(() => {
    const socket = getSocket();
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on("connect", on);
    socket.on("disconnect", off);
    return () => {
      socket.off("connect", on);
      socket.off("disconnect", off);
    };
  }, []);
  return connected;
}
