import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional } from 'class-validator';

/**
 * Mueve una tarea entre secciones (drag Kanban) o la reordena.
 * beforeTaskId / afterTaskId definen los vecinos para el orden fraccional.
 */
@InputType()
export class MoveTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sectionId?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  beforeTaskId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  afterTaskId?: string;
}
