import { type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "urql";
import { MY_PROJECTS } from "../../graphql/operations";
import { auth } from "../../lib/auth";
import { disconnectSocket } from "../../lib/socket";
import { useSocketStatus } from "../../features/realtime/useSocketStatus";
import { InboxButton } from "../../features/inbox/InboxButton";
import { TaskDetailPanel } from "../../features/comments/TaskDetailPanel";
import { Button } from "../ui";

function ProjectNav({ projectId, onPick }: { projectId: string; onPick: (id: string) => void }) {
  const [{ data }] = useQuery<{ myProjects: { id: string; name: string }[] }>({ query: MY_PROJECTS });
  const projects = data?.myProjects ?? [];
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Proyectos
      </div>
      {projects.map((p) => {
        const active = p.id === projectId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            style={{
              all: "unset",
              cursor: "pointer",
              color: "var(--gray-900)",
              padding: "var(--space-2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              background: active ? "var(--brand-50)" : "transparent",
              fontWeight: active ? 600 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            # {p.name}
          </button>
        );
      })}
    </nav>
  );
}

function LiveIndicator() {
  const connected = useSocketStatus();
  return (
    <span
      title={connected ? "Conectado en tiempo real" : "Sin conexión en vivo"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        marginLeft: "auto",
        fontSize: "var(--text-xs)",
        color: connected ? "var(--success)" : "var(--gray-400)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "var(--radius-full)",
          background: connected ? "var(--success)" : "var(--gray-300)",
        }}
      />
      {connected ? "En vivo" : "Desconectado"}
    </span>
  );
}

const VIEWS: { label: string; slug?: string }[] = [
  { label: "Lista", slug: "list" },
  { label: "Tablero", slug: "board" },
  { label: "Calendario", slug: "calendar" },
  { label: "Cronograma", slug: "timeline" },
];

/** Marco de la app: sidebar + topbar con switcher de vistas. */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId = "demo" } = useParams();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "232px 1fr", height: "100%" }}>
      <aside
        style={{
          background: "var(--gray-0)",
          borderRight: "1px solid var(--gray-200)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--brand-600)" }}>
          Squadra
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: location.pathname === "/" ? 600 : 400,
            background: location.pathname === "/" ? "var(--brand-50)" : "transparent",
            color: location.pathname === "/" ? "var(--brand-700)" : "var(--gray-900)",
          }}
        >
          🏠 Inicio
        </button>
        <button
          type="button"
          onClick={() => navigate("/goals")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: location.pathname === "/goals" ? 600 : 400,
            background: location.pathname === "/goals" ? "var(--brand-50)" : "transparent",
            color: location.pathname === "/goals" ? "var(--brand-700)" : "var(--gray-900)",
          }}
        >
          🎯 Estrategia
        </button>
        <button
          type="button"
          onClick={() => navigate("/projects")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: location.pathname === "/projects" ? 600 : 400,
            background: location.pathname === "/projects" ? "var(--brand-50)" : "transparent",
            color: location.pathname === "/projects" ? "var(--brand-700)" : "var(--gray-900)",
          }}
        >
          📁 Proyectos
        </button>
        <button
          type="button"
          onClick={() => navigate("/portfolios")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: location.pathname === "/portfolios" ? 600 : 400,
            background: location.pathname === "/portfolios" ? "var(--brand-50)" : "transparent",
            color: location.pathname === "/portfolios" ? "var(--brand-700)" : "var(--gray-900)",
          }}
        >
          🗂 Portafolios
        </button>
        <ProjectNav projectId={projectId} onPick={(id) => navigate(`/projects/${id}/board`)} />
        <div style={{ marginTop: "auto" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              disconnectSocket();
              auth.clear();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-5)",
            borderBottom: "1px solid var(--gray-200)",
            background: "var(--gray-0)",
          }}
        >
          {location.pathname.startsWith("/projects/") &&
            VIEWS.map((v) => {
            const enabled = Boolean(v.slug);
            const active = enabled && location.pathname.endsWith(`/${v.slug}`);
            return (
              <button
                key={v.label}
                style={{
                  border: "none",
                  background: active ? "var(--brand-50)" : "transparent",
                  color: active ? "var(--brand-700)" : "var(--gray-600)",
                  fontWeight: active ? 600 : 400,
                  fontSize: "var(--text-sm)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  cursor: enabled ? "pointer" : "not-allowed",
                  opacity: enabled ? 1 : 0.5,
                }}
                disabled={!enabled}
                title={enabled ? `Vista ${v.label}` : "Próximamente"}
                onClick={() => v.slug && navigate(`/projects/${projectId}/${v.slug}`)}
              >
                {v.label}
              </button>
            );
          })}
          <LiveIndicator />
          <InboxButton />
        </header>
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </main>

      <TaskDetailPanel projectId={projectId} />
    </div>
  );
}
