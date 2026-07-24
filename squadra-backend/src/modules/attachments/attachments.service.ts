import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadAttachmentInput } from './dto/upload-attachment.input';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly meta = {
    id: true,
    taskId: true,
    fileName: true,
    mimeType: true,
    sizeBytes: true,
    uploadedById: true,
    createdAt: true,
  } as const;

  private toDto(a: { sizeBytes: bigint | null } & Record<string, unknown>) {
    return { ...a, sizeBytes: a.sizeBytes == null ? null : Number(a.sizeBytes) };
  }

  /** Adjuntos (metadatos) de una tarea. */
  async list(taskId: string) {
    const rows = await this.prisma.attachment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: this.meta,
    });
    return rows.map((r) => this.toDto(r));
  }

  /** Sube un archivo (base64) y lo guarda en la base, ligado a la tarea. */
  async upload(input: UploadAttachmentInput, userId: string) {
    const buffer = Buffer.from(input.base64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('Archivo vacío');
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB');
    }
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    const att = await this.prisma.attachment.create({
      data: {
        taskId: input.taskId,
        fileName: input.fileName,
        storageKey: 'inline',
        data: buffer,
        mimeType: input.mimeType ?? null,
        sizeBytes: buffer.length,
        uploadedById: userId,
      },
      select: this.meta,
    });
    return this.toDto(att);
  }

  /** Devuelve el contenido en base64 para descargar/previsualizar. */
  async data(id: string) {
    const att = await this.prisma.attachment.findFirst({
      where: { id, deletedAt: null },
      select: { fileName: true, mimeType: true, data: true },
    });
    if (!att || !att.data) throw new NotFoundException('Adjunto no encontrado');
    return {
      fileName: att.fileName,
      mimeType: att.mimeType,
      base64: Buffer.from(att.data).toString('base64'),
    };
  }

  async remove(id: string) {
    await this.prisma.attachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }
}
