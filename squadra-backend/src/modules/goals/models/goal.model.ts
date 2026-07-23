import {
  ObjectType,
  Field,
  ID,
  Int,
  registerEnumType,
  GraphQLISODateTime,
} from '@nestjs/graphql';

export enum GoalStatus {
  on_track = 'on_track',
  at_risk = 'at_risk',
  off_track = 'off_track',
  achieved = 'achieved',
}
registerEnumType(GoalStatus, { name: 'GoalStatus' });

@ObjectType()
export class Goal {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => ID, { nullable: true })
  ownerId?: string | null;

  @Field(() => GoalStatus)
  status!: GoalStatus;

  @Field(() => Int)
  progress!: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  dueDate?: Date | null;

  @Field(() => Int)
  version!: number;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
