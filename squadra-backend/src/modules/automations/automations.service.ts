import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRuleInput } from './dto/create-rule.input';
import {
  TASK_CHANGED,
  TaskChangedEvent,
} from '../realtime/events/task-events';

// Actor de sistema para cambios originados por automatizaciones.
const SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000000';

interface Trigger {
  type: string; // 'created' | 'status_changed' | 'assignee_changed'
  to?: string;
}
interface Condition {
  field: string; // 'assignee' | 'status'
  op: string; // 'is_empty' | 'is_set' | 'equals'
  value?: unknown;
}
interface Action {
  type: string; // 'reassign' | 'move_to_section' | 'set_status' | 'add_comment'
  userId?: string;
  sectionId?: string;
  status?: string;
  text?: string;
}

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ---------- CRUD ----------

  async create(input: CreateRuleInput) {
    const project = await this.prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      select: { workspaceId: true },
    });
    if (!project) throw new Error('Proyecto no encontrado');
    return this.prisma.automationRule.create({
      data: {
        workspaceId: project.workspaceId,
        projectId: input.projectId,
        name: input.name,
        trigger: input.trigger as object,
        conditions: (input.conditions as object) ?? undefined,
        actions: input.actions as object,
      },
    });
  }

  listByProject(projectId: string) {
    return this.prisma.automationRule.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setEnabled(id: string, enabled: boolean) {
    await this.prisma.automationRule.update({ where: { id }, data: { enabled } });
    return true;
  }

  async delete(id: string) {
    await this.prisma.automationRule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  // ---------- Motor ----------

  @OnEvent(TASK_CHANGED)
  async onTaskChanged(event: TaskChangedEvent): Promise<void> {
    if (event.source === 'automation') return; // anti-bucle
    if (event.type === 'deleted') return;

    const rules = await this.prisma.automationRule.findMany({
      where: { projectId: event.projectId, enabled: true, deletedAt: null },
    });
    if (rules.length === 0) return;

    const task = await this.prisma.task.findFirst({
      where: { id: event.taskId, deletedAt: null },
    });
    if (!task) return;

    for (const rule of rules) {
      const trigger = rule.trigger as Trigger;
      if (!this.triggerMatches(trigger, event, task)) continue;
      if (!this.conditionsPass((rule.conditions as Condition[]) ?? [], task)) {
        continue;
      }
      await this.runActions((rule.actions as Action[]) ?? [], task, event);
    }
  }

  private triggerMatches(
    trigger: Trigger,
    event: TaskChangedEvent,
    task: { status: string },
  ): boolean {
    switch (trigger.type) {
      case 'created':
        return event.type === 'created';
      case 'status_changed':
        return (
          event.type === 'updated' &&
          (trigger.to === undefined || task.status === trigger.to)
        );
      case 'assignee_changed':
        return event.type === 'updated';
      default:
        return false;
    }
  }

  private conditionsPass(
    conditions: Condition[],
    task: { assigneeId: string | null; status: string },
  ): boolean {
    return conditions.every((c) => {
      const current =
        c.field === 'assignee' ? task.assigneeId : (task as Record<string, unknown>)[c.field];
      switch (c.op) {
        case 'is_empty':
          return current === null || current === undefined;
        case 'is_set':
          return current !== null && current !== undefined;
        case 'equals':
          return current === c.value;
        default:
          return false;
      }
    });
  }

  private async runActions(
    actions: Action[],
    task: { id: string; projectId: string },
    event: TaskChangedEvent,
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.applyAction(action, task);
      } catch (e) {
        this.logger.error(`Acción ${action.type} falló: ${String(e)}`);
      }
    }
    // Reemite el cambio (para UI en vivo) marcado como automation → sin re-disparar reglas
    const evt: TaskChangedEvent = {
      type: 'updated',
      projectId: task.projectId,
      taskId: task.id,
      actorId: SYSTEM_ACTOR,
      source: 'automation',
      at: new Date().toISOString(),
    };
    this.events.emit(TASK_CHANGED, evt);
  }

  private async applyAction(
    action: Action,
    task: { id: string },
  ): Promise<void> {
    switch (action.type) {
      case 'reassign':
        await this.prisma.task.update({
          where: { id: task.id },
          data: { assigneeId: action.userId ?? null, version: { increment: 1 } },
        });
        break;
      case 'move_to_section':
        await this.prisma.task.update({
          where: { id: task.id },
          data: { sectionId: action.sectionId ?? null, version: { increment: 1 } },
        });
        break;
      case 'set_status':
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: action.status, version: { increment: 1 } },
        });
        break;
      case 'add_comment':
        await this.prisma.comment.create({
          data: {
            taskId: task.id,
            authorId: SYSTEM_ACTOR,
            body: { text: action.text ?? '' },
          },
        });
        break;
      default:
        this.logger.warn(`Acción desconocida: ${action.type}`);
    }
  }
}
