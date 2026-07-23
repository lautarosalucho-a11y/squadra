import type { ProjectMember } from "../../types";
import { Avatar } from "../../components/ui";

interface Props {
  assigneeId: string | null;
  members: ProjectMember[];
  onChange: (assigneeId: string | null) => void;
}

/** Selector de responsable con avatar + <select> nativo de miembros del proyecto. */
export function AssigneeSelect({ assigneeId, members, onChange }: Props) {
  const current = members.find((m) => m.id === assigneeId);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
      <Avatar name={current?.fullName ?? null} src={current?.avatarUrl} size="sm" />
      <select
        value={assigneeId ?? ""}
        aria-label="Responsable"
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          flex: 1,
          minWidth: 0,
          appearance: "none",
          border: "none",
          background: "transparent",
          fontSize: "var(--text-sm)",
          color: current ? "var(--gray-900)" : "var(--gray-400)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <option value="">Sin asignar</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.fullName}
          </option>
        ))}
      </select>
    </div>
  );
}
