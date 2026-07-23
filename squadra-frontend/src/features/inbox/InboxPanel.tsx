import type { Notification } from "../../types";
import { Button } from "../../components/ui";
import { notificationCopy, relativeTime } from "./notificationCopy";

interface Props {
  notifications: Notification[];
  fetching: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

/** Popover del Inbox: lista de notificaciones con estados leído/no leído. */
export function InboxPanel({ notifications, fetching, onMarkRead, onMarkAllRead, onClose }: Props) {
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div
      role="dialog"
      aria-label="Bandeja de notificaciones"
      style={{
        position: "absolute",
        top: "calc(100% + var(--space-2))",
        right: 0,
        width: 340,
        maxHeight: 440,
        display: "flex",
        flexDirection: "column",
        background: "var(--gray-0)",
        border: "1px solid var(--gray-200)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        zIndex: 20,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) var(--space-4)",
          borderBottom: "1px solid var(--gray-200)",
        }}
      >
        <strong style={{ fontSize: "var(--text-md)" }}>Notificaciones</strong>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead} disabled={!hasUnread}>
          Marcar todas leídas
        </Button>
      </header>

      <div style={{ overflowY: "auto" }}>
        {fetching && notifications.length === 0 ? (
          <Empty text="Cargando…" />
        ) : notifications.length === 0 ? (
          <Empty text="Estás al día 🎉" />
        ) : (
          notifications.map((n) => {
            const { icon, text } = notificationCopy(n);
            const unread = !n.readAt;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => unread && onMarkRead(n.id)}
                style={{
                  all: "unset",
                  display: "flex",
                  gap: "var(--space-3)",
                  alignItems: "flex-start",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "var(--space-3) var(--space-4)",
                  borderBottom: "1px solid var(--gray-100)",
                  cursor: unread ? "pointer" : "default",
                  background: unread ? "var(--brand-50)" : "transparent",
                }}
              >
                <span aria-hidden style={{ fontSize: 16, lineHeight: "20px" }}>
                  {icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "var(--text-sm)",
                      color: "var(--gray-900)",
                      fontWeight: unread ? 600 : 400,
                    }}
                  >
                    {text}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>
                    {relativeTime(n.createdAt)}
                  </span>
                </span>
                {unread && (
                  <span
                    aria-label="No leída"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "var(--radius-full)",
                      background: "var(--brand-500)",
                      marginTop: 6,
                    }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      <footer style={{ padding: "var(--space-2) var(--space-4)", borderTop: "1px solid var(--gray-200)" }}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </footer>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>
      {text}
    </div>
  );
}
