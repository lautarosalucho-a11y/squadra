import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { TaskMeta } from './models/task-meta.model';
import { AddCommentInput } from './dto/add-comment.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Comment)
@UseGuards(GqlAuthGuard)
export class CommentsResolver {
  constructor(private readonly comments: CommentsService) {}

  @Query(() => [Comment], { name: 'taskComments' })
  taskComments(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.comments.list(taskId);
  }

  @Mutation(() => Comment)
  addComment(
    @Args('input') input: AddCommentInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.add(input, user.userId);
  }

  @Query(() => [TaskMeta], { name: 'projectTaskMeta' })
  projectTaskMeta(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.projectTaskMeta(projectId, user.userId);
  }

  @Mutation(() => Boolean)
  markTaskCommentsRead(
    @Args('taskId', { type: () => ID }) taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.markTaskCommentsRead(taskId, user.userId);
  }
}
