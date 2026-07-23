import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import {
  TASK_CHANGED,
  TaskChangedEvent,
  NOTIFICATION_CREATED,
  NotificationCreatedEvent,
  COMMENT_CREATED,
  CommentCreatedEvent,
} from './events/task-events';

/**
 * Gateway de tiempo real.
 * - Autentica el handshake con JWT (mismo token que la API).
 * - Agrupa sockets en rooms `project:{id}`.
 * - Con REDIS_URL, activa el adapter Redis → broadcast entre instancias.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  async afterInit(server: Server): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL ausente: realtime en modo single-instance');
      return;
    }
    const pub = new Redis(url);
    const sub = pub.duplicate();
    server.adapter(createAdapter(pub, sub));
    this.logger.log('Adapter Redis activo (broadcast multi-instancia)');
  }

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);
    try {
      const payload = this.jwt.verify<{ sub: string }>(token ?? '');
      client.data.userId = payload.sub;
      // Room personal para notificaciones dirigidas (Inbox en vivo)
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinProject')
  joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): { joined: string } {
    client.join(`project:${projectId}`);
    return { joined: projectId };
  }

  @SubscribeMessage('leaveProject')
  leaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): { left: string } {
    client.leave(`project:${projectId}`);
    return { left: projectId };
  }

  /** Recibe el evento de dominio y hace fan-out al room del proyecto. */
  @OnEvent(TASK_CHANGED)
  onTaskChanged(event: TaskChangedEvent): void {
    this.server.to(`project:${event.projectId}`).emit('taskChanged', event);
  }

  /** Push de Inbox en vivo al room personal del usuario destinatario. */
  @OnEvent(NOTIFICATION_CREATED)
  onNotificationCreated(event: NotificationCreatedEvent): void {
    this.server.to(`user:${event.userId}`).emit('inboxUpdated', event);
  }

  /** Push de comentario nuevo al room del proyecto (hilo en vivo). */
  @OnEvent(COMMENT_CREATED)
  onCommentCreated(event: CommentCreatedEvent): void {
    this.server.to(`project:${event.projectId}`).emit('commentAdded', event);
  }
}
