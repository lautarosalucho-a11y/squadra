import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { fractionalPosition } from '../../common/ordering';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { TaskFilterInput, GroupBy } from './dto/task-filter.input';
import {
  TASK_CHANGED,
  TaskChangeType,
  TaskChangedEvent,
} from '../realtime/events/task-events';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Crea una tarea. Deriva workspaceId del proyecto y calcula posición al final. */
  async create(input: CreateTaskInput, actorId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      select: { id: true, workspaceId: true },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const position =
      input.position ??
      (await this.nextPosition(input.projectId, input.sectionId ?? null));

    const task = await this.prisma.task.create({
      data: {
        id: input.id,
        workspaceId: project.workspaceId,
        projectId: input.projectId,
        sectionId: input.sectionId ?? null,
        parentTaskId: input.parentTaskId ?? null,
        // Sin responsable explícito → se asigna al creador (aparece en "Mis tareas").
        assigneeId: input.assigneeId ?? actorId,
        title: input.title,
        description: input.description ?? undefined,
        position,
        createdById: actorId,
      },
    });

    await this.logActivity(task.id, actorId, 'created');
    this.emit('created', task, actorId);
    return task;
  }

  /** Actualiza con control de concurrencia optimista opcional (edición offline). */
  async update(id: string, input: UpdateTaskInput, actorId: string) {
    const current = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Tarea no encontrada');

    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== current.version
    ) {
      throw new ConflictException(
        `Conflicto de versión: esperada ${input.expectedVersion}, actual ${current.version}`,
      );
    }

    const completedAt =
      input.status === 'done'
        ? new Date()
        : input.status !== undefined
          ? null
          : current.completedAt;

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        description: input.description ?? undefined,
        status: input.status ?? undefined,
        assigneeId:
          input.assigneeId === undefined ? undefined : input.assigneeId,
        startDate: input.startDate === undefined ? undefined : input.startDate,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate,
        completedAt,
        version: { increment: 1 },
      },
    });

    if (input.status && input.status !== current.status) {
      await this.logActivity(id, actorId, 'status_changed', 'status', {
        old: current.status,
        new: input.status,
      });
    }
    this.emit('updated', updated, actorId);
    return updated;
  }

  /** Mueve/reordena una tarea usando orden fraccional entre vecinos. */
  async move(input: MoveTaskInput, actorId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    const before = input.beforeTaskId
      ? await this.prisma.task.findUnique({ where: { id: input.beforeTaskId } })
      : null;
    const after = input.afterTaskId
      ? await this.prisma.task.findUnique({ where: { id: input.afterTaskId } })
      : null;

    const position = fractionalPosition(
      before ? before.position : null,
      after ? after.position : null,
    );

    const updated = await this.prisma.task.update({
      where: { id: input.taskId },
      data: {
        sectionId:
          input.sectionId === undefined ? undefined : input.sectionId,
        position,
        version: { increment: 1 },
      },
    });
    await this.logActivity(input.taskId, actorId, 'moved');
    this.emit('moved', updated, actorId);
    return updated;
  }

  /** Soft-delete: marca deletedAt para que el cliente móvil sincronice el borrado. */
  async softDelete(id: string, actorId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    await this.logActivity(id, actorId, 'deleted');
    this.emitDeleted(task.projectId, id, actorId);
    return true;
  }

  /** Dependencia: blocker bloquea a blocked (evita ciclo directo). */
  async addDependency(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException('Una tarea no puede bloquearse a sí misma');
    }
    await this.prisma.taskDependency.create({
      data: { blockerTaskId: blockerId, blockedTaskId: blockedId },
    });
    return this.prisma.task.findUniqueOrThrow({ where: { id: blockedId } });
  }

  /** Tareas asignadas al usuario en todos sus proyectos (home "Mis tareas"). */
  async myTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId, deletedAt: null },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  /** Lista las aristas de dependencia de un proyecto (para el Gantt). */
  async projectDependencies(projectId: string) {
    return this.prisma.taskDependency.findMany({
      where: { blocker: { projectId, deletedAt: null } },
      select: { blockerTaskId: true, blockedTaskId: true },
    });
  }

  /** Lista/agrupa tareas de un proyecto para las distintas vistas. */
  async projectTasks(
    projectId: string,
    filter?: TaskFilterInput,
    groupBy: GroupBy = GroupBy.NONE,
  ) {
    const where: Record<string, unknown> = { projectId };

    // Delta-sync: si updatedSince, incluir tombstones; si no, ocultar borrados.
    if (filter?.updatedSince) {
      where.updatedAt = { gt: filter.updatedSince };
    } else {
      where.deletedAt = null;
    }
    if (filter?.status) where.status = filter.status;
    if (filter?.assigneeId) where.assigneeId = filter.assigneeId;
    if (filter?.dueBefore) where.dueDate = { lte: filter.dueBefore };
    if (!filter?.includeCompleted && !filter?.status) {
      where.status = { not: 'done' };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { position: 'asc' },
    });

    if (groupBy === GroupBy.NONE) {
      return { groups: [{ key: null, tasks }] };
    }

    const keyOf = (t: { sectionId: string | null; assigneeId: string | null }) =>
      groupBy === GroupBy.SECTION ? t.sectionId : t.assigneeId;

    const map = new Map<string | null, typeof tasks>();
    for (const t of tasks) {
      const k = keyOf(t);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return {
      groups: Array.from(map.entries()).map(([key, groupTasks]) => ({
        key,
        tasks: groupTasks,
      })),
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  async subtasks(parentTaskId: string) {
    return this.prisma.task.findMany({
      where: { parentTaskId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  // ---------- helpers ----------

  private async nextPosition(projectId: string, sectionId: string | null) {
    const last = await this.prisma.task.findFirst({
      where: { projectId, sectionId, deletedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last ? last.position + 1 : 1;
  }

  private emit(
    type: TaskChangeType,
    task: { id: string; projectId: string },
    actorId: string,
  ) {
    const event: TaskChangedEvent = {
      type,
      projectId: task.projectId,
      taskId: task.id,
      actorId,
      source: 'user',
      task,
      at: new Date().toISOString(),
    };
    this.events.emit(TASK_CHANGED, event);
  }

  private emitDeleted(projectId: string, taskId: string, actorId: string) {
    const event: TaskChangedEvent = {
      type: 'deleted',
      projectId,
      taskId,
      actorId,
      source: 'user',
      at: new Date().toISOString(),
    };
    this.events.emit(TASK_CHANGED, event);
  }

  private async logActivity(
    taskId: string,
    actorId: string,
    action: string,
    field?: string,
    values?: { old?: unknown; new?: unknown },
  ) {
    await this.prisma.activityLog.create({
      data: {
        taskId,
        actorId,
        action,
        field,
        oldValue: values?.old ?? undefined,
        newValue: values?.new ?? undefined,
      },
    });
  }
}
