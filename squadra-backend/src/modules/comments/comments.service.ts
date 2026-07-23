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
