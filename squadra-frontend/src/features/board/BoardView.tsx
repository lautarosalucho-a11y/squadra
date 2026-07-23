import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "urql";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CREATE_TASK, MOVE_TASK, PROJECT_BOARD } from "../../graphql/operations";
import type { GroupedTasks } from "../../types";
import { BoardColumn } from "./BoardColumn";
import { useProjectRealtime } from "../realtime/useProjectRealtime";

interface BoardData {
  projectTasks: GroupedTasks;
}

export function BoardView() {
  const { projectId = "demo" } = useParams();
  const [{ data, fetching, error }, refetch] = useQuery<BoardData>({
    query: PROJECT_BOARD,
    variables: { projectId },
  });
  const [, moveTask] = useMutation(MOVE_TASK);
  const [, createTask] = useMutation(CREATE_TASK);

  // Copia local para actualización optimista al soltar.
  const [override, setOverride] = useState<GroupedTasks | null>(null);
  const board = override ?? data?.projectTasks ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const groups = useMemo(() => board?.groups ?? [], [board]);

  // Sincronización en vivo: descarta el override optimista y trae lo canónico.
  useProjectRealtime(projectId, {
    onChange: () => {
      setOverride(null);
      refetch({ requestPolicy: "network-only" });
    },
  });

  async function onDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    const fromSection = e.active.data.current?.sectionId ?? null;
    const toSection = e.over ? String(e.over.id) : null;
    if (!toSection || toSection === "__none__" || toSection === fromSection) return;

    // Optimista: mover la card en el estado local.
    setOverride((prev) => {
      const src = prev ?? data?.projectTasks;
      if (!src) return prev;
      const next = src.groups.map((g) => ({ ...g, tasks: [...g.tasks] }));
      let moved;
      for (const g of next) {
        const i = g.tasks.findIndex((t) => t.id === taskId);
        if (i >= 0) { moved = g.tasks.splice(i, 1)[0]; break; }
      }
      const dest = next.find((g) => (g.key ?? "__none__") === toSection);
      if (moved && dest) dest.tasks.push({ ...moved, sectionId: dest.key });
      return { groups: next };
    });

    const res = await moveTask({ input: { taskId, sectionId: toSection } });
    if (res.error) {
      setOverride(null); // rollback
      refetch({ requestPolicy: "network-only" });
    }
  }

  async function onCreate(sectionId: string | null, title: string) {
    const res = await createTask({
      input: { projectId, title, sectionId: sectionId ?? undefined },
    });
    if (!res.error) refetch({ requestPolicy: "network-only" });
  }

  if (fetching && !board) return <Centered>Cargando tablero…</Centered>;
  if (error && !board)
    return (
      <Centered>
        No se pudo cargar el tablero. Verificá que el backend esté corriendo en{" "}
        <code>{import.meta.env.VITE_GRAPHQL_URL}</code>.
      </Centered>
    );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          padding: "var(--space-5)",
          height: "100%",
          alignItems: "flex-start",
          overflowX: "auto",
        }}
      >
        {groups.map((g) => (
          <BoardColumn key={g.key ?? "__none__"} group={g} onCreate={onCreate} />
        ))}
      </div>
    </DndContext>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100%",
        padding: "var(--space-8)",
        color: "var(--gray-600)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}
