import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "urql";
import {
  INBOX,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from "../../graphql/operations";
import type { Notification } from "../../types";
import { getSocket } from "../../lib/socket";

interface InboxData {
  inbox: Notification[];
}

/**
 * useInbox — carga las notificaciones del usuario y se refresca en vivo al recibir
 * `inboxUpdated` (push al room personal `user:{id}`). Expone conteo de no leídas y acciones.
 */
export function useInbox() {
  const [{ data, fetching }, refetch] = useQuery<InboxData>({ query: INBOX });
  const [, markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [, markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  const notifications = useMemo(() => data?.inbox ?? [], [data]);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );

  useEffect(() => {
    const socket = getSocket();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onInbox = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refetch({ requestPolicy: "network-only" }), 250);
    };
    socket.on("inboxUpdated", onInbox);
    return () => {
      if (timer) clearTimeout(timer);
      socket.off("inboxUpdated", onInbox);
    };
  }, [refetch]);

  async function onMarkRead(id: string) {
    await markRead({ id });
    refetch({ requestPolicy: "network-only" });
  }

  async function onMarkAllRead() {
    await markAllRead({});
    refetch({ requestPolicy: "network-only" });
  }

  return { notifications, unreadCount, fetching, onMarkRead, onMarkAllRead };
}
