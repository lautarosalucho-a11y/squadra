import {
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class AutomationRule {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  projectId!: string;

  @Field()
  name!: string;

  @Field()
  enabled!: boolean;

  @Field(() => GraphQLJSON)
  trigger!: unknown; // { type, ... }

  @Field(() => GraphQLJSON, { nullable: true })
  conditions?: unknown; // [{ field, op, value }]

  @Field(() => GraphQLJSON)
  actions!: unknown; // [{ type, ... }]

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
