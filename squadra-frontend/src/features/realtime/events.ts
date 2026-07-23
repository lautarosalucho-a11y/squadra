/** Espejo de los contratos de evento del gateway (backend NestJS). */

export type TaskChangeType = "created" | "updated" | "moved" | "deleted";
export type ChangeSource = "user" | "automation";

export interface TaskChangedEvent {
  type: TaskChangeType;
  projectId: string;
  taskId: string;
  actorId: string;
  source: ChangeSource;
  task?: unknown;
  at: string;
}

export interface InboxUpdatedEvent {
  userId: string;
  notificationId: string;
  notificationType: string;
  taskId?: string;
  at: string;
}
