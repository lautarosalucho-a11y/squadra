import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';

const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
      },
    });
    return this.issueTokens(user);
  }

  /** Resuelve el workspace del usuario (home o su primer membership). */
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
      throw new ConflictException('No pertenecés a ningún equipo');
    }
    return workspaceId;
  }

  /** Miembros del equipo (workspace) del usuario autenticado. */
  async workspaceMembers(userId: string) {
    const workspaceId = await this.resolveWorkspace(userId);
    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId },
      select: {
        role: true,
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });
    return memberships.map((m: { role: string; user: unknown }) => m.user);
  }

  /**
   * Alta de un miembro por parte del dueño: crea (o reutiliza) el usuario y lo
   * suma como miembro del workspace del invitador.
   */
  async inviteMember(
    inviterId: string,
    email: string,
    fullName: string,
    password: string,
  ) {
    const workspaceId = await this.resolveWorkspace(inviterId);

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await this.prisma.user.create({
        data: { email, fullName, passwordHash, homeWorkspaceId: workspaceId },
      });
    }

    await this.prisma.membership.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      create: { workspaceId, userId: user.id, role: 'member' },
      update: {},
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    return this.issueTokens(user);
  }

  /** Rotación de refresh token: revoca el usado y emite uno nuevo. */
  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  }

  // ---------- helpers ----------

  private async issueTokens(user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  }) {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });

    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
