import { Navigate } from "react-router-dom";
import { useQuery } from "urql";
import { MY_PROJECTS } from "../../graphql/operations";

interface Data {
  myProjects: { id: string; name: string }[];
}

/** Resuelve el primer proyecto del usuario y redirige a su Tablero. */
export function ProjectLanding() {
  const [{ data, fetching, error }] = useQuery<Data>({ query: MY_PROJECTS });

  if (fetching) return <Centered>Cargando tu espacio…</Centered>;
  if (error)
    return (
      <Centered>
        No se pudo conectar con el backend en <code>{import.meta.env.VITE_GRAPHQL_URL}</code>.
      </Centered>
    );

  const first = data?.myProjects[0];
  if (!first)
    return (
      <Centered>
        Tu usuario no tiene proyectos todavía. Corré <code>npm run prisma:seed</code> en el backend.
      </Centered>
    );

  return <Navigate to={`/projects/${first.id}/board`} replace />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh", padding: "var(--space-8)", color: "var(--gray-600)", textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
