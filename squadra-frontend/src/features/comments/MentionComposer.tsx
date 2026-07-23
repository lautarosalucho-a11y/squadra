import { useMemo, useRef, useState } from "react";
import type { ProjectMember } from "../../types";
import { Button } from "../../components/ui";

interface Props {
  members: ProjectMember[];
  sending: boolean;
  onSend: (text: string, mentions: string[]) => void;
}

/** Composer de comentario con autocompletado de @menciones. */
export function MentionComposer({ members, sending, onSend }: Props) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLTextAreaElement>(null);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return members.filter((m) => m.fullName.toLowerCase().includes(q)).slice(0, 5);
  }, [query, members]);

  function onChange(value: string) {
    setText(value);
    const m = value.slice(0, ref.current?.selectionStart ?? value.length).match(/@(\w*)$/);
    setQuery(m ? m[1] : null);
  }

  function pick(member: ProjectMember) {
    // Reemplaza el "@token" final por "@Nombre ".
    setText((t) => t.replace(/@(\w*)$/, `@${member.fullName} `));
    setPicked((p) => new Set(p).add(member.id));
    setQuery(null);
    ref.current?.focus();
  }

  function wrap(before: string, after = before) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = text.slice(s, e) || "texto";
    const next = text.slice(0, s) + before + sel + after + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }

  function send() {
    const body = text.trim();
    if (!body) return;
    // Solo menciones cuyo nombre sigue presente en el texto.
    const mentions = members
      .filter((m) => picked.has(m.id) && text.includes(`@${m.fullName}`))
      .map((m) => m.id);
    onSend(body, mentions);
    setText("");
    setPicked(new Set());
  }

  return (
    <div style={{ position: "relative", borderTop: "1px solid var(--gray-200)", padding: "var(--space-3)" }}>
      {matches.length > 0 && (
        <ul
          style={{
            position: "absolute",
            bottom: "calc(100% - var(--space-2))",
            left: "var(--space-3)",
            right: "var(--space-3)",
            margin: 0,
            padding: "var(--space-1)",
            listStyle: "none",
            background: "var(--gray-0)",
            border: "1px solid var(--gray-200)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            zIndex: 5,
          }}
        >
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => pick(m)}
                style={{
                  all: "unset",
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                }}
              >
                <strong>{m.fullName}</strong>{" "}
                <span style={{ color: "var(--gray-400)" }}>{m.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-1)" }}>
        {([
          ["B", "**", "Negrita"],
          ["I", "*", "Itálica"],
          ["</>", "`", "Código"],
        ] as const).map(([label, syntax, title]) => (
          <button
            key={label}
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrap(syntax)}
            style={{
              all: "unset",
              cursor: "pointer",
              fontSize: "var(--text-xs)",
              fontWeight: label === "B" ? 700 : 500,
              fontStyle: label === "I" ? "italic" : "normal",
              color: "var(--gray-600)",
              padding: "2px var(--space-2)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--gray-200)",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={text}
        rows={3}
        placeholder="Escribí un comentario… usá @ para mencionar"
        aria-label="Nuevo comentario"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
          padding: "var(--space-2)",
          fontSize: "var(--text-md)",
          fontFamily: "inherit",
          border: "1px solid var(--gray-200)",
          borderRadius: "var(--radius-md)",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
        <Button size="sm" loading={sending} onClick={send}>
          Comentar
        </Button>
      </div>
    </div>
  );
}
