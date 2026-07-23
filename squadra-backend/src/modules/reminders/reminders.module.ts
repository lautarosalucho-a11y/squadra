import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RemindersService, REMINDERS_QUEUE } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: REMINDERS_QUEUE }),
    NotificationsModule,
  ],
  providers: [RemindersService, RemindersProcessor],
})
export class RemindersModule {}
