import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { INVITE_MEMBER, WORKSPACE_MEMBERS } from "../../graphql/operations";
import { Avatar, Button, Card, Input } from "../../components/ui";

interface Member {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export function TeamPage() {
  const [{ data, fetching }, refetch] = useQuery<{ workspaceMembers: Member[] }>({
    query: WORKSPACE_MEMBERS,
  });
  const [{ fetching: inviting }, invite] = useMutation(INVITE_MEMBER);

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const members = useMemo(() => data?.workspaceMembers ?? [], [data]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    const fn = fullName.trim();
    if (!em || !fn || !password) return;
    const res = await invite({ email: em, fullName: fn, password });
    if (res.error) {
      setError("No se pudo crear el miembro. ¿El email ya existe?");
      return;
    }
    setCreated({ email: em, password });
    setEmail("");
    setFullName("");
    setPassword("");
    refetch({ requestPolicy: "network-only" });
  }

  function closeModal() {
    setShowModal(false);
    setCreated(null);
    setError(null);
  }

  return (
    <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-2)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Personas</h1>
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => setShowModal(true)}>+ Agregar miembro</Button>
        </div>
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", marginBottom: "var(--space-6)" }}>
        {members.length} {members.length === 1 ? "miembro" : "miembros"} en tu equipo
      </div>

      <div style={{ background: "var(--gray-0)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {fetching && !data ? (
          <Empty text="Cargando…" />
        ) : members.length === 0 ? (
          <Empty text="Todavía no hay miembros." />
        ) : (
          members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--gray-100)" }}>
              <Avatar name={m.fullName} src={m.avatarUrl} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--gray-900)" }}>{m.fullName}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)" }}>{m.email}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: 420, padding: "var(--space-6)" }}>
            {created ? (
              <>
                <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-2)" }}>Miembro creado ✓</h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", marginTop: 0 }}>
                  Pasale estas credenciales para que inicie sesión:
                </p>
                <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                  <div><strong>Email:</strong> {created.email}</div>
                  <div><strong>Contraseña:</strong> {created.password}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
                  <Button onClick={closeModal}>Listo</Button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Agregar miembro</h2>
                <form onSubmit={onInvite} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <Input label="Nombre completo" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="p. ej. Juan Pérez" />
                  <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@empresa.com" />
                  <Input label="Contraseña inicial" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" error={error ?? undefined} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                    <Button variant="ghost" type="button" onClick={closeModal}>Cancelar</Button>
                    <Button type="submit" loading={inviting}>Crear</Button>
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

function Empty({ text }: { text: string }) {
  return <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>{text}</div>;
}
