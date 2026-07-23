import { io, type Socket } from "socket.io-client";
import { auth } from "./auth";

/** Origen del WebSocket: mismo host que la API, sin el path /graphql. */
function socketBaseUrl(): string {
  const gql = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql";
  try {
    return new URL(gql).origin;
  } catch {
    return "http://localhost:3000";
  }
}

let socket: Socket | null = null;

/**
 * Socket singleton. Se conecta con el accessToken en el handshake
 * (el gateway valida el JWT y une al room personal `user:{id}`).
 */
export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(socketBaseUrl(), {
    autoConnect: true,
    transports: ["websocket"],
    auth: { token: auth.getAccess() ?? "" },
  });
  return socket;
}

/** Cierra la conexión (usar en logout). */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
