import { InputType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { CustomFieldType } from '../models/custom-field.model';

@InputType()
export class CreateCustomFieldInput {
  @Field(() => ID)
  @IsUUID()
  projectId!: string;

  @Field()
  @IsString()
  @MaxLength(120)
  name!: string;

  @Field(() => CustomFieldType)
  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  // Requerido/relevante solo para type = dropdown
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  options?: unknown;
}
