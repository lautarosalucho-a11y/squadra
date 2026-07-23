import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { REMINDERS_QUEUE } from './reminders.service';

const WINDOW_HOURS = 24; // avisar tareas que vencen dentro de este horizonte
const DEDUP_HOURS = 20; // no repetir aviso si ya se envió hace poco

/**
 * Escanea tareas con vencimiento próximo (no completadas ni borradas) y crea
 * una notificación `due_soon` para el responsable, evitando duplicados.
 */
@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<{ sent: number }> {
    const now = new Date();
    const horizon = new Date(now.getTime() + WINDOW_HOURS * 3600_000);
    const dedupSince = new Date(now.getTime() - DEDUP_HOURS * 3600_000);

    const due = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        completedAt: null,
        status: { not: 'done' },
        assigneeId: { not: null },
        dueDate: { gte: now, lte: horizon },
      },
      select: { id: true, assigneeId: true, title: true, dueDate: true },
    });

    let sent = 0;
    for (const task of due) {
      const already = await this.prisma.notification.count({
        where: {
          userId: task.assigneeId as string,
          taskId: task.id,
          type: 'due_soon',
          createdAt: { gte: dedupSince },
        },
      });
      if (already > 0) continue;

      await this.notifications.create(
        task.assigneeId as string,
        'due_soon',
        task.id,
        { title: task.title, dueDate: task.dueDate },
      );
      sent++;
    }

    if (sent > 0) this.logger.log(`Recordatorios due_soon enviados: ${sent}`);
    return { sent };
  }
}
