import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { CommentsModule } from './modules/comments/comments.module';
import { GoalsModule } from './modules/goals/goals.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      // Expone req en el contexto GraphQL para que el guard lea el header Authorization
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: new Redis(REDIS_URL, { maxRetriesPerRequest: null }),
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    CustomFieldsModule,
    TasksModule,
    RealtimeModule,
    NotificationsModule,
    AutomationsModule,
    RemindersModule,
    CommentsModule,
    GoalsModule,
    AttachmentsModule,
  ],
})
export class AppModule {}
