import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TASK_CHANGED,
  TaskChangedEvent,
  NOTIFICATION_CREATED,
  NotificationCreatedEvent,
} from '../realtime/events/task-events';

type NotifType =
  | 'assignment'
  | 'status_changed'
  | 'comment'
  | 'mention'
  | 'due_soon'
  | 'dependency';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Reacciona a cambios de tarea: notifica al responsable y a los seguidores
   * (excepto al actor que originó el cambio).
   */
  @OnEvent(TASK_CHANGED)
  async onTaskChanged(event: TaskChangedEvent): Promise<void> {
    if (event.type === 'deleted') return;

    const task = await this.prisma.task.findFirst({
      where: { id: event.taskId },
      select: { id: true, assigneeId: true, title: true },
    });
    if (!task) return;

    const followers = await this.prisma.taskFollower.findMany({
      where: { taskId: event.taskId },
      select: { userId: true },
    });

    const recipients = new Set<string>();
    if (task.assigneeId) recipients.add(task.assigneeId);
    for (const f of followers) recipients.add(f.userId);
    recipients.delete(event.actorId); // no notificar al propio actor

    const type: NotifType =
      event.type === 'created' ? 'assignment' : 'status_changed';

    for (const userId of recipients) {
      await this.create(userId, type, event.taskId, {
        title: task.title,
        changeType: event.type,
      });
    }
  }

  /** Crea una notificación y dispara el push por WebSocket. */
  async create(
    userId: string,
    type: NotifType,
    taskId: string | null,
    payload: unknown,
  ): Promise<void> {
    const notif = await this.prisma.notification.create({
      data: { userId, type, taskId, payload },
    });
    const evt: NotificationCreatedEvent = {
      userId,
      notificationId: String(notif.id),
      notificationType: type,
      taskId: taskId ?? undefined,
      at: new Date().toISOString(),
    };
    this.events.emit(NOTIFICATION_CREATED, evt);
    // TODO: push a dispositivos (FCM/APNs) leyendo la tabla `devices`.
  }

  inbox(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id: BigInt(id), userId },
      data: { readAt: new Date() },
    });
    return true;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return true;
  }
}
