import { useState } from "react";
import { useInbox } from "./useInbox";
import { InboxPanel } from "./InboxPanel";

/** Campana del Inbox con badge de no leídas; abre el panel de notificaciones. */
export function InboxButton() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, fetching, onMarkRead, onMarkAllRead } = useInbox();

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          all: "unset",
          position: "relative",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "var(--space-2)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "#fff",
              background: "var(--danger)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <InboxPanel
          notifications={notifications}
          fetching={fetching}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
