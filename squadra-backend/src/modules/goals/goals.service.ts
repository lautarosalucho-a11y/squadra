import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalInput, UpdateGoalInput } from './dto/goal.input';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveWorkspace(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { homeWorkspaceId: true },
    });
    let workspaceId = user?.homeWorkspaceId ?? null;
    if (!workspaceId) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId },
        select: { workspaceId: true },
      });
      workspaceId = membership?.workspaceId ?? null;
    }
    if (!workspaceId) {
      throw new NotFoundException('El usuario no pertenece a ningún workspace');
    }
    return workspaceId;
  }

  /** Objetivos de los workspaces del usuario. */
  async myGoals(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m: { workspaceId: string }) => m.workspaceId);
    return this.prisma.goal.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(userId: string, input: CreateGoalInput) {
    const workspaceId = await this.resolveWorkspace(userId);
    return this.prisma.goal.create({
      data: {
        workspaceId,
        title: input.title,
        description: input.description ?? null,
        ownerId: input.ownerId ?? userId,
        dueDate: input.dueDate ?? null,
      },
    });
  }

  async update(id: string, input: UpdateGoalInput) {
    const current = await this.prisma.goal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Objetivo no encontrado');
    return this.prisma.goal.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        description: input.description ?? undefined,
        status: input.status ?? undefined,
        progress: input.progress ?? undefined,
        ownerId: input.ownerId === undefined ? undefined : input.ownerId,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate,
        version: { increment: 1 },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }
}
