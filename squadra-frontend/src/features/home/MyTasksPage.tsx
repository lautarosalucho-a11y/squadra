import { useState } from "react";
import { MyTasksList } from "./MyTasksList";
import { MyTasksBoard } from "./MyTasksBoard";
import { MyTasksCalendar } from "./MyTasksCalendar";
import { DashboardBody } from "./DashboardPage";

type View = "list" | "board" | "calendar" | "panel";

const TABS: { key: View; label: string }[] = [
  { key: "list", label: "Lista" },
  { key: "board", label: "Tablero" },
  { key: "calendar", label: "Calendario" },
  { key: "panel", label: "Panel" },
];

export function MyTasksPage() {
  const [view, setView] = useState<View>("list");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-6)" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-3)" }}>Mis tareas</h1>

      <div style={{ display: "flex", gap: "var(--space-4)", borderBottom: "1px solid var(--gray-200)", marginBottom: "var(--space-4)" }}>
        {TABS.map((t) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "var(--space-2) 0",
                fontSize: "var(--text-sm)",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--gray-900)" : "var(--gray-600)",
                borderBottom: active ? "2px solid var(--brand-500)" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {view === "list" && <MyTasksList />}
      {view === "board" && <MyTasksBoard />}
      {view === "calendar" && <MyTasksCalendar />}
      {view === "panel" && <DashboardBody />}
    </div>
  );
}
