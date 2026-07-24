import { type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  CREATE_PORTFOLIO_FOR_ME,
  DELETE_PORTFOLIO,
  MY_PORTFOLIOS,
  MY_PROJECTS,
  RENAME_PORTFOLIO,
  SET_PROJECT_PORTFOLIO,
} from "../../graphql/operations";
import { Button, Card, Input } from "../../components/ui";
import { InlineEdit } from "../list/InlineEdit";

interface Portfolio {
  id: string;
  name: string;
}
interface Project {
  id: string;
  name: string;
  defaultView: string;
  portfolioId: string | null;
}

const VIEW_SLUG: Record<string, string> = { list: "list", board: "board", calendar: "calendar", gantt: "timeline" };

export function PortfoliosPage() {
  const navigate = useNavigate();
  const [{ data: pfData }, refetchPf] = useQuery<{ myPortfolios: Portfolio[] }>({ query: MY_PORTFOLIOS });
  const [{ data: projData }, refetchProj] = useQuery<{ myProjects: Project[] }>({ query: MY_PROJECTS });
  const [{ fetching: creating }, createPortfolio] = useMutation(CREATE_PORTFOLIO_FOR_ME);
  const [, setProjectPortfolio] = useMutation(SET_PROJECT_PORTFOLIO);
  const [, renamePortfolio] = useMutation(RENAME_PORTFOLIO);
  const [, deletePortfolio] = useMutation(DELETE_PORTFOLIO);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");

  const portfolios = useMemo(() => pfData?.myPortfolios ?? [], [pfData]);
  const projects = useMemo(() => projData?.myProjects ?? [], [projData]);

  const byPortfolio = useMemo(() => {
    const m = new Map<string | null, Project[]>();
    for (const p of projects) {
      const k = p.portfolioId ?? null;
      (m.get(k) ?? m.set(k, []).get(k)!).push(p);
    }
    return m;
  }, [projects]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const res = await createPortfolio({ name: n });
    if (!res.error) {
      setShowModal(false);
      setName("");
      refetchPf({ requestPolicy: "network-only" });
    }
  }

  async function onAssign(projectId: string, portfolioId: string) {
    await setProjectPortfolio({ projectId, portfolioId: portfolioId || null });
    refetchProj({ requestPolicy: "network-only" });
  }

  async function onRenamePortfolio(id: string, next: string) {
    await renamePortfolio({ id, name: next });
    refetchPf({ requestPolicy: "network-only" });
  }

  async function onDeletePortfolio(id: string, portfolioName: string) {
    if (!window.confirm(`¿Eliminar el portafolio "${portfolioName}"? Los proyectos quedan sin portafolio.`)) return;
    const res = await deletePortfolio({ id });
    if (!res.error) {
      refetchPf({ requestPolicy: "network-only" });
      refetchProj({ requestPolicy: "network-only" });
    }
  }

  const groups: { id: string | null; name: string; projects: Project[] }[] = [
    ...portfolios.map((pf) => ({ id: pf.id, name: pf.name, projects: byPortfolio.get(pf.id) ?? [] })),
    { id: null, name: "Sin portafolio", projects: byPortfolio.get(null) ?? [] },
  ];

  return (
    <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Portafolios</h1>
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => setShowModal(true)}>+ Crear portafolio</Button>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.id ?? "__none__"} style={{ marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
            <span aria-hidden>🗂</span>
            {g.id ? (
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, minWidth: 120 }}>
                <InlineEdit value={g.name} onCommit={(next) => onRenamePortfolio(g.id!, next)} />
              </div>
            ) : (
              <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>{g.name}</h2>
            )}
            <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)" }}>{g.projects.length}</span>
            {g.id && (
              <button
                type="button"
                aria-label="Eliminar portafolio"
                title="Eliminar portafolio"
                onClick={() => onDeletePortfolio(g.id!, g.name)}
                style={{ all: "unset", cursor: "pointer", marginLeft: "auto", color: "var(--gray-400)", fontSize: 15 }}
              >
                🗑
              </button>
            )}
          </div>

          <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {g.projects.length === 0 ? (
              <div style={{ padding: "var(--space-5)", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>Sin proyectos</div>
            ) : (
              g.projects.map((p) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "var(--space-3)", alignItems: "center", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--gray-100)" }}>
                  <button type="button" onClick={() => navigate(`/projects/${p.id}/${VIEW_SLUG[p.defaultView] ?? "board"}`)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-md)", color: "var(--gray-900)", fontWeight: 500 }}>
                    <span aria-hidden>📋</span> {p.name}
                  </button>
                  <select
                    value={p.portfolioId ?? ""}
                    aria-label="Mover a portafolio"
                    onChange={(e) => onAssign(p.id, e.target.value)}
                    style={{ height: 30, fontSize: "var(--text-sm)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", padding: "0 var(--space-2)", background: "var(--gray-0)", fontFamily: "inherit", cursor: "pointer" }}
                  >
                    <option value="">Sin portafolio</option>
                    {portfolios.map((pf) => (
                      <option key={pf.id} value={pf.id}>{pf.name}</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </section>
      ))}

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: 380, padding: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Nuevo portafolio</h2>
            <form onSubmit={onCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input label="Nombre del portafolio" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Iniciativas 2026" />
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
