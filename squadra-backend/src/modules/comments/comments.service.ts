import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AddCommentInput } from './dto/add-comment.input';
import {
  COMMENT_CREATED,
  CommentCreatedEvent,
} from '../realtime/events/task-events';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly events: EventEmitter2,
  ) {}

  /** Contadores por tarea (adjuntos, comentarios, no leídos del usuario) para un proyecto. */
  async projectTaskMeta(projectId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true },
    });
    const ids = tasks.map((t: { id: string }) => t.id);
    if (ids.length === 0) return [];

    const [atts, comms, unread] = await Promise.all([
      this.prisma.attachment.groupBy({
        by: ['taskId'],
        where: { taskId: { in: ids }, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.comment.groupBy({
        by: ['taskId'],
        where: { taskId: { in: ids }, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.notification.groupBy({
        by: ['taskId'],
        where: {
          taskId: { in: ids },
          userId,
          type: { in: ['comment', 'mention'] },
          readAt: null,
        },
        _count: { _all: true },
      }),
    ]);

    const aMap = new Map(atts.map((a) => [a.taskId, a._count._all]));
    const cMap = new Map(comms.map((c) => [c.taskId, c._count._all]));
    const uMap = new Map(unread.map((u) => [u.taskId, u._count._all]));

    return ids.map((id) => ({
      taskId: id,
      attachmentCount: aMap.get(id) ?? 0,
      commentCount: cMap.get(id) ?? 0,
      unreadCommentCount: uMap.get(id) ?? 0,
    }));
  }

  /** Marca como leídos los comentarios/menciones del usuario en una tarea. */
  async markTaskCommentsRead(taskId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        taskId,
        userId,
        type: { in: ['comment', 'mention'] },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return true;
  }

  /** Hilo de comentarios de una tarea (orden cronológico). */
  async list(taskId: string) {
    const rows = await this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { mentions: { select: { userId: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      body: c.body,
      createdAt: c.createdAt,
      mentions: c.mentions.map((m: { userId: string }) => m.userId),
    }));
  }

  /** Crea un comentario, registra menciones y notifica a los involucrados. */
  async add(input: AddCommentInput, authorId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null },
      select: { id: true, projectId: true, title: true, assigneeId: true },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    const mentions = (input.mentions ?? []).filter((u) => u !== authorId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId: input.taskId,
        authorId,
        body: input.body as object,
        mentions: {
          create: mentions.map((userId) => ({ userId })),
        },
      },
    });

    // Notificar a mencionados ('mention') y al responsable ('comment').
    const notified = new Set<string>();
    for (const userId of mentions) {
      notified.add(userId);
      await this.notifications.create(userId, 'mention', task.id, {
        title: task.title,
        commentId: comment.id,
      });
    }
    if (task.assigneeId && task.assigneeId !== authorId && !notified.has(task.assigneeId)) {
      await this.notifications.create(task.assigneeId, 'comment', task.id, {
        title: task.title,
        commentId: comment.id,
      });
    }

    // Push en vivo del comentario al room del proyecto.
    const evt: CommentCreatedEvent = {
      projectId: task.projectId,
      taskId: task.id,
      commentId: comment.id,
      authorId,
      at: new Date().toISOString(),
    };
    this.events.emit(COMMENT_CREATED, evt);

    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      body: comment.body,
      createdAt: comment.createdAt,
      mentions,
    };
  }
}
