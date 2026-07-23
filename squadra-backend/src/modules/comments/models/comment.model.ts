import {
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

/** Comentario de una tarea. `body` es rich text (JSON) con menciones embebidas. */
@ObjectType()
export class Comment {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  taskId!: string;

  @Field(() => ID)
  authorId!: string;

  @Field(() => GraphQLJSON)
  body!: unknown;

  /** userIds mencionados en el comentario. */
  @Field(() => [ID])
  mentions!: string[];

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
