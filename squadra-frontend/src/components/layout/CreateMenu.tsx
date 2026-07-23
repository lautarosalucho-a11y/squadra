import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  CREATE_PROJECT_FOR_ME,
  CREATE_TASK,
  MY_PROJECTS,
} from "../../graphql/operations";
import { Button, Card, Input } from "../ui";

type Modal = "task" | "project" | null;
const VIEW_SLUG: Record<string, string> = { list: "list", board: "board", calendar: "calendar", gantt: "timeline" };

/** Botón "+ Crear" global: crea tarea o proyecto desde cualquier pantalla. */
export function CreateMenu() {
  const navigate = useNavigate();
  const [{ data }] = useQuery<{ myProjects: { id: string; name: string; defaultView: string }[] }>({ query: MY_PROJECTS });
  const [{ fetching: creatingTask }, createTask] = useMutation(CREATE_TASK);
  const [{ fetching: creatingProject }, createProject] = useMutation(CREATE_PROJECT_FOR_ME);

  const projects = data?.myProjects ?? [];
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskProject, setTaskProject] = useState("");
  const [projectName, setProjectName] = useState("");

  function openModal(m: Modal) {
    setOpen(false);
    setModal(m);
    if (m === "task") setTaskProject(projects[0]?.id ?? "");
  }
  function close() {
    setModal(null);
    setTaskTitle("");
    setProjectName("");
  }

  async function onCreateTask(e: FormEvent) {
    e.preventDefault();
    const title = taskTitle.trim();
    if (!title || !taskProject) return;
    const res = await createTask({ input: { projectId: taskProject, title } });
    if (!res.error) {
      const p = projects.find((x) => x.id === taskProject);
      close();
      navigate(`/projects/${taskProject}/${VIEW_SLUG[p?.defaultView ?? "board"] ?? "board"}`);
    }
  }

  async function onCreateProject(e: FormEvent) {
    e.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    const res = await createProject({ name });
    if (!res.error && res.data?.createProjectForMe) {
      const p = res.data.createProjectForMe as { id: string; defaultView: string };
      close();
      navigate(`/projects/${p.id}/${VIEW_SLUG[p.defaultView] ?? "board"}`);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <Button onClick={() => setOpen((v) => !v)} style={{ width: "100%", justifyContent: "flex-start" }}>
        ＋ Crear
      </Button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)", padding: "var(--space-1)", zIndex: 31 }}>
            <MenuItem label="Tarea" onClick={() => openModal("task")} />
            <MenuItem label="Proyecto" onClick={() => openModal("project")} />
          </div>
        </>
      )}

      {modal && (
        <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: 420, padding: "var(--space-6)" }}>
            {modal === "task" ? (
              <>
                <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Nueva tarea</h2>
                {projects.length === 0 ? (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)" }}>
                    Primero creá un proyecto.
                  </p>
                ) : (
                  <form onSubmit={onCreateTask} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <Input label="Título" autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="p. ej. Escribir el brief" />
                    <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--gray-700)" }}>Proyecto</span>
                      <select value={taskProject} onChange={(e) => setTaskProject(e.target.value)} style={{ height: 38, border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "0 var(--space-2)", fontFamily: "inherit", fontSize: "var(--text-md)" }}>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                      <Button variant="ghost" type="button" onClick={close}>Cancelar</Button>
                      <Button type="submit" loading={creatingTask}>Crear</Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Nuevo proyecto</h2>
                <form onSubmit={onCreateProject} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <Input label="Nombre del proyecto" autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="p. ej. Lanzamiento Q4" />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                    <Button variant="ghost" type="button" onClick={close}>Cancelar</Button>
                    <Button type="submit" loading={creatingProject}>Crear</Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--gray-900)" }}
    >
      {label}
    </button>
  );
}
