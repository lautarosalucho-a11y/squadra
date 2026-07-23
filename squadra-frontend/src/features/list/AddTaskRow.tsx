import { type FormEvent, useState } from "react";

interface Props {
  onCreate: (title: string) => void;
}

/** Fila para crear una tarea rápida al pie de un grupo. */
export function AddTaskRow({ onCreate }: Props) {
  const [title, setTitle] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onCreate(t);
    setTitle("");
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-4)",
        paddingLeft: "calc(var(--space-4) + var(--space-6))",
      }}
    >
      <span style={{ color: "var(--gray-400)" }}>＋</span>
      <input
        value={title}
        placeholder="Añadir tarea…"
        aria-label="Título de la nueva tarea"
        onChange={(e) => setTitle(e.target.value)}
        style={{
          flex: 1,
          height: 28,
          border: "none",
          outline: "none",
          fontSize: "var(--text-md)",
          background: "transparent",
          color: "var(--gray-900)",
        }}
      />
    </form>
  );
}
