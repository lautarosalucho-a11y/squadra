import {
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class Notification {
  // BigInt en DB → se expone como String para no perder precisión
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID, { nullable: true })
  taskId?: string | null;

  @Field()
  type!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  payload?: unknown;

  @Field(() => GraphQLISODateTime, { nullable: true })
  readAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
