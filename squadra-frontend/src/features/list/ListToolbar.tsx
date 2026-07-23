import { STATUS_LABELS, STATUS_ORDER, type ProjectMember, type TaskStatus } from "../../types";

export type GroupMode = "section" | "assignee" | "none";
export interface ColumnDef {
  id: string;
  label: string;
}

interface Props {
  members: ProjectMember[];
  toggleableColumns: ColumnDef[];
  visibleCols: Set<string>;
  onToggleCol: (id: string) => void;
  filterStatus: TaskStatus | "";
  onFilterStatus: (s: TaskStatus | "") => void;
  filterAssignee: string;
  onFilterAssignee: (id: string) => void;
  sortCol: string;
  sortDir: "asc" | "desc";
  onSort: (col: string, dir: "asc" | "desc") => void;
  groupBy: GroupMode;
  onGroupBy: (g: GroupMode) => void;
}

const selStyle: React.CSSProperties = {
  height: 30,
  fontSize: "var(--text-sm)",
  border: "1px solid var(--gray-200)",
  borderRadius: "var(--radius-sm)",
  padding: "0 var(--space-2)",
  background: "var(--gray-0)",
  fontFamily: "inherit",
  cursor: "pointer",
};

export function ListToolbar(p: Props) {
  const active = p.filterStatus || p.filterAssignee;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        flexWrap: "wrap",
        padding: "0 var(--space-4) var(--space-3)",
      }}
    >
      {/* Filtrar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <span style={{ fontSize: "var(--text-sm)", color: active ? "var(--brand-700)" : "var(--gray-600)", fontWeight: 600 }}>
          ⧩ Filtrar
        </span>
        <select value={p.filterStatus} onChange={(e) => p.onFilterStatus(e.target.value as TaskStatus | "")} style={selStyle} aria-label="Filtrar por estado">
          <option value="">Estado: todos</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={p.filterAssignee} onChange={(e) => p.onFilterAssignee(e.target.value)} style={selStyle} aria-label="Filtrar por responsable">
          <option value="">Responsable: todos</option>
          {p.members.map((m) => (
            <option key={m.id} value={m.id}>{m.fullName}</option>
          ))}
        </select>
      </div>

      {/* Ordenar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", fontWeight: 600 }}>↕ Ordenar</span>
        <select value={p.sortCol} onChange={(e) => p.onSort(e.target.value, p.sortDir)} style={selStyle} aria-label="Ordenar por">
          <option value="">Sin orden</option>
          <option value="name">Nombre</option>
          <option value="due">Vence</option>
          <option value="status">Estado</option>
        </select>
        {p.sortCol && (
          <button
            type="button"
            onClick={() => p.onSort(p.sortCol, p.sortDir === "asc" ? "desc" : "asc")}
            title={p.sortDir === "asc" ? "Ascendente" : "Descendente"}
            style={{ ...selStyle, width: 30, padding: 0 }}
          >
            {p.sortDir === "asc" ? "↑" : "↓"}
          </button>
        )}
      </div>

      {/* Agrupar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-600)", fontWeight: 600 }}>⊞ Agrupar</span>
        <select value={p.groupBy} onChange={(e) => p.onGroupBy(e.target.value as GroupMode)} style={selStyle} aria-label="Agrupar por">
          <option value="section">Sección</option>
          <option value="assignee">Responsable</option>
          <option value="none">Ninguno</option>
        </select>
      </div>

      {/* Columnas */}
      <details style={{ marginLeft: "auto", position: "relative" }}>
        <summary style={{ listStyle: "none", cursor: "pointer", fontSize: "var(--text-sm)", color: "var(--gray-600)", fontWeight: 600 }}>
          ▦ Columnas
        </summary>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "var(--gray-0)",
            border: "1px solid var(--gray-200)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            padding: "var(--space-2)",
            minWidth: 180,
            zIndex: 10,
          }}
        >
          {p.toggleableColumns.map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
              <input type="checkbox" checked={p.visibleCols.has(c.id)} onChange={() => p.onToggleCol(c.id)} style={{ accentColor: "var(--brand-500)" }} />
              {c.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
