import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, GroupedTasks } from './models/task.model';
import { TaskDependency } from './models/task-dependency.model';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { TaskFilterInput, GroupBy } from './dto/task-filter.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Task)
@UseGuards(GqlAuthGuard)
export class TasksResolver {
  constructor(private readonly tasks: TasksService) {}

  @Query(() => Task, { name: 'task' })
  task(@Args('id', { type: () => ID }) id: string) {
    return this.tasks.findOne(id);
  }

  @Query(() => GroupedTasks, { name: 'projectTasks' })
  projectTasks(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('filter', { nullable: true }) filter?: TaskFilterInput,
    @Args('groupBy', { type: () => GroupBy, nullable: true })
    groupBy?: GroupBy,
  ) {
    return this.tasks.projectTasks(projectId, filter, groupBy ?? GroupBy.NONE);
  }

  @Mutation(() => Task)
  createTask(
    @Args('input') input: CreateTaskInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.create(input, user.userId);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTaskInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.update(id, input, user.userId);
  }

  @Mutation(() => Task)
  moveTask(
    @Args('input') input: MoveTaskInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.move(input, user.userId);
  }

  @Mutation(() => Boolean)
  deleteTask(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.softDelete(id, user.userId);
  }

  @Mutation(() => Task)
  addDependency(
    @Args('blockerId', { type: () => ID }) blockerId: string,
    @Args('blockedId', { type: () => ID }) blockedId: string,
  ) {
    return this.tasks.addDependency(blockerId, blockedId);
  }

  @Query(() => [TaskDependency], { name: 'projectDependencies' })
  projectDependencies(
    @Args('projectId', { type: () => ID }) projectId: string,
  ) {
    return this.tasks.projectDependencies(projectId);
  }

  /** Tareas asignadas al usuario autenticado (home "Mis tareas"). */
  @Query(() => [Task], { name: 'myTasks' })
  myTasks(@CurrentUser() user: AuthUser) {
    return this.tasks.myTasks(user.userId);
  }

  @ResolveField(() => [Task])
  subtasks(@Parent() task: Task) {
    return this.tasks.subtasks(task.id);
  }
}
