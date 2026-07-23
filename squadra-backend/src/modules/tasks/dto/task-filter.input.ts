import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { TaskStatus } from '../models/task.model';

export enum GroupBy {
  NONE = 'NONE', // Vista Lista
  SECTION = 'SECTION', // Vista Kanban
  ASSIGNEE = 'ASSIGNEE',
}
registerEnumType(GroupBy, { name: 'GroupBy' });

@InputType()
export class TaskFilterInput {
  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  dueBefore?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeCompleted?: boolean;

  /**
   * Delta-sync: solo tareas modificadas después de este instante
   * (incluye tombstones con deletedAt para que el cliente los elimine).
   */
  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  updatedSince?: Date;
}
