import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
} from 'class-validator';

@InputType()
export class CreateTaskInput {
  @Field(() => ID)
  @IsUUID()
  projectId!: string;

  @Field()
  @IsString()
  @MaxLength(500)
  title!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  description?: unknown;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  // El cliente móvil puede generar el UUID offline y enviarlo
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  position?: number;
}
