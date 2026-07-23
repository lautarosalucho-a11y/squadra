import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

/** Portafolio: agrupa proyectos dentro de un workspace. */
@ObjectType()
export class Portfolio {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
