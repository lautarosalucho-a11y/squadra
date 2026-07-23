import {
  ObjectType,
  Field,
  ID,
  Int,
  GraphQLISODateTime,
} from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field(() => ID, { nullable: true })
  portfolioId?: string | null;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  defaultView!: string; // list | board | calendar | gantt

  @Field()
  archived!: boolean;

  @Field(() => Int)
  version!: number;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
