import { ObjectType, Field, ID } from '@nestjs/graphql';

/** Arista de dependencia: `blocker` bloquea a `blocked`. */
@ObjectType()
export class TaskDependency {
  @Field(() => ID)
  blockerTaskId!: string;

  @Field(() => ID)
  blockedTaskId!: string;
}
