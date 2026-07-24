import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "urql";
import {
  ADD_COMMENT,
  PROJECT_MEMBERS,
  TASK_COMMENTS,
} from "../../graphql/operations";
import type { Comment, ProjectMember } from "../../types";
import { Avatar } from "../../components/ui";
import { getSocket } from "../../lib/socket";
import { relativeTime } from "../inbox/notificationCopy";
import { useOpenTask, taskPanel } from "./taskPanelStore";
import { MentionComposer } from "./MentionComposer";
import { RichText } from "./RichText";
import { AttachmentsSection } from "./AttachmentsSection";

interface CommentsData {
  taskComments: Comment[];
}
interface MembersData {
  projectMembers: ProjectMember[];
}

/** Panel lateral de detalle de tarea con el hilo de comentarios. */
export function TaskDetailPanel({ projectId }: { projectId: string }) {
  const openTaskId = useOpenTask();
  if (!openTaskId) return null;
  return <Panel key={openTaskId} taskId={openTaskId} projectId={projectId} />;
}

function Panel({ taskId, projectId }: { taskId: string; projectId: string }) {
  const [{ data, fetching }, refetch] = useQuery<CommentsData>({
    query: TASK_COMMENTS,
    variables: { taskId },
  });
  const [{ data: membersData }] = useQuery<MembersData>({
    query: PROJECT_MEMBERS,
    variables: { projectId },
  });
  const [{ fetching: sending }, addComment] = useMutation(ADD_COMMENT);

  const members = useMemo(() => membersData?.projectMembers ?? [], [membersData]);
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((u) => m.set(u.id, u.fullName));
    return m;
  }, [members]);
  const comments = data?.taskComments ?? [];

  // Push en vivo: refrescar si llega un comentario de esta tarea.
  useEffect(() => {
    const socket = getSocket();
    const onAdded = (e: { taskId: string }) => {
      if (e.taskId === taskId) refetch({ requestPolicy: "network-only" });
    };
    socket.on("commentAdded", onAdded);
    return () => {
      socket.off("commentAdded", onAdded);
    };
  }, [taskId, refetch]);

  async function onSend(text: string, mentions: string[]): Promise<boolean> {
    const res = await addComment({ input: { taskId, body: { text, format: "markdown" }, mentions } });
    if (res.error) return false;
    refetch({ requestPolicy: "network-only" });
    return true;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => taskPanel.close()}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.2)", zIndex: 40 }}
      />
      <aside
        role="dialog"
        aria-label="Detalle de la tarea"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: 420,
          maxWidth: "90vw",
          background: "var(--gray-0)",
          borderLeft: "1px solid var(--gray-200)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          zIndex: 41,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-4)",
            borderBottom: "1px solid var(--gray-200)",
          }}
        >
          <strong style={{ fontSize: "var(--text-md)" }}>Comentarios</strong>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => taskPanel.close()}
            style={{ all: "unset", cursor: "pointer", fontSize: 18, color: "var(--gray-400)" }}
          >
            ✕
          </button>
        </header>

        <AttachmentsSection taskId={taskId} />

        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {fetching && comments.length === 0 ? (
            <Placeholder text="Cargando…" />
          ) : comments.length === 0 ? (
            <Placeholder text="Sé el primero en comentar" />
          ) : (
            comments.map((c) => (
              <CommentItem key={c.id} comment={c} authorName={nameById.get(c.authorId)} />
            ))
          )}
        </div>

        <MentionComposer members={members} sending={sending} onSend={onSend} />
      </aside>
    </>
  );
}

function CommentItem({ comment, authorName }: { comment: Comment; authorName?: string }) {
  const text = comment.body?.text ?? "";
  return (
    <div style={{ display: "flex", gap: "var(--space-3)" }}>
      <Avatar name={authorName ?? comment.authorId.slice(0, 2)} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
          <strong style={{ fontSize: "var(--text-sm)" }}>{authorName ?? "Usuario"}</strong>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>
            {relativeTime(comment.createdAt)}
          </span>
        </div>
        <div style={{ marginTop: "var(--space-1)" }}>
          <RichText text={text} />
        </div>
      </div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "var(--text-sm)", padding: "var(--space-6)" }}>
      {text}
    </div>
  );
}
