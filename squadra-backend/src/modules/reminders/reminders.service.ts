import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const REMINDERS_QUEUE = 'reminders';
export const SCAN_DUE_SOON = 'scan-due-soon';

/**
 * Programa el escaneo periódico de vencimientos. El trabajo pesado vive en
 * RemindersProcessor; aquí solo se registra el job repetible al arrancar.
 */
@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDERS_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    // Cada hora; idempotente por jobId → no se duplica entre reinicios/instancias
    await this.queue.add(
      SCAN_DUE_SOON,
      {},
      {
        repeat: { pattern: '0 * * * *' },
        jobId: 'due-soon-hourly',
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    this.logger.log('Escaneo de vencimientos programado (cada hora)');
  }
}
