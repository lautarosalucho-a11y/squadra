import {
  ObjectType,
  Field,
  ID,
  Float,
  Int,
  registerEnumType,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

export enum TaskStatus {
  todo = 'todo',
  in_progress = 'in_progress',
  in_review = 'in_review',
  done = 'done',
  blocked = 'blocked',
}
registerEnumType(TaskStatus, { name: 'TaskStatus' });

@ObjectType()
export class Task {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  description?: unknown;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field(() => ID)
  projectId!: string;

  @Field(() => ID, { nullable: true })
  sectionId?: string | null;

  @Field(() => ID, { nullable: true })
  parentTaskId?: string | null;

  @Field(() => ID, { nullable: true })
  assigneeId?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  dueDate?: Date | null;

  @Field(() => Float)
  position!: number;

  @Field(() => Int)
  version!: number;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  // Resuelto por @ResolveField
  @Field(() => [Task], { nullable: true })
  subtasks?: Task[];
}

@ObjectType()
export class TaskGroup {
  @Field(() => ID, { nullable: true })
  key!: string | null; // sectionId | assigneeId | null

  @Field({ nullable: true })
  label?: string;

  @Field(() => [Task])
  tasks!: Task[];
}

@ObjectType()
export class GroupedTasks {
  @Field(() => [TaskGroup])
  groups!: TaskGroup[];
}
