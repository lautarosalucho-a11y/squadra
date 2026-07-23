import { type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import { CREATE_PROJECT_FOR_ME, MY_PROJECTS } from "../../graphql/operations";
import { Button, Card, Input } from "../../components/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  defaultView: string;
  updatedAt: string;
}

const VIEW_SLUG: Record<string, string> = {
  list: "list",
  board: "board",
  calendar: "calendar",
  gantt: "timeline",
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const [{ data, fetching }, refetch] = useQuery<{ myProjects: Project[] }>({ query: MY_PROJECTS });
  const [{ fetching: creating }, createProject] = useMutation(CREATE_PROJECT_FOR_ME);

  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");

  const projects = useMemo(() => {
    const list = data?.myProjects ?? [];
    const t = q.trim().toLowerCase();
    return t ? list.filter((p) => p.name.toLowerCase().includes(t)) : list;
  }, [data, q]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const res = await createProject({ name: n });
    if (!res.error && res.data?.createProjectForMe) {
      const p = res.data.createProjectForMe as Project;
      setShowModal(false);
      setName("");
      refetch({ requestPolicy: "network-only" });
      navigate(`/projects/${p.id}/${VIEW_SLUG[p.defaultView] ?? "board"}`);
    }
  }

  return (
    <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Proyectos</h1>
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => setShowModal(true)}>+ Crear proyecto</Button>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <Input placeholder="🔎 Buscar un proyecto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar proyecto" />
      </div>

      <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 160px", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--gray-200)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: 0.3 }}>
          <span>Nombre</span>
          <span>Vista</span>
          <span>Última modificación</span>
        </div>

        {fetching && !data ? (
          <Empty text="Cargando…" />
        ) : projects.length === 0 ? (
          <Empty text={q ? "Ningún proyecto coincide." : "Todavía no tenés proyectos. Creá el primero."} />
        ) : (
          projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/projects/${p.id}/${VIEW_SLUG[p.defaultView] ?? "board"}`)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "1fr 120px 160px",
                gap: "var(--space-3)",
                alignItems: "center",
                padding: "var(--space-3) var(--space-4)",
                borderBottom: "1px solid var(--gray-100)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-md)", color: "var(--gray-900)", fontWeight: 500 }}>
                <span aria-hidden>📋</span> {p.name}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", textTransform: "capitalize" }}>{p.defaultView}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)" }}>
                {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: es })}
              </span>
            </button>
          ))
        )}
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: 380, padding: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Nuevo proyecto</h2>
            <form onSubmit={onCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input label="Nombre del proyecto" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Lanzamiento Q4" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" loading={creating}>Crear</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>{text}</div>;
}
