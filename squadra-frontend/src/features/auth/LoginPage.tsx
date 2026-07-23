import { type FormEvent, useState } from "react";
import { useMutation } from "urql";
import { useNavigate } from "react-router-dom";
import { LOGIN } from "../../graphql/operations";
import { auth } from "../../lib/auth";
import { Button, Card, Input } from "../../components/ui";

interface LoginResult {
  login: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; fullName: string };
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const [{ fetching }, login] = useMutation<LoginResult>(LOGIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await login({ input: { email, password } });
    if (res.error || !res.data) {
      setError("Credenciales inválidas o servidor no disponible.");
      return;
    }
    const { accessToken, refreshToken } = res.data.login;
    auth.setTokens(accessToken, refreshToken);
    navigate("/");
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: "var(--space-4)" }}>
      <Card style={{ width: 360, padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-1)", color: "var(--brand-600)" }}>
          Squadra
        </h1>
        <p style={{ color: "var(--gray-600)", fontSize: "var(--text-sm)", marginTop: 0, marginBottom: "var(--space-5)" }}>
          Iniciá sesión para continuar
        </p>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" loading={fetching}>
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
