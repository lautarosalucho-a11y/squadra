export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  projectId?: string;
  sectionId: string | null;
  assigneeId: string | null;
  startDate?: string | null;
  dueDate: string | null;
  description?: { text?: string } | null;
  position: number;
  version: number;
  subtasks?: Task[];
}

export type NotificationType =
  | "assignment"
  | "status_changed"
  | "comment"
  | "mention"
  | "due_soon"
  | "dependency";

export interface Notification {
  id: string;
  taskId: string | null;
  type: NotificationType | string;
  payload?: { title?: string; changeType?: string; dueDate?: string } | null;
  readAt: string | null;
  createdAt: string;
}

export type GoalStatus = "on_track" | "at_risk" | "off_track" | "achieved";

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  ownerId?: string | null;
  status: GoalStatus;
  progress: number;
  dueDate?: string | null;
  version: number;
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  on_track: "En curso",
  at_risk: "En riesgo",
  off_track: "Desviado",
  achieved: "Logrado",
};

export const GOAL_STATUS_COLORS: Record<GoalStatus, { bg: string; fg: string }> = {
  on_track: { bg: "#dbeafe", fg: "#1d4ed8" },
  at_risk: { bg: "#fef3c7", fg: "#b45309" },
  off_track: { bg: "#fee2e2", fg: "#b91c1c" },
  achieved: { bg: "#dcfce7", fg: "#15803d" },
};

export type CustomFieldType = "text" | "number" | "dropdown";

export interface CustomFieldOption {
  id: string;
  label: string;
  color?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: CustomFieldOption[] | null;
  position: number;
}

export interface CustomFieldValue {
  taskId: string;
  customFieldId: string;
  value?: { text?: string; number?: number; optionId?: string } | null;
}

export interface ProjectMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  authorId: string;
  body: { text?: string; format?: string } | null;
  mentions: string[];
  createdAt: string;
}

export const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
];

export interface TaskGroup {
  key: string | null; // sectionId
  label?: string | null;
  tasks: Task[];
}

export interface GroupedTasks {
  groups: TaskGroup[];
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Por hacer",
  in_progress: "En curso",
  in_review: "En revisión",
  done: "Hecho",
  blocked: "Bloqueada",
};
