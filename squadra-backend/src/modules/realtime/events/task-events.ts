/**
 * Evento de dominio único para cambios de tarea. Lo emiten los servicios
 * y lo consumen RealtimeGateway, NotificationsService y AutomationsService.
 */
export const TASK_CHANGED = 'task.changed';

export type TaskChangeType = 'created' | 'updated' | 'moved' | 'deleted';

/** Origen del cambio: 'user' o 'automation' (para evitar bucles de reglas). */
export type ChangeSource = 'user' | 'automation';

export interface TaskChangedEvent {
  type: TaskChangeType;
  projectId: string;
  taskId: string;
  actorId: string;
  source: ChangeSource;
  /** Snapshot de la tarea (ausente en 'deleted'). */
  task?: unknown;
  at: string; // ISO timestamp
}

/** Evento emitido al crear un comentario (push al room del proyecto). */
export const COMMENT_CREATED = 'comment.created';

export interface CommentCreatedEvent {
  projectId: string;
  taskId: string;
  commentId: string;
  authorId: string;
  at: string;
}

/** Evento emitido cuando se crea una notificación (para push por WebSocket). */
export const NOTIFICATION_CREATED = 'notification.created';

export interface NotificationCreatedEvent {
  userId: string;
  notificationId: string;
  notificationType: string;
  taskId?: string;
  at: string;
}
