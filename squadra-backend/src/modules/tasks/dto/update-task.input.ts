import { InputType, Field, ID, Int, GraphQLISODateTime } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDate,
  MaxLength,
} from 'class-validator';
import { TaskStatus } from '../models/task.model';

@InputType()
export class UpdateTaskInput {
  @Field({ nullable: true })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  title?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  description?: unknown;

  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  dueDate?: Date | null;

  /**
   * Control de concurrencia optimista para ediciones offline.
   * Si se envía y no coincide con la versión actual, se rechaza (conflicto).
   */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  expectedVersion?: number;
}
