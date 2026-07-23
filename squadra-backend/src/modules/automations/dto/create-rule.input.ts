import { InputType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateRuleInput {
  @Field(() => ID)
  @IsUUID()
  projectId!: string;

  @Field()
  @IsString()
  @MaxLength(160)
  name!: string;

  // { type: 'status_changed', to: 'in_review' } | { type: 'created' }
  @Field(() => GraphQLJSON)
  trigger!: unknown;

  // [{ field: 'assignee', op: 'is_empty' }]
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  conditions?: unknown;

  // [{ type: 'reassign', userId }, { type: 'add_comment', text }]
  @Field(() => GraphQLJSON)
  actions!: unknown;
}
