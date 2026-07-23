import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomFieldInput } from './dto/create-custom-field.input';
import { SetCustomFieldValueInput } from './dto/set-custom-field-value.input';
import { CustomFieldType } from './models/custom-field.model';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async createField(input: CreateCustomFieldInput) {
    if (input.type === CustomFieldType.dropdown && !input.options) {
      throw new BadRequestException(
        'Un campo dropdown requiere el arreglo de opciones',
      );
    }
    const last = await this.prisma.customField.findFirst({
      where: { projectId: input.projectId, deletedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return this.prisma.customField.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        type: input.type,
        options: input.options ?? undefined,
        position: last ? last.position + 1 : 1,
      },
    });
  }

  async deleteField(id: string) {
    await this.prisma.customField.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  listByProject(projectId: string) {
    return this.prisma.customField.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  /** Upsert del valor de un campo en una tarea (validado contra el tipo). */
  async setValue(input: SetCustomFieldValueInput) {
    const field = await this.prisma.customField.findFirst({
      where: { id: input.customFieldId, deletedAt: null },
    });
    if (!field) throw new NotFoundException('Campo personalizado no encontrado');

    this.validateValue(field.type, input.value);

    return this.prisma.customFieldValue.upsert({
      where: {
        taskId_customFieldId: {
          taskId: input.taskId,
          customFieldId: input.customFieldId,
        },
      },
      create: {
        taskId: input.taskId,
        customFieldId: input.customFieldId,
        value: input.value ?? undefined,
      },
      update: { value: input.value ?? undefined },
    });
  }

  valuesForTask(taskId: string) {
    return this.prisma.customFieldValue.findMany({ where: { taskId } });
  }

  /** Todos los valores de campos personalizados de las tareas de un proyecto. */
  async valuesForProject(projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true },
    });
    const taskIds = tasks.map((t: { id: string }) => t.id);
    return this.prisma.customFieldValue.findMany({
      where: { taskId: { in: taskIds } },
    });
  }

  // ---------- helpers ----------

  private validateValue(type: string, value: unknown) {
    if (value === null || value === undefined) return; // limpiar valor
    const v = value as Record<string, unknown>;
    if (type === CustomFieldType.text && typeof v.text !== 'string') {
      throw new BadRequestException('Se esperaba { text: string }');
    }
    if (type === CustomFieldType.number && typeof v.number !== 'number') {
      throw new BadRequestException('Se esperaba { number: number }');
    }
    if (type === CustomFieldType.dropdown && typeof v.optionId !== 'string') {
      throw new BadRequestException('Se esperaba { optionId: string }');
    }
  }
}
