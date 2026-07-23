import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { fractionalPosition } from '../../common/ordering';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import {
  CreateSectionInput,
  MoveSectionInput,
} from './dto/section.input';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateProjectInput) {
    return this.prisma.project.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description ?? null,
        portfolioId: input.portfolioId ?? null,
        defaultView: input.defaultView ?? 'list',
      },
    });
  }

  /** Resuelve el workspace del usuario (home o primer membership). */
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

  /** Portafolios accesibles por el usuario. */
  async myPortfolios(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m: { workspaceId: string }) => m.workspaceId);
    return this.prisma.portfolio.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Crea un portafolio en el workspace del usuario. */
  async createPortfolioForUser(userId: string, name: string) {
    const workspaceId = await this.resolveWorkspace(userId);
    return this.prisma.portfolio.create({
      data: { workspaceId, name, ownerId: userId },
    });
  }

  /** Asigna (o quita) un proyecto a un portafolio. */
  async setProjectPortfolio(projectId: string, portfolioId: string | null) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { portfolioId },
    });
  }

  /** Crea un proyecto en el workspace del usuario (home o su primer membership). */
  async createForUser(userId: string, name: string) {
    const workspaceId = await this.resolveWorkspace(userId);
    return this.prisma.project.create({
      data: { workspaceId, name, defaultView: 'board' },
    });
  }

  /** Proyectos accesibles por el usuario (según sus memberships). */
  async myProjects(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m: { workspaceId: string }) => m.workspaceId);
    return this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds }, archived: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Miembros del workspace del proyecto (para @menciones). */
  async members(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId: project.workspaceId },
      select: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });
    return memberships.map((m: { user: unknown }) => m.user);
  }

  async update(id: string, input: UpdateProjectInput) {
    await this.ensureExists(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        defaultView: input.defaultView ?? undefined,
        archived: input.archived ?? undefined,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string) {
    await this.ensureExists(id);
    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    return true;
  }

  listByWorkspace(workspaceId: string, includeArchived = false) {
    return this.prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        ...(includeArchived ? {} : { archived: false }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  // ---------- secciones ----------

  async createSection(input: CreateSectionInput) {
    await this.ensureExists(input.projectId);
    const last = await this.prisma.section.findFirst({
      where: { projectId: input.projectId, deletedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return this.prisma.section.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        position: last ? last.position + 1 : 1,
      },
    });
  }

  async moveSection(input: MoveSectionInput) {
    const before = input.beforeSectionId
      ? await this.prisma.section.findUnique({
          where: { id: input.beforeSectionId },
        })
      : null;
    const after = input.afterSectionId
      ? await this.prisma.section.findUnique({
          where: { id: input.afterSectionId },
        })
      : null;
    return this.prisma.section.update({
      where: { id: input.sectionId },
      data: {
        position: fractionalPosition(
          before ? before.position : null,
          after ? after.position : null,
        ),
      },
    });
  }

  listSections(projectId: string) {
    return this.prisma.section.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  async deleteSection(id: string) {
    await this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  private async ensureExists(id: string) {
    const p = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('Proyecto no encontrado');
  }
}
