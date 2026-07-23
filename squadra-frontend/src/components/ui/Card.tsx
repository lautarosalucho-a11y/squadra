import { type CSSProperties, type HTMLAttributes, forwardRef } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  dragging?: boolean;
}

/**
 * Card — superficie contenedora. Variante interactive añade hover;
 * dragging eleva la sombra durante el arrastre (Kanban).
 */
export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { interactive, dragging, style, ...rest },
  ref,
) {
  const s: CSSProperties = {
    background: "var(--gray-0)",
    border: "1px solid var(--gray-200)",
    borderRadius: "var(--radius-md)",
    boxShadow: dragging ? "var(--shadow-md)" : "var(--shadow-xs)",
    padding: "var(--space-3)",
    cursor: interactive ? "grab" : "default",
    transition: "box-shadow var(--motion-fast) var(--ease)",
    ...style,
  };
  return <div ref={ref} style={s} {...rest} />;
});
