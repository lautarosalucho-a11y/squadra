import { type ReactNode } from "react";

/**
 * Renderer de markdown ligero y SEGURO (sin dangerouslySetInnerHTML).
 * Soporta: **negrita**, *itálica*, `código`, [texto](url) y @menciones.
 * Construye nodos React escapando todo el contenido por defecto.
 */
export function RichText({ text }: { text: string }) {
  return (
    <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--gray-900)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {text.split("\n").map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {inlineParse(line)}
        </span>
      ))}
    </p>
  );
}

// Orden importa: código primero para no formatear su interior.
const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|@\w[\w]*)/g;

function inlineParse(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(renderToken(m[0], k++));
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function renderToken(tok: string, key: number): ReactNode {
  if (tok.startsWith("`") && tok.endsWith("`")) {
    return (
      <code key={key} style={{ background: "var(--gray-100)", padding: "0 4px", borderRadius: "var(--radius-sm)", fontSize: "0.9em", fontFamily: "monospace" }}>
        {tok.slice(1, -1)}
      </code>
    );
  }
  if (tok.startsWith("**") && tok.endsWith("**")) {
    return <strong key={key}>{tok.slice(2, -2)}</strong>;
  }
  if (tok.startsWith("*") && tok.endsWith("*")) {
    return <em key={key}>{tok.slice(1, -1)}</em>;
  }
  if (tok.startsWith("[")) {
    const mm = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(tok);
    if (mm) {
      return (
        <a key={key} href={mm[2]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-600)" }}>
          {mm[1]}
        </a>
      );
    }
  }
  if (tok.startsWith("@")) {
    return (
      <span key={key} style={{ color: "var(--brand-600)", fontWeight: 500 }}>
        {tok}
      </span>
    );
  }
  return tok;
}
