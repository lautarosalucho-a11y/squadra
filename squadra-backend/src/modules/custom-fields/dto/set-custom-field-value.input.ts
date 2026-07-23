import { InputType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsUUID, IsOptional } from 'class-validator';

@InputType()
export class SetCustomFieldValueInput {
  @Field(() => ID)
  @IsUUID()
  taskId!: string;

  @Field(() => ID)
  @IsUUID()
  customFieldId!: string;

  // { text: "..." } | { number: 42 } | { optionId: "o1" } | null para limpiar
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  value?: unknown;
}
