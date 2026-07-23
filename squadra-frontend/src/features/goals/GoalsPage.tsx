import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { CREATE_GOAL, DELETE_GOAL, MY_GOALS, UPDATE_GOAL } from "../../graphql/operations";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  type Goal,
  type GoalStatus,
} from "../../types";
import { Button, Card, Input } from "../../components/ui";

const STATUS_ORDER: GoalStatus[] = ["on_track", "at_risk", "off_track", "achieved"];

export function GoalsPage() {
  const [{ data, fetching }, refetch] = useQuery<{ myGoals: Goal[] }>({ query: MY_GOALS });
  const [{ fetching: creating }, createGoal] = useMutation(CREATE_GOAL);
  const [, updateGoal] = useMutation(UPDATE_GOAL);
  const [, deleteGoal] = useMutation(DELETE_GOAL);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [goals, setGoals] = useState<Goal[] | null>(null);

  const list = goals ?? data?.myGoals ?? [];
  const avg = useMemo(
    () => (list.length ? Math.round(list.reduce((s, g) => s + g.progress, 0) / list.length) : 0),
    [list],
  );

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const res = await createGoal({ input: { title: t } });
    if (!res.error) {
      setShowModal(false);
      setTitle("");
      refetch({ requestPolicy: "network-only" });
    }
  }

  function patchLocal(id: string, patch: Partial<Goal>) {
    setGoals((prev) => (prev ?? data?.myGoals ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  async function onProgress(goal: Goal, progress: number) {
    patchLocal(goal.id, { progress });
    const res = await updateGoal({ id: goal.id, input: { progress } });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onStatus(goal: Goal, status: GoalStatus) {
    patchLocal(goal.id, { status });
    const res = await updateGoal({ id: goal.id, input: { status } });
    if (res.error) refetch({ requestPolicy: "network-only" });
  }
  async function onDelete(goal: Goal) {
    setGoals((prev) => (prev ?? data?.myGoals ?? []).filter((g) => g.id !== goal.id));
    await deleteGoal({ id: goal.id });
    refetch({ requestPolicy: "network-only" });
  }

  return (
    <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-2)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Estrategia · Objetivos</h1>
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => setShowModal(true)}>+ Crear objetivo</Button>
        </div>
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", marginBottom: "var(--space-6)" }}>
        {list.length} objetivos · progreso promedio {avg}%
      </div>

      {fetching && !data ? (
        <Centered>Cargando objetivos…</Centered>
      ) : list.length === 0 ? (
        <Centered>Todavía no hay objetivos. Creá el primero para definir tu estrategia.</Centered>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {list.map((g) => {
            const c = GOAL_STATUS_COLORS[g.status];
            return (
              <Card key={g.id} style={{ padding: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-lg)", fontWeight: 600, flex: 1, minWidth: 0 }}>{g.title}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, padding: "2px var(--space-2)", borderRadius: "var(--radius-full)", background: c.bg, color: c.fg }}>
                    {GOAL_STATUS_LABELS[g.status]}
                  </span>
                  <select
                    value={g.status}
                    aria-label="Estado del objetivo"
                    onChange={(e) => onStatus(g, e.target.value as GoalStatus)}
                    style={{ height: 28, fontSize: "var(--text-xs)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", background: "var(--gray-0)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{GOAL_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button type="button" aria-label="Eliminar" title="Eliminar" onClick={() => onDelete(g)} style={{ all: "unset", cursor: "pointer", color: "var(--gray-400)", fontSize: 14 }}>
                    🗑
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                  <div style={{ flex: 1, height: 8, background: "var(--gray-100)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ width: `${g.progress}%`, height: "100%", background: c.fg, transition: "width var(--motion-base) var(--ease)" }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={g.progress}
                    aria-label="Progreso"
                    onChange={(e) => onProgress(g, Number(e.target.value))}
                    style={{ width: 140, accentColor: c.fg }}
                  />
                  <span style={{ width: 42, textAlign: "right", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--gray-700)" }}>
                    {g.progress}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: 400, padding: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Nuevo objetivo</h2>
            <form onSubmit={onCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input label="Objetivo" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. Duplicar ventas en Q4" />
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: "var(--space-10)", color: "var(--gray-500)", fontSize: "var(--text-sm)", textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
