import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Section {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  projectId!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  position!: number;
}
